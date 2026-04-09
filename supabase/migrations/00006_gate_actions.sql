-- Agency OS: Gate action stored functions
-- Phase 3: Pipeline Engine (PIPE-02, PIPE-03, PIPE-04)
-- Both functions use SELECT FOR UPDATE to prevent race conditions (T-3-02)

-- ============================================================
-- FUNCTION: approve_gate
-- Atomically approves a gate, completes the current phase,
-- and activates the next phase. Uses FOR UPDATE to prevent
-- concurrent double-approval.
-- ============================================================
CREATE OR REPLACE FUNCTION approve_gate(p_gate_id UUID, p_client_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_gate quality_gates%ROWTYPE;
BEGIN
  -- Acquire row lock (prevents concurrent approve_gate calls double-processing)
  SELECT * INTO v_gate
  FROM quality_gates
  WHERE id = p_gate_id AND client_id = p_client_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gate % not found for client %', p_gate_id, p_client_id;
  END IF;

  -- Guard: only approve if pending or rejected (idempotency guard)
  IF v_gate.status NOT IN ('pending', 'rejected') THEN
    RAISE EXCEPTION 'Gate % cannot be approved: current status is %',
      p_gate_id, v_gate.status;
  END IF;

  -- Update gate to approved
  UPDATE quality_gates
  SET status = 'approved',
      operator_decision = 'approved',
      reviewed_at = NOW()
  WHERE id = p_gate_id;

  -- Complete the current phase
  UPDATE phases
  SET status = 'completed', completed_at = NOW()
  WHERE id = v_gate.phase_id;

  -- Activate next phase (gate_number maps 1:1 to phase_number)
  -- enforce_phase_sequence trigger fires here and validates the transition
  UPDATE phases
  SET status = 'active', started_at = NOW()
  WHERE client_id = p_client_id
    AND phase_number = v_gate.gate_number + 1;

  -- Update clients.current_phase_number
  UPDATE clients
  SET current_phase_number = v_gate.gate_number + 1
  WHERE id = p_client_id;
END;
$$;

-- ============================================================
-- FUNCTION: reject_gate
-- Marks the gate as rejected, marks selected processes as failed.
-- Phase remains active (no regression).
-- Uses FOR UPDATE to prevent concurrent rejection conflicts.
-- ============================================================
CREATE OR REPLACE FUNCTION reject_gate(
  p_gate_id UUID,
  p_client_id UUID,
  p_failed_process_ids UUID[],
  p_notes TEXT DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_gate quality_gates%ROWTYPE;
BEGIN
  -- Acquire row lock
  SELECT * INTO v_gate
  FROM quality_gates
  WHERE id = p_gate_id AND client_id = p_client_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gate % not found for client %', p_gate_id, p_client_id;
  END IF;

  -- Guard: cannot reject an already-approved gate
  IF v_gate.status = 'approved' THEN
    RAISE EXCEPTION 'Gate % cannot be rejected: already approved', p_gate_id;
  END IF;

  -- Update gate to rejected
  UPDATE quality_gates
  SET status = 'rejected',
      operator_decision = 'rejected',
      operator_notes = p_notes,
      reviewed_at = NOW()
  WHERE id = p_gate_id;

  -- Mark selected processes as failed (rework routing — PIPE-03)
  -- Phase status remains 'active' (no UPDATE to phases table)
  UPDATE processes
  SET status = 'failed'
  WHERE id = ANY(p_failed_process_ids)
    AND client_id = p_client_id;
END;
$$;
