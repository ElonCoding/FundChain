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

/* ──────────────────────────────────────────────────────────
 *  Private helpers
 * ────────────────────────────────────────────────────────── */

function shortenForDisplay(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
