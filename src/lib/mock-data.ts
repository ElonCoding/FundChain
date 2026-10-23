import type { Chat, ChatMessage, Contact, UserProfile } from "./types";

/* ──────────────────────────────────────────────────────────
 *  Mock data for local development before Supabase is wired
 *  Using fixed ISO strings to avoid `new Date()` at module level
 *  (which triggers Next.js blocking-prerender warning)
 * ────────────────────────────────────────────────────────── */

export const MOCK_USER: UserProfile = {
  id: "user-1",
  wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  display_name: "Prateek",
  avatar_url: null,
  bio: "Building on Avalanche 🔺",
  status: "online",
  last_seen: "2026-10-20T14:25:59.000Z",
  created_at: "2024-01-15T10:00:00.000Z",
};

export const MOCK_CONTACTS: Contact[] = [
  { id: "c1", wallet_address: "0xabc1...1234", display_name: "Rahul Sharma",  avatar_url: null, status: "online"  },
  { id: "c2", wallet_address: "0xdef2...5678", display_name: "Ananya Patel",  avatar_url: null, status: "away"    },
  { id: "c3", wallet_address: "0x1234...abcd", display_name: "Vikram Singh",  avatar_url: null, status: "offline" },
  { id: "c4", wallet_address: "0x5678...efgh", display_name: "Priya Kapoor",  avatar_url: null, status: "online"  },
  { id: "c5", wallet_address: "0x9abc...ijkl", display_name: "Arjun Mehta",   avatar_url: null, status: "online"  },
  { id: "c6", wallet_address: "0xmnop...qrst", display_name: "Sneha Reddy",   avatar_url: null, status: "offline" },
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  "chat-1": [
    { id: "m1", chat_id: "chat-1", sender_id: "c1",     sender_name: "Rahul Sharma", sender_avatar: null, content: "Hey! Did you check the new Avalanche subnet features?",                    message_type: "text", created_at: "2026-10-20T13:25:59.000Z", read_by: ["user-1"] },
    { id: "m2", chat_id: "chat-1", sender_id: "user-1", sender_name: "Prateek",       sender_avatar: null, content: "Yes, the Warp messaging is incredible! Sub-second finality across subnets 🚀", message_type: "text", created_at: "2026-10-20T13:27:39.000Z", read_by: ["c1"]    },
    { id: "m3", chat_id: "chat-1", sender_id: "c1",     sender_name: "Rahul Sharma", sender_avatar: null, content: "We should build something for the Speed Run hackathon together",           message_type: "text", created_at: "2026-10-20T13:35:59.000Z", read_by: ["user-1"] },
    { id: "m4", chat_id: "chat-1", sender_id: "user-1", sender_name: "Prateek",       sender_avatar: null, content: "Already on it! Check the FundChain concept 💡",                          message_type: "text", created_at: "2026-10-20T14:15:59.000Z", read_by: []         },
  ],
  "chat-2": [
    { id: "m5", chat_id: "chat-2", sender_id: "c2",     sender_name: "Ananya Patel", sender_avatar: null, content: "The group fund collection for the farewell party is live!",               message_type: "text", created_at: "2026-10-20T12:25:59.000Z", read_by: ["user-1"] },
    { id: "m6", chat_id: "chat-2", sender_id: "user-1", sender_name: "Prateek",       sender_avatar: null, content: "Just contributed 0.1 AVAX ✅",                                          message_type: "text", created_at: "2026-10-20T12:31:39.000Z", read_by: ["c2"]    },
  ],
  "chat-3": [
    { id: "m7", chat_id: "chat-3", sender_id: "c3", sender_name: "Vikram Singh", sender_avatar: null, content: "Anyone up for a study session tomorrow?",                                     message_type: "text", created_at: "2026-10-19T14:25:59.000Z", read_by: ["user-1","c4","c5"] },
    { id: "m8", chat_id: "chat-3", sender_id: "c4", sender_name: "Priya Kapoor", sender_avatar: null, content: "I'm in! Let's meet at the library",                                           message_type: "text", created_at: "2026-10-19T15:25:59.000Z", read_by: ["user-1","c3","c5"] },
    { id: "m9", chat_id: "chat-3", sender_id: "c5", sender_name: "Arjun Mehta",  sender_avatar: null, content: "Count me in 👍",                                                              message_type: "text", created_at: "2026-10-19T16:03:19.000Z", read_by: ["user-1","c3","c4"] },
  ],
  "chat-fund-1": [
    { id: "mf1", chat_id: "chat-fund-1", sender_id: "system",  sender_name: "FundChain",    sender_avatar: null, content: "🎉 Fund pool created: Teacher's Birthday Celebration. Contribution: 0.1 AVAX per person.", message_type: "system", created_at: "2026-10-18T14:25:59.000Z", read_by: []         },
    { id: "mf2", chat_id: "chat-fund-1", sender_id: "c2",      sender_name: "Ananya Patel", sender_avatar: null, content: "I've contributed! Happy to celebrate our teacher 🎂",                                     message_type: "text",   created_at: "2026-10-18T15:05:59.000Z", read_by: []         },
    { id: "mf3", chat_id: "chat-fund-1", sender_id: "c5",      sender_name: "Arjun Mehta",  sender_avatar: null, content: "Just paid, tx confirmed on SnowTrace ✅",                                                 message_type: "text",   created_at: "2026-10-18T17:25:59.000Z", read_by: []         },
  ],
};

