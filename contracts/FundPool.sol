// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FundPool
 * @notice A secure fund-pooling contract for community collections on Avalanche C-Chain.
 * @dev Handles pool creation, fixed-amount contributions, participant tracking,
 *      fund locking, and creator-managed withdrawals with full transparency.
 */
contract FundPool {
    // ──────────────────── Types ────────────────────

    enum PoolStatus {
        Active,
        Completed,
        Cancelled,
        Withdrawn
    }

    struct Pool {
        uint256 id;
        address creator;
        string title;
        string description;
        string groupId;             // off-chain Supabase group/channel ID
        uint256 contributionAmount; // fixed per-person contribution in wei
        uint256 goalAmount;         // optional target (0 = unlimited)
        uint256 totalCollected;
        uint256 participantCount;
        uint256 createdAt;
        uint256 deadline;           // 0 = no deadline
        PoolStatus status;
    }

    struct Contribution {
        address contributor;
        uint256 amount;
        uint256 timestamp;
        uint256 poolId;
    }

    // ──────────────────── State ────────────────────

    uint256 public nextPoolId;
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => address[]) public poolParticipants;
    mapping(uint256 => mapping(address => bool)) public hasContributed;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(address => uint256[]) public userPools;        // pools created by user
    mapping(address => uint256[]) public userContributions; // pools user contributed to

    Contribution[] public allContributions; // global ledger for transparency

    // ──────────────────── Events ────────────────────

    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        string title,
        uint256 contributionAmount,
        uint256 goalAmount,
        string groupId
    );

    event ContributionMade(
        uint256 indexed poolId,
        address indexed contributor,
        uint256 amount,
        uint256 newTotal
    );

    event FundsWithdrawn(
        uint256 indexed poolId,
        address indexed creator,
        uint256 amount
    );

    event PoolStatusChanged(
        uint256 indexed poolId,
        PoolStatus newStatus
    );

    event PoolCancelled(
        uint256 indexed poolId,
        address indexed creator
    );

    // ──────────────────── Modifiers ────────────────────

    modifier onlyPoolCreator(uint256 _poolId) {
        require(pools[_poolId].creator == msg.sender, "FundPool: caller is not pool creator");
        _;
    }

    modifier poolExists(uint256 _poolId) {
        require(_poolId < nextPoolId, "FundPool: pool does not exist");
        _;
    }

    modifier poolIsActive(uint256 _poolId) {
        require(pools[_poolId].status == PoolStatus.Active, "FundPool: pool is not active");
        if (pools[_poolId].deadline > 0) {
            require(block.timestamp <= pools[_poolId].deadline, "FundPool: pool deadline passed");
        }
        _;
    }

    // ──────────────────── Pool Management ────────────────────

    /**
     * @notice Create a new fund pool.
     * @param _title           Human-readable pool title
     * @param _description     Purpose / description
     * @param _groupId         Off-chain Supabase group ID for auto-joining
     * @param _contributionAmt Fixed contribution per participant (in wei)
     * @param _goalAmount      Target collection amount (0 = no cap)
     * @param _deadline        Unix timestamp deadline (0 = no deadline)
     */
    function createPool(
        string calldata _title,
        string calldata _description,
        string calldata _groupId,
        uint256 _contributionAmt,
        uint256 _goalAmount,
        uint256 _deadline
    ) external returns (uint256 poolId) {
        require(_contributionAmt > 0, "FundPool: contribution must be > 0");
        require(bytes(_title).length > 0, "FundPool: title required");
        if (_deadline > 0) {
            require(_deadline > block.timestamp, "FundPool: deadline must be in future");
        }

        poolId = nextPoolId++;

        pools[poolId] = Pool({
            id: poolId,
            creator: msg.sender,
            title: _title,
            description: _description,
            groupId: _groupId,
            contributionAmount: _contributionAmt,
            goalAmount: _goalAmount,
            totalCollected: 0,
            participantCount: 0,
            createdAt: block.timestamp,
            deadline: _deadline,
            status: PoolStatus.Active
        });

        userPools[msg.sender].push(poolId);

        emit PoolCreated(poolId, msg.sender, _title, _contributionAmt, _goalAmount, _groupId);
    }

    /**
     * @notice Contribute the fixed amount to a pool. Automatically joins the user.
     * @param _poolId The pool to contribute to
     */
    function contribute(uint256 _poolId)
        external
        payable
        poolExists(_poolId)
        poolIsActive(_poolId)
    {
        Pool storage pool = pools[_poolId];

        require(!hasContributed[_poolId][msg.sender], "FundPool: already contributed");
        require(msg.value == pool.contributionAmount, "FundPool: incorrect contribution amount");

        if (pool.goalAmount > 0) {
            require(
                pool.totalCollected + msg.value <= pool.goalAmount,
                "FundPool: goal already reached"
            );
        }

        hasContributed[_poolId][msg.sender] = true;
        contributions[_poolId][msg.sender] = msg.value;
        poolParticipants[_poolId].push(msg.sender);
        pool.totalCollected += msg.value;
        pool.participantCount++;

        userContributions[msg.sender].push(_poolId);

        allContributions.push(Contribution({
            contributor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            poolId: _poolId
        }));

        emit ContributionMade(_poolId, msg.sender, msg.value, pool.totalCollected);

        // Auto-complete pool if goal reached
        if (pool.goalAmount > 0 && pool.totalCollected >= pool.goalAmount) {
            pool.status = PoolStatus.Completed;
            emit PoolStatusChanged(_poolId, PoolStatus.Completed);
        }
    }

    /**
     * @notice Withdraw collected funds. Only the pool creator can call this.
     * @param _poolId The pool to withdraw from
     */
    function withdrawFunds(uint256 _poolId)
        external
        poolExists(_poolId)
        onlyPoolCreator(_poolId)
    {
        Pool storage pool = pools[_poolId];
        require(
            pool.status == PoolStatus.Active || pool.status == PoolStatus.Completed,
            "FundPool: cannot withdraw from this pool"
        );
        require(pool.totalCollected > 0, "FundPool: nothing to withdraw");

        uint256 amount = pool.totalCollected;
        pool.totalCollected = 0;
        pool.status = PoolStatus.Withdrawn;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "FundPool: withdrawal failed");

        emit FundsWithdrawn(_poolId, msg.sender, amount);
        emit PoolStatusChanged(_poolId, PoolStatus.Withdrawn);
    }

    /**
     * @notice Cancel an active pool (creator only). Refunds all participants.
     */
    function cancelPool(uint256 _poolId)
        external
        poolExists(_poolId)
        onlyPoolCreator(_poolId)
        poolIsActive(_poolId)
    {
        Pool storage pool = pools[_poolId];
        pool.status = PoolStatus.Cancelled;

        // Refund all participants
        address[] memory participants = poolParticipants[_poolId];
        for (uint256 i = 0; i < participants.length; i++) {
            uint256 refundAmt = contributions[_poolId][participants[i]];
            if (refundAmt > 0) {
                contributions[_poolId][participants[i]] = 0;
                (bool success, ) = payable(participants[i]).call{value: refundAmt}("");
                require(success, "FundPool: refund failed");
            }
        }

        pool.totalCollected = 0;
        emit PoolCancelled(_poolId, msg.sender);
        emit PoolStatusChanged(_poolId, PoolStatus.Cancelled);
    }

    // ──────────────────── View Functions ────────────────────

    function getPool(uint256 _poolId) external view poolExists(_poolId) returns (Pool memory) {
        return pools[_poolId];
    }

    function getPoolParticipants(uint256 _poolId) external view poolExists(_poolId) returns (address[] memory) {
        return poolParticipants[_poolId];
    }

    function getUserCreatedPools(address _user) external view returns (uint256[] memory) {
        return userPools[_user];
    }

    function getUserContributedPools(address _user) external view returns (uint256[] memory) {
        return userContributions[_user];
    }

    function getContributionCount() external view returns (uint256) {
        return allContributions.length;
    }

    function getPoolCount() external view returns (uint256) {
        return nextPoolId;
    }

    /**
     * @notice Check whether a user has contributed to a specific pool.
     */
    function isParticipant(uint256 _poolId, address _user)
        external
        view
        poolExists(_poolId)
        returns (bool)
    {
        return hasContributed[_poolId][_user];
    }

    /**
     * @notice Returns contribution details for a specific pool range (pagination).
     */
    function getContributions(uint256 _offset, uint256 _limit)
        external
        view
        returns (Contribution[] memory result)
    {
        uint256 total = allContributions.length;
        if (_offset >= total) return new Contribution[](0);

        uint256 end = _offset + _limit;
        if (end > total) end = total;
        uint256 count = end - _offset;

        result = new Contribution[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allContributions[_offset + i];
        }
    }
}
