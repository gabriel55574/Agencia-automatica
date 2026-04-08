-- Agency OS: Row Level Security Policies
-- Threat T-02-02: Information Disclosure prevention -- only authenticated users can access data
-- Note: These policies use USING (true) and WITH CHECK (true) for the solo operator.
-- The anon key is exposed in the browser bundle; without RLS anyone could read/write data.
-- Tighten these for multi-user (e.g., USING (auth.uid() = operator_id)) if needed in the future.

-- ============================================================
-- Enable RLS on all 6 tables
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: clients -- authenticated users can do everything
-- ============================================================
CREATE POLICY "Authenticated users can read all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLE: phases
-- ============================================================
CREATE POLICY "Authenticated users can read all phases"
  ON phases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert phases"
  ON phases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update phases"
  ON phases FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete phases"
  ON phases FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLE: processes
-- ============================================================
CREATE POLICY "Authenticated users can read all processes"
  ON processes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert processes"
  ON processes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update processes"
  ON processes FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete processes"
  ON processes FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLE: quality_gates
-- ============================================================
CREATE POLICY "Authenticated users can read all quality_gates"
  ON quality_gates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert quality_gates"
  ON quality_gates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quality_gates"
  ON quality_gates FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete quality_gates"
  ON quality_gates FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLE: squad_jobs
-- ============================================================
CREATE POLICY "Authenticated users can read all squad_jobs"
  ON squad_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert squad_jobs"
  ON squad_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update squad_jobs"
  ON squad_jobs FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete squad_jobs"
  ON squad_jobs FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABLE: deliverables
-- ============================================================
CREATE POLICY "Authenticated users can read all deliverables"
  ON deliverables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert deliverables"
  ON deliverables FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update deliverables"
  ON deliverables FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete deliverables"
  ON deliverables FOR DELETE
  TO authenticated
  USING (true);
