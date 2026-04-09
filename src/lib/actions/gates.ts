'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from './clients'

const gateIdSchema = z.object({
  gateId: z.string().uuid(),
  clientId: z.string().uuid(),
})

const rejectGateSchema = gateIdSchema.extend({
  failedProcessIds: z.array(z.string().uuid()).min(1, 'Select at least one process to rework'),
  notes: z.string().max(2000).optional(),
})

export async function approveGateAction(
  gateId: string,
  clientId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const input = gateIdSchema.safeParse({ gateId, clientId })
  if (!input.success) return { error: 'Invalid gate or client ID' }

  const admin = createAdminClient()
  const { error } = await admin.rpc('approve_gate', {
    p_gate_id: input.data.gateId,
    p_client_id: input.data.clientId,
  })

  if (error) {
    console.error('[approveGateAction] RPC error:', error)
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

export async function rejectGateAction(
  gateId: string,
  clientId: string,
  failedProcessIds: string[],
  notes: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const input = rejectGateSchema.safeParse({ gateId, clientId, failedProcessIds, notes })
  if (!input.success) return { error: input.error.issues[0]?.message ?? 'Invalid input' }

  const admin = createAdminClient()
  const { error } = await admin.rpc('reject_gate', {
    p_gate_id: input.data.gateId,
    p_client_id: input.data.clientId,
    p_failed_process_ids: input.data.failedProcessIds,
    p_notes: input.data.notes ?? undefined,
  })

  if (error) {
    console.error('[rejectGateAction] RPC error:', error)
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
