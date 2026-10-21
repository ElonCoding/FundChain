-- ═══════════════════════════════════════════════════════════════════════════
--  FundChain — Dynamic Supabase Schema (Zero Static Mock Data)
--  Run in: Supabase Dashboard -> SQL Editor -> Run
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean previous triggers safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
    DROP TRIGGER IF EXISTS set_conversations_updated_at ON public.conversations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
  END IF;
END $$;

DROP FUNCTION IF EXISTS trigger_update_conversation_last_message();
DROP FUNCTION IF EXISTS trigger_set_updated_at();

-- 3. Profiles (Created dynamically upon wallet connect)
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address  TEXT        UNIQUE NOT NULL,
  display_name    TEXT        NOT NULL DEFAULT 'Anonymous',
  avatar_url      TEXT,
  bio             TEXT,
  status          TEXT        NOT NULL DEFAULT 'online'
                              CHECK (status IN ('online', 'away', 'offline')),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles (wallet_address);

-- 4. Conversations (Created dynamically when chats/pools are made)
CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            TEXT        NOT NULL DEFAULT 'private'
                              CHECK (type IN ('private', 'group', 'fund-group')),
  name            TEXT        NOT NULL,
  avatar_url      TEXT,
  description     TEXT,
  pool_id         INT,                       -- on-chain pool ID
  pool_type       TEXT        CHECK (pool_type IN ('event', 'luckydraw')),
  created_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_pool    ON public.conversations (pool_id);

-- 5. Conversation Participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES public.profiles(id)      ON DELETE CASCADE,
  is_admin        BOOL NOT NULL DEFAULT FALSE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_profile ON public.conversation_participants (profile_id);

-- 6. Messages (Real-time dynamic chat & transactions)
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES public.profiles(id)      ON DELETE CASCADE,
  content         TEXT        NOT NULL DEFAULT '',
  message_type    TEXT        NOT NULL DEFAULT 'text'
                              CHECK (message_type IN ('text', 'image', 'file', 'system', 'tx')),
  file_url        TEXT,
  file_name       TEXT,
  file_size       BIGINT,
  tx_hash         TEXT,
  tx_chain_id     INT,
  reply_to        UUID        REFERENCES public.messages(id) ON DELETE SET NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv    ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender  ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_tx      ON public.messages (tx_hash) WHERE tx_hash IS NOT NULL;

-- 7. Pool Members (Mirrors on-chain participants dynamically)
CREATE TABLE IF NOT EXISTS public.pool_members (
  pool_id         INT         NOT NULL,
  profile_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  wallet_address  TEXT        NOT NULL,
  amount_wei      TEXT        NOT NULL,
  tx_hash         TEXT,
  contributed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pool_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_pool_members_profile ON public.pool_members (profile_id);

-- 8. Pool Events (On-chain activity logs)
CREATE TABLE IF NOT EXISTS public.pool_events (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id         INT         NOT NULL,
  event_type      TEXT        NOT NULL,
  data            JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pool_events_pool ON public.pool_events (pool_id, created_at DESC);

-- 9. Triggers: Auto updated_at Maintenance
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 10. Trigger: Auto sync conversation preview on new message
CREATE OR REPLACE FUNCTION trigger_update_conversation_last_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message    = LEFT(NEW.content, 120),
    last_message_at = NEW.created_at,
    updated_at      = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION trigger_update_conversation_last_message();

-- 11. Row Level Security (RLS)
ALTER TABLE public.profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_events               ENABLE ROW LEVEL SECURITY;

-- Dynamic open policies (wallet/signature verified client-side & server-side)
CREATE POLICY "profiles_select"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert"   ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update"   ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "conversations_select"   ON public.conversations FOR SELECT USING (true);
CREATE POLICY "conversations_insert"   ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "conversations_update"   ON public.conversations FOR UPDATE USING (true);

CREATE POLICY "cp_select"   ON public.conversation_participants FOR SELECT USING (true);
CREATE POLICY "cp_insert"   ON public.conversation_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "cp_delete"   ON public.conversation_participants FOR DELETE USING (true);

CREATE POLICY "messages_select"   ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages_insert"   ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "pm_select"   ON public.pool_members FOR SELECT USING (true);
CREATE POLICY "pm_insert"   ON public.pool_members FOR INSERT WITH CHECK (true);
CREATE POLICY "pm_update"   ON public.pool_members FOR UPDATE USING (true);

CREATE POLICY "pe_select"   ON public.pool_events FOR SELECT USING (true);
CREATE POLICY "pe_insert"   ON public.pool_events FOR INSERT WITH CHECK (true);

-- 12. Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pool_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pool_events;
  END IF;
END $$;
