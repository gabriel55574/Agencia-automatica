-- Agency OS: Phase 13 - Notification tables
-- Adds notification_preferences and notification_log tables
-- for email alert configuration and delivery tracking.

-- ============================================================
-- 1. CREATE TABLE notification_preferences
-- Stores per-user notification settings.
-- Solo operator: one row. Future-proofed for multi-user.
-- ============================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  squad_completion_enabled BOOLEAN NOT NULL DEFAULT true,
  gate_failure_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT true,
  digest_hour_utc SMALLINT NOT NULL DEFAULT 8 CHECK (digest_hour_utc BETWEEN 0 AND 23),
  email_override TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 2. CREATE TABLE notification_log
-- Tracks all sent/failed/skipped notifications for debugging.
-- ============================================================
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('squad_completion', 'gate_failure', 'daily_digest')),
  reference_id UUID,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. RLS policies (authenticated-only access)
-- ============================================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read notification_preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notification_preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notification_preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read notification_log"
  ON notification_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notification_log"
  ON notification_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 4. Triggers: updated_at auto-update for notification_preferences
-- ============================================================
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- 5. Indexes
-- ============================================================
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_log_event_type ON notification_log(event_type);
CREATE INDEX idx_notification_log_created_at ON notification_log(created_at);
CREATE INDEX idx_notification_log_reference_id ON notification_log(reference_id);
