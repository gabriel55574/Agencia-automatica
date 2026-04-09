-- Phase 12 (COST-01, COST-03): Add cost tracking columns to squad_jobs and processes
--
-- squad_jobs: track token usage and estimated dollar cost per run
-- processes: optional per-process token budget for alerts
-- All columns nullable for graceful fallback when token data unavailable

-- squad_jobs: token count (sum of input + output tokens)
ALTER TABLE squad_jobs ADD COLUMN IF NOT EXISTS token_count INTEGER;

-- squad_jobs: estimated cost in USD (NUMERIC(10,4) for precise dollar amounts)
ALTER TABLE squad_jobs ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10,4);

-- processes: optional per-process token budget for threshold alerts
ALTER TABLE processes ADD COLUMN IF NOT EXISTS token_budget INTEGER;

-- Index for monthly cost aggregation queries (COST-02, COST-04)
-- Partial index: only completed jobs with token data, keeps index small (T-12-02)
CREATE INDEX IF NOT EXISTS idx_squad_jobs_cost_tracking
  ON squad_jobs (client_id, completed_at)
  WHERE status = 'completed' AND token_count IS NOT NULL;