export const MOCK_CHATS: Chat[] = [
  {
    id: "chat-1",
    type: "private",
    name: "Rahul Sharma",
    avatar_url: null,
    participants: ["user-1", "c1"],
    last_message: MOCK_MESSAGES["chat-1"][3],
    unread_count: 0,
    created_at: "2024-01-20T10:00:00.000Z",
    updated_at: "2026-10-20T14:15:59.000Z",
  },
  {
    id: "chat-2",
    type: "private",
    name: "Ananya Patel",
    avatar_url: null,
    participants: ["user-1", "c2"],
    last_message: MOCK_MESSAGES["chat-2"][1],
    unread_count: 2,
    created_at: "2024-02-01T08:00:00.000Z",
    updated_at: "2026-10-20T12:31:39.000Z",
  },
  {
    id: "chat-3",
    type: "group",
    name: "Class 10th B – Study Group",
    avatar_url: null,
    participants: ["user-1", "c3", "c4", "c5"],
    last_message: MOCK_MESSAGES["chat-3"][2],
    unread_count: 5,
    created_at: "2024-01-10T12:00:00.000Z",
    updated_at: "2026-10-19T16:03:19.000Z",
  },
  {
    id: "chat-fund-1",
    type: "fund-group",
    name: "🎂 Teacher's Birthday Fund",
    avatar_url: null,
    participants: ["user-1", "c2", "c5"],
    last_message: MOCK_MESSAGES["chat-fund-1"][2],
    unread_count: 1,
    pool_id: 0,
    created_at: "2024-03-01T09:00:00.000Z",
    updated_at: "2026-10-18T17:25:59.000Z",
  },
];

/* ──────────────────────────────────────────────────────────
 *  Mock Fund Pools (simulates on-chain data)
 * ────────────────────────────────────────────────────────── */

export type PoolMode = "event" | "luckydraw";
export type ContributionMode = "fixed" | "flexible";

export interface MockPoolDisplay {
  id: string | number;
  poolType: PoolMode;            // 'event' = EventPayout, 'luckydraw' = LuckyDraw
  title: string;
  description: string;
  creator: string;               // shortened display address
  creatorFull: string;           // full 0x address for admin checks
  recipientAddress: string;      // who gets paid (event pools)
  winner: string | null;         // address of winner (luckydraw pools)
  contributionMode: ContributionMode;
  contributionAmount: string;    // display string, e.g. "0.1 AVAX"
  contributionWei: bigint;
  minContributionWei: bigint;    // flexible lower bound
  maxContributionWei: bigint;    // flexible upper bound (0 = unlimited)
  goalAmount: string;
  totalCollected: string;
  participantCount: number;
  maxParticipants: number;
  status: "active" | "completed" | "cancelled" | "withdrawn";
  deadline: string | null;
  createdAt: string;
  groupChatId: string;
  participants: { address: string; name: string; amount: string; txHash: string }[];
}

