-- Phase 15 (TMPL-01, TMPL-02, TMPL-03): Templates table
-- Stores reusable squad output templates for cross-client reference
--
-- Templates are global (not per-client) — the whole point is cross-client reuse.
-- content JSONB stores the structured_output from the source squad job.
-- source_client_id and source_job_id use ON DELETE SET NULL so templates
-- survive if the source client or job is deleted.

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  process_number INTEGER NOT NULL CHECK (process_number >= 1 AND process_number <= 16),
  content JSONB NOT NULL,
  source_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  source_job_id UUID REFERENCES squad_jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for filtering templates by process_number (TMPL-03: PromptPreviewModal selector)
CREATE INDEX idx_templates_process_number ON templates(process_number);

-- RLS: solo operator but forward-compatible for multi-user
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage templates"
  ON templates
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Auto-update updated_at on modification (matches pattern from 00001_initial_schema.sql)
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();
