-- Agency OS: Phase 9 - Feedback Loop
-- reset_pipeline_cycle: Resets a client pipeline for a new cycle.
-- Preserves all historical data (squad_jobs, gate_reviews, deliverables).
--
-- Uses the RESET-in-place approach: updates existing phase/process/gate rows
-- rather than creating new ones, avoiding FK constraint issues with squad_jobs
-- that reference existing phase_id and process_id values.
--
-- Security (T-09-01): Uses SELECT FOR UPDATE to prevent concurrent resets.
-- Guards check Phase 5 completion status before allowing reset.

CREATE OR REPLACE FUNCTION reset_pipeline_cycle(p_client_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_client clients%ROWTYPE;
BEGIN
  -- Lock client row to prevent concurrent resets (T-09-01)
  SELECT * INTO v_client
  FROM clients
  WHERE id = p_client_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client % not found', p_client_id;
  END IF;

  -- Guard: only reset active clients who completed Phase 5
  IF v_client.current_phase_number < 5 THEN
    RAISE EXCEPTION 'Client % has not completed Phase 5 (current phase: %)',
      p_client_id, v_client.current_phase_number;
  END IF;

  -- Check Phase 5 is completed
  IF NOT EXISTS (
    SELECT 1 FROM phases
    WHERE client_id = p_client_id
      AND phase_number = 5
      AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Client % Phase 5 is not completed', p_client_id;
  END IF;

  -- Step 1: Increment cycle_number and reset current_phase_number to 1
  UPDATE clients
  SET cycle_number = cycle_number + 1,
      current_phase_number = 1
  WHERE id = p_client_id;

  -- Step 2: Reset phase rows in-place
  -- Phase 1 becomes active, phases 2-5 become pending
  -- Old completed squad_jobs remain linked to these same phase_ids
  UPDATE phases
  SET status = 'active',
      started_at = NOW(),
      completed_at = NULL
  WHERE client_id = p_client_id
    AND phase_number = 1;

  UPDATE phases
  SET status = 'pending',
      started_at = NULL,
      completed_at = NULL
  WHERE client_id = p_client_id
    AND phase_number > 1;

  -- Step 3: Reset all process rows to pending
  -- Clears output fields but preserves the row IDs (squad_jobs FK intact)
  UPDATE processes
  SET status = 'pending',
      input_snapshot = NULL,
      output_json = NULL,
      output_markdown = NULL,
      started_at = NULL,
      completed_at = NULL
  WHERE client_id = p_client_id;

  -- Step 4: Reset all quality gate rows to pending
  -- Clears review data but preserves the row IDs (gate_reviews FK intact)
  UPDATE quality_gates
  SET status = 'pending',
      ai_review_json = NULL,
      checklist_results = NULL,
      operator_decision = NULL,
      operator_notes = NULL,
      reviewed_at = NULL
  WHERE client_id = p_client_id;
END;
$$;
