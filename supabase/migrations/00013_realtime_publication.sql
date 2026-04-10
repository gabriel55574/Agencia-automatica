-- Agency OS: Enable Supabase Realtime for pipeline tables
-- Required for the client-profile-tabs.tsx postgres_changes subscriptions
-- to receive live updates when the background worker transitions job/process/gate status.
--
-- Without this migration:
--   - Tables are not in the supabase_realtime publication
--   - postgres_changes subscriptions silently receive no events
--   - Pipeline UI stays stale after squad job state transitions
--
-- REPLICA IDENTITY FULL is set on tables that are subscribed to with
-- client_id filters. The default REPLICA IDENTITY DEFAULT only includes
-- the primary key in the WAL, so the filter column (client_id) would not
-- be present in the change payload — causing filtered subscriptions to
-- receive no events.

-- ============================================================
-- 1. Set REPLICA IDENTITY FULL on all subscribed tables
-- This ensures the full row (including client_id) is present
-- in the WAL change record so Supabase can apply row filters.
-- ============================================================
ALTER TABLE squad_jobs REPLICA IDENTITY FULL;
ALTER TABLE processes REPLICA IDENTITY FULL;
ALTER TABLE quality_gates REPLICA IDENTITY FULL;
ALTER TABLE gate_reviews REPLICA IDENTITY FULL;
ALTER TABLE phases REPLICA IDENTITY FULL;

-- ============================================================
-- 2. Add tables to the supabase_realtime publication
-- This enables postgres_changes listeners for these tables.
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE squad_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE processes;
ALTER PUBLICATION supabase_realtime ADD TABLE quality_gates;
ALTER PUBLICATION supabase_realtime ADD TABLE gate_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE phases;
