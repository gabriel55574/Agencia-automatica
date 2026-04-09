-- Agency OS: Atomic client + phase initialization function
-- Creates 1 client row + 5 phase rows in a single transaction.
-- Called by the createClient Server Action via admin.rpc().

CREATE OR REPLACE FUNCTION create_client_with_phases(
  p_name TEXT,
  p_company TEXT,
  p_briefing JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_id UUID;
  v_phase_names TEXT[] := ARRAY[
    'Diagnostico',
    'Engenharia de Valor',
    'Go-to-Market',
    'Tracao e Vendas',
    'Retencao e Escala'
  ];
  i INT;
BEGIN
  -- Insert client row; triggers (moddatetime) fire on UPDATE, not INSERT.
  -- current_phase_number defaults to 1, status defaults to 'active'.
  INSERT INTO clients (name, company, briefing)
  VALUES (p_name, p_company, p_briefing)
  RETURNING id INTO v_client_id;

  -- Insert 5 phase rows atomically.
  -- Phase 1: active + started_at = NOW()
  -- Phases 2-5: pending (trigger allows pending inserts for non-phase-1)
  FOR i IN 1..5 LOOP
    INSERT INTO phases (client_id, phase_number, name, status, started_at)
    VALUES (
      v_client_id,
      i,
      v_phase_names[i],
      CASE WHEN i = 1 THEN 'active'::TEXT ELSE 'pending'::TEXT END,
      CASE WHEN i = 1 THEN NOW() ELSE NULL END
    );
  END LOOP;

  RETURN v_client_id;
END;
$$;
