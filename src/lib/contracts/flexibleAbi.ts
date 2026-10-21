/**
 * ABI for FlexibleCommunityPool.sol
 * Supports EventPayout + LuckyDraw pool types with flexible contributions.
 */
export const FLEXIBLE_POOL_ABI = [
  // ── Events ─────────────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "uint256",  name: "poolId",             type: "uint256" },
      { indexed: true,  internalType: "address",  name: "creator",            type: "address" },
      { indexed: false, internalType: "uint8",    name: "poolType",           type: "uint8"   },
      { indexed: false, internalType: "string",   name: "title",              type: "string"  },
      { indexed: false, internalType: "uint256",  name: "contributionAmount", type: "uint256" },
      { indexed: false, internalType: "string",   name: "groupId",            type: "string"  },
    ],
    name: "PoolCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "uint256", name: "poolId",      type: "uint256" },
      { indexed: true,  internalType: "address", name: "contributor", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount",      type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newTotal",    type: "uint256" },
    ],
    name: "ContributionMade",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "uint256", name: "poolId",      type: "uint256" },
      { indexed: true,  internalType: "address", name: "winner",      type: "address" },
      { indexed: false, internalType: "uint256", name: "prizeAmount", type: "uint256" },
    ],
    name: "WinnerPicked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "uint256", name: "poolId",    type: "uint256" },
      { indexed: true,  internalType: "address", name: "recipient", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount",    type: "uint256" },
      { indexed: false, internalType: "uint8",   name: "poolType",  type: "uint8"   },
    ],
    name: "PayoutExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "poolId",  type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
    ],
    name: "PoolCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "uint256", name: "poolId",    type: "uint256" },
      { indexed: false, internalType: "uint8",   name: "newStatus", type: "uint8"   },
    ],
    name: "PoolStatusChanged",
    type: "event",
  },

  // ── Write: Create EventPayout pool ─────────────────────────────────
  {
    inputs: [
      { internalType: "string",  name: "_title",             type: "string"  },
      { internalType: "string",  name: "_description",       type: "string"  },
      { internalType: "string",  name: "_groupId",           type: "string"  },
      { internalType: "uint256", name: "_contributionAmt",   type: "uint256" },
      { internalType: "uint256", name: "_minContribution",   type: "uint256" },
      { internalType: "uint256", name: "_maxContribution",   type: "uint256" },
      { internalType: "address", name: "_recipientAddress",  type: "address" },
      { internalType: "uint256", name: "_deadline",          type: "uint256" },
    ],
    name: "createEventPool",
    outputs: [{ internalType: "uint256", name: "poolId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Write: Create LuckyDraw pool ───────────────────────────────────
  {
    inputs: [
      { internalType: "string",  name: "_title",           type: "string"  },
      { internalType: "string",  name: "_description",     type: "string"  },
      { internalType: "string",  name: "_groupId",         type: "string"  },
      { internalType: "uint256", name: "_contributionAmt", type: "uint256" },
      { internalType: "uint256", name: "_minContribution", type: "uint256" },
      { internalType: "uint256", name: "_maxContribution", type: "uint256" },
      { internalType: "uint256", name: "_deadline",        type: "uint256" },
    ],
    name: "createLuckyDrawPool",
    outputs: [{ internalType: "uint256", name: "poolId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Write: Contribute (payable) ────────────────────────────────────
  {
    inputs: [{ internalType: "uint256", name: "_poolId", type: "uint256" }],
    name: "contribute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },

  // ── Write: Pick random winner (LuckyDraw) ─────────────────────────
  {
    inputs: [{ internalType: "uint256", name: "_poolId", type: "uint256" }],
    name: "pickRandomWinner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Write: Payout to recipient (EventPayout) ──────────────────────
  {
    inputs: [
      { internalType: "uint256", name: "_poolId",    type: "uint256" },
      { internalType: "address", name: "_recipient", type: "address" },
    ],
    name: "payoutToRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Write: Creator self-withdraw ───────────────────────────────────
  {
    inputs: [{ internalType: "uint256", name: "_poolId", type: "uint256" }],
    name: "withdrawFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Write: Cancel + refund ────────────────────────────────────────
  {
    inputs: [{ internalType: "uint256", name: "_poolId", type: "uint256" }],
    name: "cancelPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Read: getPool ─────────────────────────────────────────────────
  {
    inputs: [{ internalType: "uint256", name: "_poolId", type: "uint256" }],
    name: "getPool",
    outputs: [
      {
        components: [
          { internalType: "uint256",  name: "id",                 type: "uint256"  },
          { internalType: "address",  name: "creator",            type: "address"  },
          { internalType: "uint8",    name: "poolType",           type: "uint8"    },
          { internalType: "string",   name: "title",              type: "string"   },
          { internalType: "string",   name: "description",        type: "string"   },
          { internalType: "string",   name: "groupId",            type: "string"   },
          { internalType: "uint256",  name: "contributionAmount", type: "uint256"  },
          { internalType: "uint256",  name: "minContribution",    type: "uint256"  },
          { internalType: "uint256",  name: "maxContribution",    type: "uint256"  },
          { internalType: "address",  name: "recipientAddress",   type: "address"  },
          { internalType: "uint256",  name: "totalCollected",     type: "uint256"  },
          { internalType: "uint256",  name: "participantCount",   type: "uint256"  },
          { internalType: "uint256",  name: "createdAt",          type: "uint256"  },
          { internalType: "uint256",  name: "deadline",           type: "uint256"  },
          { internalType: "uint8",    name: "status",             type: "uint8"    },
          { internalType: "address",  name: "winner",             type: "address"  },
        ],
        internalType: "struct FlexibleCommunityPool.Pool",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  // ── Read: getPoolParticipants ─────────────────────────────────────
  {
    inputs: [{ internalType: "uint256", name: "_poolId", type: "uint256" }],
    name: "getPoolParticipants",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Read: isParticipant ───────────────────────────────────────────
  {
    inputs: [
      { internalType: "uint256", name: "_poolId", type: "uint256" },
      { internalType: "address", name: "_user",   type: "address" },
    ],
    name: "isParticipant",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Read: getContributionByUser ───────────────────────────────────
  {
    inputs: [
      { internalType: "uint256", name: "_poolId", type: "uint256" },
      { internalType: "address", name: "_user",   type: "address" },
    ],
    name: "getContributionByUser",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Read: getUserCreatedPools ─────────────────────────────────────
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getUserCreatedPools",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Read: getUserContributedPools ─────────────────────────────────
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getUserContributedPools",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Read: getPoolCount ────────────────────────────────────────────
  {
    inputs: [],
    name: "getPoolCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Read: getContributions (paginated) ────────────────────────────
  {
    inputs: [
      { internalType: "uint256", name: "_offset", type: "uint256" },
      { internalType: "uint256", name: "_limit",  type: "uint256" },
    ],
    name: "getContributions",
    outputs: [
      {
        components: [
          { internalType: "address", name: "contributor", type: "address" },
          { internalType: "uint256", name: "amount",      type: "uint256" },
          { internalType: "uint256", name: "timestamp",   type: "uint256" },
          { internalType: "uint256", name: "poolId",      type: "uint256" },
        ],
        internalType: "struct FlexibleCommunityPool.Contribution[]",
        name: "result",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  // ── Read: nextPoolId ──────────────────────────────────────────────
  {
    inputs: [],
    name: "nextPoolId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// PoolType mapping (mirrors the Solidity enum)
export const PoolType = { EventPayout: 0, LuckyDraw: 1 } as const;
export type PoolTypeValue = (typeof PoolType)[keyof typeof PoolType];
