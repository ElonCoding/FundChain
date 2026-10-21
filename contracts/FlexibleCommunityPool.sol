// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ── Chainlink VRF v2.5 ──────────────────────────────────────────────────────
// Install: npm install @chainlink/contracts
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient}       from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title  FlexibleCommunityPool
 * @author FundChain — Avalanche Speed Run Hackathon
 * @notice Production fund-pooling contract with:
 *         • EventPayout pools — creator transfers collected AVAX to any recipient
 *         • LuckyDraw pools   — Chainlink VRF v2.5 selects a verifiably-random winner
 *
 * Contribution modes
 * ──────────────────
 * Fixed    : every participant pays exactly `contributionAmount` wei.
 * Flexible : participant pays any value in [minContribution, maxContribution].
 *
 * Chainlink VRF v2.5 — Avalanche Fuji Testnet
 * ─────────────────────────────────────────────
 * Docs: https://docs.chain.link/vrf/v2-5/supported-networks#avalanche-fuji-testnet
 *
 * VRF Coordinator : 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE
 * Key Hash (500gwei gas lane):
 *                   0xc799bd1e3bd4d1a41cd4968997a4e68c9ec90699c33cc956b3b7e50c7a4f6af7
 * LINK Token       : 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846
 *
 * HOW TO SET UP
 * 1. Create a VRF subscription at https://vrf.chain.link/fuji
 * 2. Fund it with at least 2 LINK
 * 3. Deploy this contract, passing your subscriptionId to the constructor
 * 4. Add the deployed contract address as a "consumer" in the VRF subscription UI
 */
contract FlexibleCommunityPool is VRFConsumerBaseV2Plus {

    /* ══════════════════════════════════════════════════════════════════
       VRF v2.5 Config
    ══════════════════════════════════════════════════════════════════ */

    /// @dev Set at construction; cannot be changed after deployment.
    uint256 public immutable s_subscriptionId;

    /// @dev Avalanche Fuji 500-gwei gas lane key hash.
    bytes32 public immutable s_keyHash;

    /// @dev Number of block confirmations before the VRF response is accepted.
    uint16  public constant  REQUEST_CONFIRMATIONS = 3;

    /// @dev Gas limit for `fulfillRandomWords` callback.
    ///      ~200 000 is safe for the winner-selection + AVAX transfer logic.
    uint32  public constant  CALLBACK_GAS_LIMIT    = 200_000;

    /// @dev We only need 1 random word per draw.
    uint32  public constant  NUM_WORDS             = 1;

    /* ══════════════════════════════════════════════════════════════════
       Domain Enums & Structs
    ══════════════════════════════════════════════════════════════════ */

    enum PoolType   { EventPayout, LuckyDraw }
    enum PoolStatus { Active, Completed, Cancelled, Withdrawn, PendingVRF }

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
        address    winner;             // set after VRF fulfillment
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

    /// @dev VRF requestId → poolId (to process fulfillment)
    mapping(uint256 => uint256) public vrfRequestToPool;

    /// @dev poolId → VRF requestId (to surface in UI)
    mapping(uint256 => uint256) public poolVrfRequest;

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

    /// @notice Emitted when a VRF random-words request is submitted.
    event WinnerDrawRequested(
        uint256 indexed poolId,
        uint256 indexed vrfRequestId
    );

    /// @notice Emitted when Chainlink VRF fulfills the request and a winner is chosen.
    event WinnerPicked(
        uint256 indexed poolId,
        address indexed winner,
        uint256         prizeAmount,
        uint256         vrfRequestId
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

    /**
     * @param _vrfCoordinator  Chainlink VRF v2.5 coordinator address
     *                         Fuji: 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE
     * @param _subscriptionId  Your VRF subscription ID (from vrf.chain.link)
     * @param _keyHash         Gas-lane key hash
     *                         Fuji 500gwei: 0xc799bd1e3bd4d1a41cd4968997a4e68c9ec90699c33cc956b3b7e50c7a4f6af7
     */
    constructor(
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash
    )
        VRFConsumerBaseV2Plus(_vrfCoordinator)
    {
        s_subscriptionId = _subscriptionId;
        s_keyHash        = _keyHash;
    }

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
       LuckyDraw — Chainlink VRF v2.5
    ══════════════════════════════════════════════════════════════════ */

    /**
     * @notice Step 1 — Creator calls this to request randomness from Chainlink VRF.
     *         The pool status is set to `PendingVRF`; funds are locked until fulfilled.
     *         Costs LINK from the subscription. Call completes instantly; the callback
     *         arrives in a separate transaction from the Chainlink oracle (~30-90 sec).
     *
     * @dev    Requires the contract to be registered as a consumer in the VRF subscription.
     */
    function requestWinnerDraw(uint256 _poolId)
        external
        poolExists(_poolId)
        onlyPoolCreator(_poolId)
        returns (uint256 requestId)
    {
        Pool storage pool = pools[_poolId];
        require(pool.poolType == PoolType.LuckyDraw,                     "FCP: not LuckyDraw");
        require(pool.status   == PoolStatus.Active ||
                pool.status   == PoolStatus.Completed,                   "FCP: invalid status");
        require(pool.totalCollected > 0,                                 "FCP: no funds");
        require(pool.participantCount > 0,                               "FCP: no participants");
        require(pool.winner == address(0),                               "FCP: winner exists");
        require(poolVrfRequest[_poolId] == 0,                           "FCP: draw in progress");

        // Lock pool while waiting for VRF
        pool.status = PoolStatus.PendingVRF;
        emit PoolStatusChanged(_poolId, PoolStatus.PendingVRF);

        // Submit VRF request — pay with subscription LINK (nativePayment = false)
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash:             s_keyHash,
                subId:               s_subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit:    CALLBACK_GAS_LIMIT,
                numWords:            NUM_WORDS,
                extraArgs:           VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({ nativePayment: false })
                )
            })
        );

        vrfRequestToPool[requestId] = _poolId;
        poolVrfRequest[_poolId]     = requestId;

        emit WinnerDrawRequested(_poolId, requestId);
    }

    /**
     * @notice Step 2 — Chainlink oracle calls this after generating randomness.
     *         Selects winner, transfers prize, emits `WinnerPicked`.
     * @dev    Called only by the VRF coordinator (enforced by VRFConsumerBaseV2Plus).
     */
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        uint256 poolId = vrfRequestToPool[_requestId];
        require(poolId < nextPoolId, "FCP: unknown request");

        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.PendingVRF,  "FCP: not pending VRF");
        require(pool.winner == address(0),             "FCP: winner already set");

        // ── Verifiably-random winner index ──────────────────────────────────
        uint256 winnerIdx = _randomWords[0] % pool.participantCount;
        address winner    = poolParticipants[poolId][winnerIdx];

        // ── Transfer prize ───────────────────────────────────────────────────
        uint256 prize = pool.totalCollected;
        pool.totalCollected = 0;
        pool.winner         = winner;
        pool.status         = PoolStatus.Withdrawn;

        (bool ok, ) = payable(winner).call{value: prize}("");
        require(ok, "FCP: prize transfer failed");

        emit WinnerPicked(poolId, winner, prize, _requestId);
        emit PayoutExecuted(poolId, winner, prize, PoolType.LuckyDraw);
        emit PoolStatusChanged(poolId, PoolStatus.Withdrawn);
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
