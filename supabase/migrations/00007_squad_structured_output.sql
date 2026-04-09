-- Agency OS: Phase 5 - Add structured_output column to squad_jobs
-- Stores validated JSON output from Claude CLI after Zod schema parsing.
-- Only populated when parseStructuredOutput succeeds (T-05-04: never stores unvalidated JSON).

ALTER TABLE squad_jobs ADD COLUMN IF NOT EXISTS structured_output JSONB;

-- Partial index: only index rows where structured_output is present and job is completed.
-- Supports queries like "get all completed jobs with parsed output for a client".
CREATE INDEX IF NOT EXISTS idx_squad_jobs_structured_output
  ON squad_jobs ((structured_output IS NOT NULL))
  WHERE status = 'completed';
