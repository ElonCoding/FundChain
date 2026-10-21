// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  FlexibleCommunityPool
 * @author FundChain — Avalanche Speed Run Hackathon
 * @notice Production fund-pooling contract with:
 *         • EventPayout pools — creator transfers collected AVAX to any recipient
 *         • LuckyDraw pools   — on-chain pseudo-randomness selects winner instantly
 *
 * Contribution modes
 * ──────────────────
 * Fixed    : every participant pays exactly `contributionAmount` wei.
 * Flexible : participant pays any value in [minContribution, maxContribution].
 *
 * Randomness
 * ──────────
 * Uses block.prevrandao (EIP-4399) + block.timestamp + block.number + participant
 * addresses to derive a winner index. No oracle, no subscription, no LINK needed.
 * Suitable for hackathon / testnet deployments. For mainnet high-value draws,
 * consider upgrading to Chainlink VRF.
 *
 * Deploy on Remix
 * ───────────────
 * 1. Paste this file into Remix
 * 2. Compiler: 0.8.20, Optimization ON (200 runs)
 * 3. Environment: Injected Provider (MetaMask → Fuji)
 * 4. Deploy — NO constructor args required
 */
contract FlexibleCommunityPool {

    /* ══════════════════════════════════════════════════════════════════
       Domain Enums & Structs
    ══════════════════════════════════════════════════════════════════ */

    enum PoolType   { EventPayout, LuckyDraw }
    enum PoolStatus { Active, Completed, Cancelled, Withdrawn }

    struct Pool {
        uint256    id;
        address    creator;
        PoolType   poolType;
        string     title;
        string     description;
        string     groupId;             // off-chain Supabase conversation ID

        // Contribution bounds (wei)
        uint256    contributionAmount;  // fixed; 0 = flexible mode
        uint256    minContribution;
        uint256    maxContribution;     // 0 = unlimited

        // EventPayout destination
        address    recipientAddress;    // address(0) → creator

        // Financials
        uint256    totalCollected;
        uint256    participantCount;

        // Time
        uint256    createdAt;
        uint256    deadline;            // 0 = no deadline

        PoolStatus status;
        address    winner;             // set after lucky draw
    }

    struct Contribution {
        address  contributor;
        uint256  amount;
        uint256  timestamp;
        uint256  poolId;
    }

    /* ══════════════════════════════════════════════════════════════════
       State
    ══════════════════════════════════════════════════════════════════ */

    uint256 public nextPoolId;

    mapping(uint256 => Pool)                          public pools;
    mapping(uint256 => address[])                     public poolParticipants;
    mapping(uint256 => mapping(address => bool))      public hasContributed;
    mapping(uint256 => mapping(address => uint256))   public contributions;
    mapping(address => uint256[])                     public userPools;
    mapping(address => uint256[])                     public userContributions;

    Contribution[] public allContributions;

    /* ══════════════════════════════════════════════════════════════════
       Events
    ══════════════════════════════════════════════════════════════════ */

    event PoolCreated(
        uint256  indexed poolId,
        address  indexed creator,
        PoolType         poolType,
        string           title,
        uint256          contributionAmount,
        string           groupId
    );

    event ContributionMade(
        uint256  indexed poolId,
        address  indexed contributor,
        uint256          amount,
        uint256          newTotal
    );

    event WinnerPicked(
        uint256 indexed poolId,
        address indexed winner,
        uint256         prizeAmount
    );

    event PayoutExecuted(
        uint256  indexed poolId,
        address  indexed recipient,
        uint256          amount,
        PoolType         poolType
    );

    event PoolCancelled(
        uint256 indexed poolId,
        address indexed creator
    );

    event PoolStatusChanged(
        uint256    indexed poolId,
        PoolStatus         newStatus
    );

    /* ══════════════════════════════════════════════════════════════════
       Modifiers
    ══════════════════════════════════════════════════════════════════ */

    modifier onlyPoolCreator(uint256 _poolId) {
        require(pools[_poolId].creator == msg.sender, "FCP: not creator");
        _;
    }

    modifier poolExists(uint256 _poolId) {
        require(_poolId < nextPoolId, "FCP: pool not found");
        _;
    }

    modifier poolIsActive(uint256 _poolId) {
        require(pools[_poolId].status == PoolStatus.Active, "FCP: pool not active");
        if (pools[_poolId].deadline > 0) {
            require(block.timestamp <= pools[_poolId].deadline, "FCP: deadline passed");
        }
        _;
    }

    /* ══════════════════════════════════════════════════════════════════
       Constructor
    ══════════════════════════════════════════════════════════════════ */

    /// @notice No constructor args — deploy directly from Remix with zero config.
    constructor() {}

    /* ══════════════════════════════════════════════════════════════════
       Pool Creation
    ══════════════════════════════════════════════════════════════════ */

    function createEventPool(
        string  calldata _title,
        string  calldata _description,
        string  calldata _groupId,
        uint256          _contributionAmt,
        uint256          _minContribution,
        uint256          _maxContribution,
        address          _recipientAddress,
        uint256          _deadline
    ) external returns (uint256 poolId) {
        _validateParams(_title, _contributionAmt, _minContribution, _deadline);
        poolId = _initPool(
            _title, _description, _groupId,
            _contributionAmt, _minContribution, _maxContribution,
            _recipientAddress, _deadline, PoolType.EventPayout
        );
    }

    function createLuckyDrawPool(
        string  calldata _title,
        string  calldata _description,
        string  calldata _groupId,
        uint256          _contributionAmt,
        uint256          _minContribution,
        uint256          _maxContribution,
        uint256          _deadline
    ) external returns (uint256 poolId) {
        _validateParams(_title, _contributionAmt, _minContribution, _deadline);
        poolId = _initPool(
            _title, _description, _groupId,
            _contributionAmt, _minContribution, _maxContribution,
            address(0), _deadline, PoolType.LuckyDraw
        );
    }

    /* ══════════════════════════════════════════════════════════════════
       Contributions
    ══════════════════════════════════════════════════════════════════ */

    function contribute(uint256 _poolId)
        external
        payable
        poolExists(_poolId)
        poolIsActive(_poolId)
    {
        Pool storage pool = pools[_poolId];
        require(!hasContributed[_poolId][msg.sender], "FCP: already contributed");
        _validateAmount(pool, msg.value);

        hasContributed[_poolId][msg.sender] = true;
        contributions[_poolId][msg.sender]  = msg.value;
        poolParticipants[_poolId].push(msg.sender);
        pool.totalCollected   += msg.value;
        pool.participantCount++;
        userContributions[msg.sender].push(_poolId);

        allContributions.push(Contribution({
            contributor: msg.sender,
            amount:      msg.value,
            timestamp:   block.timestamp,
            poolId:      _poolId
        }));

        emit ContributionMade(_poolId, msg.sender, msg.value, pool.totalCollected);
    }

    /* ══════════════════════════════════════════════════════════════════
       LuckyDraw — On-chain Pseudo-randomness (no oracle)
    ══════════════════════════════════════════════════════════════════ */

    /**
     * @notice Instantly picks a winner using on-chain entropy.
     *         Single transaction — no Chainlink VRF subscription or LINK required.
     *
     * Entropy sources mixed into the winner hash:
     *   • block.prevrandao  — validator-committed randomness beacon (EIP-4399)
     *   • block.timestamp   — current block time
     *   • block.number      — block height
     *   • poolId            — pool identifier
     *   • all participant addresses — makes front-running economically impractical
     *                                 (attacker can't predict which address list)
     *
     * @dev    Only the pool creator can trigger the draw.
     *         Pool must have ≥ 1 participant and > 0 AVAX collected.
     */
    function triggerLuckyDraw(uint256 _poolId)
        external
        poolExists(_poolId)
        onlyPoolCreator(_poolId)
    {
        Pool storage pool = pools[_poolId];
        require(pool.poolType == PoolType.LuckyDraw,                      "FCP: not LuckyDraw");
        require(pool.status   == PoolStatus.Active ||
                pool.status   == PoolStatus.Completed,                    "FCP: invalid status");
        require(pool.totalCollected > 0,                                  "FCP: no funds");
        require(pool.participantCount > 0,                                "FCP: no participants");
        require(pool.winner == address(0),                                "FCP: winner exists");

        // ── Derive pseudo-random winner index ───────────────────────────────
        // Pack all participants into the hash so the result depends on the exact
        // membership state — not just publicly-known block data.
        address[] memory participants = poolParticipants[_poolId];

        bytes32 seed = keccak256(abi.encodePacked(
            block.prevrandao,        // EIP-4399 validator randomness beacon
            block.timestamp,
            block.number,
            _poolId,
            participants             // full list — harder to manipulate
        ));

        uint256 winnerIdx = uint256(seed) % pool.participantCount;
        address winner    = participants[winnerIdx];

        // ── Transfer prize ───────────────────────────────────────────────────
        uint256 prize       = pool.totalCollected;
        pool.totalCollected = 0;
        pool.winner         = winner;
        pool.status         = PoolStatus.Withdrawn;

        (bool ok, ) = payable(winner).call{value: prize}("");
        require(ok, "FCP: prize transfer failed");

        emit WinnerPicked(_poolId, winner, prize);
        emit PayoutExecuted(_poolId, winner, prize, PoolType.LuckyDraw);
        emit PoolStatusChanged(_poolId, PoolStatus.Withdrawn);
    }

    /* ══════════════════════════════════════════════════════════════════
       EventPayout
    ══════════════════════════════════════════════════════════════════ */

    /**
     * @notice Transfer collected funds to the designated recipient.
     *         EventPayout pools only — creator calls this.
     * @param  _poolId     The pool to settle
     * @param  _recipient  Override recipient (pass address(0) → use pool.recipientAddress → creator)
     */
    function payoutToRecipient(uint256 _poolId, address _recipient)
        external
        poolExists(_poolId)
        onlyPoolCreator(_poolId)
    {
        Pool storage pool = pools[_poolId];
        require(pool.poolType == PoolType.EventPayout,                "FCP: not EventPayout");
        require(pool.status == PoolStatus.Active ||
                pool.status == PoolStatus.Completed,                  "FCP: cannot payout");
        require(pool.totalCollected > 0,                              "FCP: nothing to pay out");

        address target = _recipient != address(0)
            ? _recipient
            : (pool.recipientAddress != address(0) ? pool.recipientAddress : pool.creator);

        uint256 amount      = pool.totalCollected;
        pool.totalCollected = 0;
        pool.status         = PoolStatus.Withdrawn;

        (bool ok, ) = payable(target).call{value: amount}("");
        require(ok, "FCP: payout failed");

        emit PayoutExecuted(_poolId, target, amount, PoolType.EventPayout);
        emit PoolStatusChanged(_poolId, PoolStatus.Withdrawn);
    }

    /// @notice Creator self-withdraw fallback.
    function withdrawFunds(uint256 _poolId)
        external
        poolExists(_poolId)
        onlyPoolCreator(_poolId)
    {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.Active ||
                pool.status == PoolStatus.Completed, "FCP: cannot withdraw");
        require(pool.totalCollected > 0,             "FCP: nothing to withdraw");

        uint256 amount      = pool.totalCollected;
        pool.totalCollected = 0;
        pool.status         = PoolStatus.Withdrawn;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "FCP: withdrawal failed");

        emit PayoutExecuted(_poolId, msg.sender, amount, pool.poolType);
        emit PoolStatusChanged(_poolId, PoolStatus.Withdrawn);
    }

    /* ══════════════════════════════════════════════════════════════════
       Cancel & Refunds
    ══════════════════════════════════════════════════════════════════ */

    function cancelPool(uint256 _poolId)
        external
        poolExists(_poolId)
        onlyPoolCreator(_poolId)
        poolIsActive(_poolId)
    {
        Pool storage pool = pools[_poolId];
        pool.status = PoolStatus.Cancelled;

        address[] memory participants = poolParticipants[_poolId];
        for (uint256 i = 0; i < participants.length; i++) {
            uint256 refund = contributions[_poolId][participants[i]];
            if (refund > 0) {
                contributions[_poolId][participants[i]] = 0;
                (bool ok, ) = payable(participants[i]).call{value: refund}("");
                require(ok, "FCP: refund failed");
            }
        }

        pool.totalCollected = 0;
        emit PoolCancelled(_poolId, msg.sender);
        emit PoolStatusChanged(_poolId, PoolStatus.Cancelled);
    }

    /* ══════════════════════════════════════════════════════════════════
       View Functions
    ══════════════════════════════════════════════════════════════════ */

    function getPool(uint256 _poolId) external view poolExists(_poolId) returns (Pool memory) {
        return pools[_poolId];
    }

    function getPoolParticipants(uint256 _poolId) external view poolExists(_poolId) returns (address[] memory) {
        return poolParticipants[_poolId];
    }

    function isParticipant(uint256 _poolId, address _user) external view poolExists(_poolId) returns (bool) {
        return hasContributed[_poolId][_user];
    }

    function getContributionByUser(uint256 _poolId, address _user) external view poolExists(_poolId) returns (uint256) {
        return contributions[_poolId][_user];
    }

    function getUserCreatedPools(address _user) external view returns (uint256[] memory) {
        return userPools[_user];
    }

    function getUserContributedPools(address _user) external view returns (uint256[] memory) {
        return userContributions[_user];
    }

    function getPoolCount() external view returns (uint256) { return nextPoolId; }

    function getContributions(uint256 _offset, uint256 _limit)
        external view
        returns (Contribution[] memory result)
    {
        uint256 total = allContributions.length;
        if (_offset >= total) return new Contribution[](0);
        uint256 end = _offset + _limit > total ? total : _offset + _limit;
        result = new Contribution[](end - _offset);
        for (uint256 i = 0; i < end - _offset; i++) {
            result[i] = allContributions[_offset + i];
        }
    }

    /* ══════════════════════════════════════════════════════════════════
       Internal Helpers
    ══════════════════════════════════════════════════════════════════ */

    function _validateParams(
        string calldata _title,
        uint256 _contributionAmt,
        uint256 _minContribution,
        uint256 _deadline
    ) internal view {
        require(bytes(_title).length > 0,                     "FCP: title required");
        require(_contributionAmt > 0 || _minContribution > 0, "FCP: set contribution");
        if (_deadline > 0) require(_deadline > block.timestamp, "FCP: deadline in past");
    }

    function _initPool(
        string  calldata _title,
        string  calldata _description,
        string  calldata _groupId,
        uint256          _contributionAmt,
        uint256          _minContribution,
        uint256          _maxContribution,
        address          _recipient,
        uint256          _deadline,
        PoolType         _poolType
    ) internal returns (uint256 poolId) {
        poolId = nextPoolId++;

        pools[poolId] = Pool({
            id:                 poolId,
            creator:            msg.sender,
            poolType:           _poolType,
            title:              _title,
            description:        _description,
            groupId:            _groupId,
            contributionAmount: _contributionAmt,
            minContribution:    _minContribution,
            maxContribution:    _maxContribution,
            recipientAddress:   _recipient,
            totalCollected:     0,
            participantCount:   0,
            createdAt:          block.timestamp,
            deadline:           _deadline,
            status:             PoolStatus.Active,
            winner:             address(0)
        });

        userPools[msg.sender].push(poolId);
        emit PoolCreated(poolId, msg.sender, _poolType, _title, _contributionAmt, _groupId);
    }

    function _validateAmount(Pool storage pool, uint256 _value) internal view {
        if (pool.contributionAmount > 0) {
            require(_value == pool.contributionAmount, "FCP: wrong fixed amount");
        } else {
            require(_value >= pool.minContribution, "FCP: below minimum");
            if (pool.maxContribution > 0) {
                require(_value <= pool.maxContribution, "FCP: above maximum");
            }
        }
    }

    /// @notice Allow contract to receive AVAX directly (safety net).
    receive() external payable {}
}
