-- Agency OS: Phase Sequence Enforcement
-- Threat T-02-01: Prevents phase skipping at the database level (not just app code)
-- This trigger fires on any UPDATE or INSERT to the phases table,
-- regardless of whether it comes from the application, Supabase dashboard, or direct SQL.

-- ============================================================
-- FUNCTION: enforce_phase_sequence
-- Prevents activating phase N unless phase N-1 is completed.
-- Phase 1 is exempt -- it can always be activated (it is the starting phase).
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_phase_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check when status is being changed TO 'active'
  -- On INSERT: OLD is NULL so (OLD.status IS DISTINCT FROM 'active') is always true
  -- On UPDATE: only fire when status is newly becoming 'active'
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    -- Phase 1 can always be activated -- it is the starting phase with no prior requirement
    IF NEW.phase_number > 1 THEN
      -- Check that the immediately preceding phase is completed
      IF NOT EXISTS (
        SELECT 1 FROM phases
        WHERE client_id = NEW.client_id
          AND phase_number = NEW.phase_number - 1
          AND status = 'completed'
      ) THEN
        RAISE EXCEPTION 'Cannot activate phase % for client %: phase % is not completed',
          NEW.phase_number, NEW.client_id, NEW.phase_number - 1;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BEFORE UPDATE trigger: fires when existing phase row is updated to 'active'
CREATE TRIGGER trg_enforce_phase_sequence
  BEFORE UPDATE ON phases
  FOR EACH ROW
  EXECUTE FUNCTION enforce_phase_sequence();

-- BEFORE INSERT trigger: fires when a new phase row is inserted as 'active'
-- Prevents directly inserting an out-of-order active phase
CREATE TRIGGER trg_enforce_phase_sequence_insert
  BEFORE INSERT ON phases
  FOR EACH ROW
  EXECUTE FUNCTION enforce_phase_sequence();

-- ============================================================
-- FUNCTION: claim_next_job
-- Atomically claims the next queued squad_job for the worker.
-- FOR UPDATE SKIP LOCKED prevents double-claiming in concurrent workers.
-- Threat T-02-04: Prevents race conditions in job queue.
-- ============================================================
CREATE OR REPLACE FUNCTION claim_next_job()
RETURNS SETOF squad_jobs AS $$
BEGIN
  RETURN QUERY
  UPDATE squad_jobs
  SET status = 'running', started_at = NOW()
  WHERE id = (
    SELECT id FROM squad_jobs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
