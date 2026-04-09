-- Agency OS: Extend create_client_with_phases to seed process + gate rows
-- Phase 3: Pipeline Engine (PIPE-01, PIPE-05)
-- Replaces migration 00004 function (CREATE OR REPLACE is safe)

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
  v_temp_phase_id UUID;
  v_phase_ids UUID[] := ARRAY[]::UUID[];
  v_phase_names TEXT[] := ARRAY[
    'Diagnostico',
    'Engenharia de Valor',
    'Go-to-Market',
    'Tracao e Vendas',
    'Retencao e Escala'
  ];
  i INT;
BEGIN
  INSERT INTO clients (name, company, briefing)
  VALUES (p_name, p_company, p_briefing)
  RETURNING id INTO v_client_id;

  FOR i IN 1..5 LOOP
    INSERT INTO phases (client_id, phase_number, name, status, started_at)
    VALUES (
      v_client_id, i, v_phase_names[i],
      CASE WHEN i = 1 THEN 'active'::TEXT ELSE 'pending'::TEXT END,
      CASE WHEN i = 1 THEN NOW() ELSE NULL END
    )
    RETURNING id INTO v_temp_phase_id;
    v_phase_ids := v_phase_ids || v_temp_phase_id;
  END LOOP;

  -- Seed 16 process rows (all pending)
  -- v_phase_ids[1..5] correspond to phases 1..5
  INSERT INTO processes (phase_id, client_id, process_number, name, squad, status)
  VALUES
    (v_phase_ids[1], v_client_id, 1,  'Pesquisa de Mercado e Insights',    'estrategia',   'pending'),
    (v_phase_ids[1], v_client_id, 2,  'Segmentacao, Targeting e Personas', 'estrategia',   'pending'),
    (v_phase_ids[2], v_client_id, 3,  'Posicionamento',                    'estrategia',   'pending'),
    (v_phase_ids[2], v_client_id, 4,  'Grand Slam Offers',                 'estrategia',   'pending'),
    (v_phase_ids[2], v_client_id, 5,  'Pricing',                           'estrategia',   'pending'),
    (v_phase_ids[2], v_client_id, 6,  'Branding Estrategico',              'estrategia',   'pending'),
    (v_phase_ids[3], v_client_id, 7,  'Planejamento G-STIC',               'planejamento', 'pending'),
    (v_phase_ids[3], v_client_id, 8,  'Design de Canais de Distribuicao',  'planejamento', 'pending'),
    (v_phase_ids[3], v_client_id, 9,  'Varejo e Omnichannel',              'planejamento', 'pending'),
    (v_phase_ids[3], v_client_id, 10, 'Logistica e Supply Chain',          'planejamento', 'pending'),
    (v_phase_ids[3], v_client_id, 11, 'Marketing de Causa e RSC',          'planejamento', 'pending'),
    (v_phase_ids[4], v_client_id, 12, 'Producao Criativa',                 'growth',       'pending'),
    (v_phase_ids[4], v_client_id, 13, 'Comunicacao Integrada IMC',         'growth',       'pending'),
    (v_phase_ids[4], v_client_id, 14, 'Bullseye Framework - 19 Canais',    'growth',       'pending'),
    (v_phase_ids[4], v_client_id, 15, 'Funil de Vendas',                   'growth',       'pending'),
    (v_phase_ids[5], v_client_id, 16, 'CRM, Lealdade e CLV',               'crm',          'pending');

  -- Seed 4 quality_gate rows (one per phase 1-4)
  INSERT INTO quality_gates (phase_id, client_id, gate_number, status)
  VALUES
    (v_phase_ids[1], v_client_id, 1, 'pending'),
    (v_phase_ids[2], v_client_id, 2, 'pending'),
    (v_phase_ids[3], v_client_id, 3, 'pending'),
    (v_phase_ids[4], v_client_id, 4, 'pending');

  RETURN v_client_id;
END;
$$;
