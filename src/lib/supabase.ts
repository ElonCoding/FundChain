import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigured && typeof window !== "undefined") {
  // Surface a prominent, grouped error in DevTools — not just a warning
  console.groupCollapsed(
    "%c[FundChain] ⚠️  Supabase credentials missing",
    "color: #f97316; font-weight: bold"
  );
  console.error(
    "Real-time chat and database features are DISABLED.\n\n" +
    "Add these to your .env.local and restart the dev server:\n\n" +
    "  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co\n" +
    "  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ..."
  );
  console.groupEnd();
}

/**
 * Typed Supabase client — use this everywhere in the app.
 * Falls back to a placeholder URL when env vars are absent so the
 * module can be imported without throwing at evaluation time.
 * In that case, all queries will fail gracefully and components should
 * render the SupabaseMissingError screen instead of silently using mock data.
 */
export const supabase = createClient<Database>(
  isConfigured ? supabaseUrl    : "https://placeholder.supabase.co",
  isConfigured ? supabaseAnonKey : "placeholder-anon-key",
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
    auth: {
      persistSession:  true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

/** True when real Supabase credentials are present in env vars */
export const SUPABASE_ENABLED = isConfigured;

/** Inverse of SUPABASE_ENABLED — used for showing config error screens */
export const SUPABASE_MISSING = !isConfigured;


/* ──────────────────────────────────────────────────────────
 *  Profile helpers
 * ────────────────────────────────────────────────────────── */

/**
 * Upsert a user profile on wallet connect.
 * Safe to call on every connect — only creates if new.
 */
export async function upsertProfile(walletAddress: string, displayName?: string) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        wallet_address: walletAddress.toLowerCase(),
        display_name:   displayName ?? shortenForDisplay(walletAddress),
        status:         "online",
        last_seen:      new Date().toISOString(),
      },
      { onConflict: "wallet_address", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) console.error("[Supabase] upsertProfile:", error.message);
  return data;
}

/**
 * Mark a profile as offline when wallet disconnects.
 */
export async function markOffline(walletAddress: string) {
  await supabase
    .from("profiles")
    .update({ status: "offline", last_seen: new Date().toISOString() })
    .eq("wallet_address", walletAddress.toLowerCase());
}

/**
 * Fetch a profile by wallet address (creates one if not found).
 */
export async function getOrCreateProfile(walletAddress: string) {
  const lower = walletAddress.toLowerCase();

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", lower)
    .maybeSingle();

  if (existing) return existing;
  return upsertProfile(walletAddress);
}

/* ──────────────────────────────────────────────────────────
 *  Phone OTP Auth (Supabase Phone Auth)
 * ────────────────────────────────────────────────────────── */

/**
 * Send a one-time password to the given E.164 phone number.
 * Returns { error } — null error means SMS was sent.
 */
export async function sendPhoneOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return { error };
}

/**
 * Verify the OTP token the user received via SMS.
 * Returns the authenticated session on success.
 */
export async function verifyPhoneOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  return { session: data?.session ?? null, error };
}

/**
 * Get the current Supabase auth session (persisted across reloads).
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Sign out the current Supabase session.
 */
export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Create/update a profile for a phone-auth user.
 * Called after OTP verification + profile setup.
 */
export async function upsertProfileByPhone(
  userId: string,
  phone: string,
  displayName: string,
  avatarGradient?: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id:            userId,
        wallet_address: phone,          // use phone as unique identifier until wallet linked
        display_name:   displayName,
        bio:            avatarGradient ?? "",
        status:         "online",
        last_seen:      new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) console.error("[Supabase] upsertProfileByPhone:", error.message);
  return data;
}

/* ──────────────────────────────────────────────────────────
 *  Message helpers
 * ────────────────────────────────────────────────────────── */

/**
 * Insert a text message and return the created row (with sender joined).
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  type: "text" | "system" | "tx" = "text",
  extra?: { tx_hash?: string; tx_chain_id?: number; reply_to?: string }
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id:       senderId,
      content,
      message_type:    type,
      ...extra,
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url, wallet_address)
    `)
    .single();

  if (error) throw new Error(`[Supabase] sendMessage: ${error.message}`);
  return data;
}

/**
 * Start or get an existing private 1-on-1 conversation.
 */
