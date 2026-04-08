-- Agency OS: Local Development Seed Data
-- Provides a demo client with 5 phases for local development.
--
-- IMPORTANT: The operator user is created via the Supabase dashboard.
-- For local dev (after running `supabase start`):
--   - Go to http://localhost:54323 (Supabase Studio)
--   - Navigate to Authentication > Users
--   - Create the operator user with email and password
--
-- This seed script only inserts application data, not auth users.

-- Demo client
INSERT INTO clients (id, name, company, current_phase_number, status, cycle_number)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Demo Operador',
  'Demo Corp',
  1,
  'active',
  1
);

-- 5 phases for demo client
-- Phase 1: active (the starting phase)
-- Phases 2-5: pending (waiting to be activated sequentially)
INSERT INTO phases (client_id, phase_number, name, status, started_at)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    1,
    'Diagnostico',
    'active',
    NOW()
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    2,
    'Engenharia de Valor',
    'pending',
    NULL
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    3,
    'Go-to-Market',
    'pending',
    NULL
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    4,
    'Tracao e Vendas',
    'pending',
    NULL
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    5,
    'Retencao e Escala',
    'pending',
    NULL
  );
