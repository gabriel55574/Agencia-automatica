-- Agency OS: Phase 6 - Gate Reviews table and squad_type extension
-- Adds the gate_reviews table for storing AI pre-review verdicts,
-- and extends the squad_jobs squad_type CHECK to allow 'gate_review'.

-- ============================================================
-- 1. Extend squad_jobs squad_type CHECK to include 'gate_review'
-- Drop existing constraint and recreate with new value.
-- ============================================================
ALTER TABLE squad_jobs DROP CONSTRAINT IF EXISTS squad_jobs_squad_type_check;
ALTER TABLE squad_jobs ADD CONSTRAINT squad_jobs_squad_type_check
  CHECK (squad_type IN ('estrategia', 'planejamento', 'growth', 'crm', 'gate_review'));

-- ============================================================
-- 2. CREATE TABLE gate_reviews
-- Stores AI pre-review verdicts for quality gates.
-- Each review links to a quality_gate and the originating squad_job.
-- verdict JSONB holds the GateReviewVerdictSchema output.
-- raw_output TEXT preserves the full CLI stdout for debugging.
-- ============================================================
CREATE TABLE gate_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id UUID NOT NULL REFERENCES quality_gates(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  squad_job_id UUID REFERENCES squad_jobs(id) ON DELETE SET NULL,
  verdict JSONB NOT NULL,
  raw_output TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. RLS policies for gate_reviews (authenticated-only access)
-- Same pattern as other tables: authenticated users can read,
-- insert, and update gate_reviews.
-- ============================================================
ALTER TABLE gate_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read gate_reviews"
  ON gate_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert gate_reviews"
  ON gate_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update gate_reviews"
  ON gate_reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. Indexes for common query patterns
-- ============================================================
CREATE INDEX idx_gate_reviews_gate_id ON gate_reviews(gate_id);
CREATE INDEX idx_gate_reviews_client_id ON gate_reviews(client_id);
CREATE INDEX idx_gate_reviews_squad_job_id ON gate_reviews(squad_job_id);
