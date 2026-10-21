/* ──────────────────────────────────────────────────────────
 *  Shared TypeScript types used across the application
 * ────────────────────────────────────────────────────────── */

// ── Pool / Funds types ──

export enum PoolStatus {
  Active = 0,
  Completed = 1,
  Cancelled = 2,
  Withdrawn = 3,
}

export interface Pool {
  id: bigint;
  creator: `0x${string}`;
  title: string;
  description: string;
  groupId: string;
  contributionAmount: bigint;
  goalAmount: bigint;
  totalCollected: bigint;
  participantCount: bigint;
  createdAt: bigint;
  deadline: bigint;
  status: PoolStatus;
}

export interface Contribution {
  contributor: `0x${string}`;
  amount: bigint;
  timestamp: bigint;
  poolId: bigint;
}

// ── Chat / Messaging types (off-chain, Supabase) ──

export interface UserProfile {
  id: string;
  wallet_address: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  status: "online" | "offline" | "away";
  last_seen: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  message_type: "text" | "image" | "file" | "system" | "poll";
  file_url?: string;
  file_name?: string;
  reply_to?: string;
  created_at: string;
  read_by: string[];
}

export interface Chat {
  id: string;
  type: "private" | "group" | "fund-group";
  name: string;
  avatar_url: string | null;
  participants: string[];
  last_message: ChatMessage | null;
  unread_count: number;
  pool_id?: number; // linked fund pool (for fund-group chats)
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  wallet_address: string;
  display_name: string;
  avatar_url: string | null;
  status: "online" | "offline" | "away";
}

// ── Fund Poll types ──

export interface FundPoll {
  id: string;
  pool_id: number;
  question: string;
  options: PollOption[];
  created_by: string;
  chat_id: string;
  created_at: string;
  expires_at: string | null;
}

export interface PollOption {
  label: string;
  action: "contribute" | "decline";
  votes: string[]; // user IDs
}

// ── Navigation ──

export type ActiveView = "chats" | "contacts" | "funds" | "settings";
