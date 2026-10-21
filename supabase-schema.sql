-- ═══════════════════════════════════════════════════════════════════════════
--  FundChain — Supabase Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → "New Query"
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
--  TABLE: profiles
--  One row per wallet address (created on first connect)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address  TEXT        UNIQUE NOT NULL,
  display_name    TEXT        NOT NULL DEFAULT 'Anonymous',
  avatar_url      TEXT,
  bio             TEXT,
  status          TEXT        NOT NULL DEFAULT 'offline'
                              CHECK (status IN ('online','away','offline')),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles (wallet_address);

-- ═══════════════════════════════════════════════════════════════════════════
--  TABLE: conversations
--  Private, group, and fund-group chat rooms
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            TEXT        NOT NULL DEFAULT 'private'
                              CHECK (type IN ('private','group','fund-group')),
  name            TEXT        NOT NULL,
  avatar_url      TEXT,
  description     TEXT,
  pool_id         INT,                       -- links to on-chain pool (fund-group)
  pool_type       TEXT        CHECK (pool_type IN ('event','luckydraw')),
  created_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message    TEXT,                      -- denormalised preview
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_pool    ON conversations (pool_id);

-- ═══════════════════════════════════════════════════════════════════════════
--  TABLE: conversation_participants
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES profiles(id)      ON DELETE CASCADE,
  is_admin        BOOL NOT NULL DEFAULT FALSE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_profile ON conversation_participants (profile_id);

-- ═══════════════════════════════════════════════════════════════════════════
--  TABLE: messages
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  content         TEXT        NOT NULL DEFAULT '',
  message_type    TEXT        NOT NULL DEFAULT 'text'
                              CHECK (message_type IN ('text','image','file','system','tx')),
  -- For file/image messages
  file_url        TEXT,
  file_name       TEXT,
  file_size       BIGINT,
  -- For on-chain tx messages
  tx_hash         TEXT,
  tx_chain_id     INT,
  -- Reply threading
  reply_to        UUID        REFERENCES messages(id) ON DELETE SET NULL,
  -- Metadata (JSON for extensibility)
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv    ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender  ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_tx      ON messages (tx_hash) WHERE tx_hash IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
--  TABLE: pool_members
--  Mirrors on-chain contributors — populated by backend after ContributionMade event
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pool_members (
  pool_id         INT         NOT NULL,
  profile_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  wallet_address  TEXT        NOT NULL,
  amount_wei      TEXT        NOT NULL,   -- stored as string to avoid overflow
  tx_hash         TEXT,
  contributed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pool_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_pool_members_profile ON pool_members (profile_id);

-- ═══════════════════════════════════════════════════════════════════════════
--  TRIGGERS — updated_at maintenance
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─── Trigger: after insert on messages → update conversation last_message ───
CREATE OR REPLACE FUNCTION trigger_update_conversation_last_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations
  SET
    last_message    = LEFT(NEW.content, 120),
    last_message_at = NEW.created_at,
    updated_at      = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION trigger_update_conversation_last_message();

-- ═══════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
--  Hackathon mode: broad read access; restrict writes to authenticated callers.
--  Tighten per-user rules in production using Supabase Auth JWT claims.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_members          ENABLE ROW LEVEL SECURITY;

-- profiles: anyone can read; anyone can insert/update (wallet-gated in app)
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);

-- conversations: full public access (suitable for demo; restrict in prod)
CREATE POLICY "conversations_read"   ON conversations FOR SELECT USING (true);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (true);

-- participants: public read
CREATE POLICY "cp_read"   ON conversation_participants FOR SELECT USING (true);
CREATE POLICY "cp_insert" ON conversation_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "cp_delete" ON conversation_participants FOR DELETE USING (true);

-- messages: public read/insert (no delete/update for immutability)
CREATE POLICY "messages_read"   ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);

-- pool_members: public read/insert
CREATE POLICY "pm_read"   ON pool_members FOR SELECT USING (true);
CREATE POLICY "pm_insert" ON pool_members FOR INSERT WITH CHECK (true);
CREATE POLICY "pm_update" ON pool_members FOR UPDATE USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
--  REALTIME PUBLICATION
--  Enables Supabase Realtime to broadcast changes to subscribed clients.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- ═══════════════════════════════════════════════════════════════════════════
--  SEED DATA — 3 Demo Conversations (optional; delete before production)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO profiles (id, wallet_address, display_name, status) VALUES
  ('11111111-1111-1111-1111-111111111111', '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', 'Prateek',   'online'),
  ('22222222-2222-2222-2222-222222222222', '0xdef2569e8B4B42200E41e9C3bc31E9a93fC35678', 'Ananya P.', 'online'),
  ('33333333-3333-3333-3333-333333333333', '0xabc1234567890abcdef1234567890abcdef1234', 'Rahul S.',  'away')
ON CONFLICT (wallet_address) DO NOTHING;

INSERT INTO conversations (id, type, name, description, pool_id, pool_type, created_by) VALUES
  ('aaaa0000-0000-0000-0000-000000000001', 'fund-group', 'Teacher''s Birthday 🎂', 'Pool fund chat', 0, 'event',     '11111111-1111-1111-1111-111111111111'),
  ('aaaa0000-0000-0000-0000-000000000002', 'fund-group', 'Sports Day Lucky Draw 🎲', 'Raffle chat',   1, 'luckydraw', '22222222-2222-2222-2222-222222222222'),
  ('aaaa0000-0000-0000-0000-000000000003', 'private',    'Prateek & Rahul',          NULL,            NULL, NULL,   '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO conversation_participants (conversation_id, profile_id, is_admin) VALUES
  ('aaaa0000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', TRUE),
  ('aaaa0000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', FALSE),
  ('aaaa0000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', FALSE),
  ('aaaa0000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', TRUE),
  ('aaaa0000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', FALSE),
  ('aaaa0000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', FALSE),
  ('aaaa0000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES
  ('aaaa0000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'This group has been created for the Teacher''s Birthday fund 🎂', 'system'),
  ('aaaa0000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'I just contributed 0.1 AVAX! 🎉',                                 'text'),
  ('aaaa0000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Same, done! Let''s collect the rest quickly.',                    'text'),
  ('aaaa0000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Lucky Draw pool is live! Pay 0.25 AVAX to enter 🎲',               'system'),
  ('aaaa0000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'I''m in! Good luck everyone 🤞',                                   'text'),
  ('aaaa0000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Hey, have you seen the new Funds section?',                        'text'),
  ('aaaa0000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Yes! Just created a pool on Avalanche Fuji 🚀',                    'text')
ON CONFLICT DO NOTHING;