export const MOCK_POOLS: MockPoolDisplay[] = [
  // ── Pool 0: Event Payout — Teacher's Birthday ─────────────────────────────
  {
    id: 0,
    poolType: "event",
    title: "Teacher's Birthday Celebration 🎂",
    description: "Collecting funds for our beloved Maths teacher's birthday party. Everyone contributes equally — 0.1 AVAX per student.",
    creator: "0x742d...f2bD18",
    creatorFull: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    recipientAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    winner: null,
    contributionMode: "fixed",
    contributionAmount: "0.1 AVAX",
    contributionWei: BigInt("100000000000000000"),
    minContributionWei: BigInt(0),
    maxContributionWei: BigInt(0),
    goalAmount: "2.5 AVAX",
    totalCollected: "0.7 AVAX",
    participantCount: 7,
    maxParticipants: 25,
    status: "active",
    deadline: "2026-04-15",
    createdAt: "2026-03-20",
    groupChatId: "chat-fund-1",
    participants: [
      { address: "0xabc1...1234", name: "Rahul S.",   amount: "0.1 AVAX", txHash: "0xaaa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0aa" },
      { address: "0xdef2...5678", name: "Ananya P.",  amount: "0.1 AVAX", txHash: "0xbbb1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0bb" },
      { address: "0x9abc...ijkl", name: "Arjun M.",   amount: "0.1 AVAX", txHash: "0xccc1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0cc" },
      { address: "0x5678...efgh", name: "Priya K.",   amount: "0.1 AVAX", txHash: "0xddd1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0dd" },
      { address: "0x1234...abcd", name: "Vikram S.",  amount: "0.1 AVAX", txHash: "0xeee1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0ee" },
      { address: "0xffaa...bbcc", name: "Sneha R.",   amount: "0.1 AVAX", txHash: "0xfff1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0ff" },
      { address: "0x7890...defg", name: "Karthik V.", amount: "0.1 AVAX", txHash: "0x1111b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f011" },
    ],
  },

  // ── Pool 1: Lucky Draw — Sports Day Raffle ───────────────────────────────
  {
    id: 1,
    poolType: "luckydraw",
    title: "Sports Day Lucky Draw 🏆🎲",
    description: "Pay 0.25 AVAX to enter the Sports Day raffle! One lucky winner takes the entire pot. The draw happens on event day.",
    creator: "0xdef2...5678",
    creatorFull: "0xdef2569e8B4B42200E41e9C3bc31E9a93fC35678",
    recipientAddress: "",
    winner: null,
    contributionMode: "fixed",
    contributionAmount: "0.25 AVAX",
    contributionWei: BigInt("250000000000000000"),
    minContributionWei: BigInt(0),
    maxContributionWei: BigInt(0),
    goalAmount: "5.0 AVAX",
    totalCollected: "3.75 AVAX",
    participantCount: 15,
    maxParticipants: 20,
    status: "active",
    deadline: "2026-05-01",
    createdAt: "2026-03-25",
    groupChatId: "chat-fund-2",
    participants: [
      { address: "0xabc1...1234", name: "Rahul S.",   amount: "0.25 AVAX", txHash: "0xh011b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f022" },
      { address: "0x742d...f2bD", name: "Prateek",    amount: "0.25 AVAX", txHash: "0xh021b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f033" },
      { address: "0x5678...efgh", name: "Priya K.",   amount: "0.25 AVAX", txHash: "0xh031b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f044" },
      { address: "0x9abc...ijkl", name: "Arjun M.",   amount: "0.25 AVAX", txHash: "0xh041b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f055" },
      { address: "0xffaa...bbcc", name: "Sneha R.",   amount: "0.25 AVAX", txHash: "0xh051b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f066" },
    ],
  },

  // ── Pool 2: Event Payout (Completed) — Farewell ──────────────────────────
  {
    id: 2,
    poolType: "event",
    title: "Farewell Party Collection 🎓",
    description: "Final year farewell dinner and gifts. Let's make it memorable! Flexible contributions — give what you can.",
    creator: "0x1234...abcd",
    creatorFull: "0x1234abcd5678ef901234abcd5678ef901234abcd",
    recipientAddress: "0x1234abcd5678ef901234abcd5678ef901234abcd",
    winner: null,
    contributionMode: "flexible",
    contributionAmount: "Flexible",
    contributionWei: BigInt(0),
    minContributionWei: BigInt("100000000000000000"),   // 0.1 AVAX min
    maxContributionWei: BigInt("1000000000000000000"),  // 1.0 AVAX max
    goalAmount: "10.0 AVAX",
    totalCollected: "10.0 AVAX",
    participantCount: 20,
    maxParticipants: 20,
    status: "completed",
    deadline: null,
    createdAt: "2026-02-15",
    groupChatId: "chat-fund-3",
    participants: [],
  },
];
