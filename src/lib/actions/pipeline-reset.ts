'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from './clients'

const resetSchema = z.object({
  clientId: z.string().uuid(),
})

/**
 * Server Action: Reset a client's pipeline for a new cycle.
 *
 * Calls the reset_pipeline_cycle RPC which:
 * - Guards that Phase 5 is completed (T-09-06)
 * - Increments cycle_number
 * - Resets all phases/processes/gates to pending
 * - Preserves historical squad_jobs and gate_reviews
 *
 * Security (T-09-05): Auth check at entry point.
 * Security (T-09-06): Zod validation on clientId (must be UUID).
 */
export async function resetPipelineAction(clientId: string): Promise<ActionResult> {
  // Auth check (T-09-05)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  // Validate input (T-09-06)
  const input = resetSchema.safeParse({ clientId })
  if (!input.success) return { error: 'ID de cliente invalido' }

  const admin = createAdminClient()
  const { error } = await admin.rpc('reset_pipeline_cycle', {
    p_client_id: input.data.clientId,
  })

  if (error) {
    console.error('[resetPipelineAction] RPC error:', error)
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