export async function startPrivateConversation(
  myProfileId: string,
  targetProfileId: string,
  targetDisplayName: string
): Promise<string> {
  try {
    const { data: myParticipations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", myProfileId);

    if (myParticipations && myParticipations.length > 0) {
      const convIds = myParticipations.map((p) => p.conversation_id);
      const { data: common } = await (supabase
        .from("conversation_participants") as any)
        .select("conversation_id, conversations(type)")
        .eq("profile_id", targetProfileId)
        .in("conversation_id", convIds);

      const privateConv = common?.find(
        (c: any) => c.conversations && c.conversations.type === "private"
      );

      if (privateConv) {
        return privateConv.conversation_id;
      }
    }
  } catch (err) {
    console.warn("[startPrivateConversation] lookup failed, creating new:", err);
  }

  // Otherwise, create a new conversation
  const { data: newConv, error: convError } = await (supabase
    .from("conversations") as any)
    .insert({
      type: "private",
      name: targetDisplayName,
      created_by: myProfileId,
    })
    .select("id")
    .single();

  if (convError || !newConv) {
    throw new Error(`Failed to create conversation: ${convError?.message}`);
  }

  // Insert both participants
  await (supabase.from("conversation_participants") as any).insert([
    { conversation_id: newConv.id, profile_id: myProfileId, is_admin: true },
    { conversation_id: newConv.id, profile_id: targetProfileId, is_admin: false },
  ]);

  return newConv.id;
}

/* ──────────────────────────────────────────────────────────
 *  Private helpers
 * ────────────────────────────────────────────────────────── */

function shortenForDisplay(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/* ──────────────────────────────────────────────────────────
 *  Pool contribution helpers
 * ────────────────────────────────────────────────────────── */

/**
 * Record an on-chain contribution in Supabase after the tx confirms.
 * Upserts pool_members and appends pool_events.
 */
export async function recordPoolContribution(params: {
  poolId: number;
  walletAddress: string;
  amountWei: string;
  txHash: string;
  chainId: number;
  displayName?: string;
}) {
  const lower = params.walletAddress.toLowerCase();

  // Ensure profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("wallet_address", lower)
    .maybeSingle();

  const profileId = profile?.id ?? null;

  // Upsert pool_members
  const { error: memberError } = await (supabase.from("pool_members") as any).upsert(
    {
      pool_id:        params.poolId,
      wallet_address: lower,
      profile_id:     profileId,
      amount_wei:     params.amountWei,
      tx_hash:        params.txHash,
      contributed_at: new Date().toISOString(),
    },
    { onConflict: "pool_id,wallet_address" }
  );

  if (memberError) console.error("[Supabase] pool_members upsert:", memberError.message);

  // Append pool_events
  const { error: eventError } = await (supabase.from("pool_events") as any).insert({
    pool_id:    params.poolId,
    event_type: "contribution",
    data: {
      wallet:       lower,
      amount_wei:   params.amountWei,
      tx_hash:      params.txHash,
      chain_id:     params.chainId,
      display_name: params.displayName ?? lower.slice(0, 10),
    },
  });

  if (eventError) console.error("[Supabase] pool_events insert:", eventError.message);

  return !memberError && !eventError;
}

/**
 * Fetch all contributors for a pool from Supabase pool_members.
 */
export async function getPoolMembers(poolId: number) {
  const { data, error } = await (supabase.from("pool_members") as any)
    .select(`
      wallet_address,
      amount_wei,
      tx_hash,
      contributed_at,
      profile:profiles(display_name)
    `)
    .eq("pool_id", poolId)
    .order("contributed_at", { ascending: true });

  if (error) {
    console.error("[Supabase] getPoolMembers:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    address: row.wallet_address,
    name:    row.profile?.display_name ?? row.wallet_address.slice(0, 8) + "…",
    amount:  (Number(BigInt(row.amount_wei ?? "0")) / 1e18).toFixed(4) + " AVAX",
    txHash:  row.tx_hash ?? "",
  }));
}
