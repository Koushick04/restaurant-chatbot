-- Production hardening migration for AI Restaurant Assistant
-- Apply after the base schema.sql or through Supabase migrations.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'business_settings',
    'chatbot_config',
    'faqs',
    'documents',
    'conversations',
    'leads'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%I_updated_at ON public.%I', table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER set_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      table_name,
      table_name
    );
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER set_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_faqs_active_sort ON faqs (is_active, sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs (category);
CREATE INDEX IF NOT EXISTS idx_faqs_question_trgm ON faqs USING gin (question gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_active_category ON documents (is_active, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_content_trgm ON documents USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_analytics_session_created ON analytics_events (session_id, created_at DESC);

ALTER TABLE conversations
  ALTER COLUMN message_count SET DEFAULT 0;

UPDATE conversations
SET message_count = counts.total
FROM (
  SELECT conversation_id, COUNT(*)::int AS total
  FROM messages
  GROUP BY conversation_id
) counts
WHERE conversations.id = counts.conversation_id;

UPDATE business_settings
SET updated_at = COALESCE(updated_at, created_at, NOW());

UPDATE chatbot_config
SET updated_at = COALESCE(updated_at, created_at, NOW());
