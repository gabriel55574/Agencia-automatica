'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { briefingSchema, clientInsertSchema } from '@/lib/database/schema'
import { createClient } from '@/lib/supabase/server'

export type ActionResult = { error: string } | { success: true }

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  // Security (T-2-01-03): verify authenticated session before admin write
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Validate briefing fields (T-2-01-01)
  const briefingResult = briefingSchema.safeParse({
    niche: formData.get('niche'),
    target_audience: formData.get('target_audience'),
    additional_context: formData.get('additional_context') || null,
  })
  if (!briefingResult.success) {
    return { error: 'Invalid briefing data: ' + briefingResult.error.issues[0]?.message }
  }

  // Validate top-level client fields (T-2-01-01, T-2-01-02)
  const clientResult = clientInsertSchema.safeParse({
    name: formData.get('name'),
    company: formData.get('company'),
    briefing: briefingResult.data,
  })
  if (!clientResult.success) {
    return { error: 'Invalid client data: ' + clientResult.error.issues[0]?.message }
  }

  const admin = createAdminClient()
  const { data: clientId, error: rpcError } = await admin.rpc('create_client_with_phases', {
    p_name: clientResult.data.name,
    p_company: clientResult.data.company,
    p_briefing: (clientResult.data.briefing ?? null) as Record<string, unknown> | null,
  })

  if (rpcError) {
    console.error('[createClientAction] RPC error:', rpcError)
    return { error: 'Failed to create client. Please try again.' }
  }

  revalidatePath('/clients')
  redirect(`/clients/${clientId}`)
}
