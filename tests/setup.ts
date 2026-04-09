/**
 * Agency OS: Vitest test setup
 *
 * Integration tests run against the cloud Supabase project (configured via .env.local).
 * Fallback: local Supabase (requires `supabase start`).
 *
 * The service role key is read from SUPABASE_SERVICE_ROLE_KEY env var.
 * For local development, the default local key from `supabase start` output is used.
 *
 * Security note (T-03-01): Service role key bypasses RLS -- acceptable for testing only.
 * Tests must never be deployed to production; this file is test infrastructure.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local for cloud Supabase credentials (falls back to process.env if already set)
config({ path: resolve(process.cwd(), '.env.local'), override: false })
config({ path: resolve(process.cwd(), '.env'), override: false })

// Cloud Supabase defaults (from .env.local); fallback to local Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hj04zWl196z2-SBc0'

/**
 * Admin/service-role Supabase client for integration tests.
 * Bypasses RLS -- use only in test files.
 */
export const testClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Clean all test data from the database.
 * Deletes in reverse dependency order to avoid FK violations.
 * Uses a sentinel UUID that no real row will ever have to force delete-all.
 */
export async function cleanTestData() {
  const sentinel = '00000000-0000-0000-0000-000000000000'
  await testClient.from('deliverables').delete().neq('id', sentinel)
  await testClient.from('squad_jobs').delete().neq('id', sentinel)
  await testClient.from('quality_gates').delete().neq('id', sentinel)
  await testClient.from('processes').delete().neq('id', sentinel)
  await testClient.from('phases').delete().neq('id', sentinel)
  await testClient.from('clients').delete().neq('id', sentinel)
}
