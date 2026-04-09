'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
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
    p_briefing: clientResult.data.briefing ?? undefined,
  })

  if (rpcError) {
    console.error('[createClientAction] RPC error:', rpcError)
    return { error: 'Failed to create client. Please try again.' }
  }

  revalidatePath('/clients')
  redirect(`/clients/${clientId}`)
}

export async function updateClientAction(
  clientId: string,
  formData: FormData
): Promise<ActionResult> {
  // Security: verify authenticated session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Validate inputs
  const nameResult = z.string().min(1).max(255).safeParse(formData.get('name'))
  const companyResult = z.string().min(1).max(255).safeParse(formData.get('company'))
  if (!nameResult.success) return { error: 'Name is required (max 255 characters)' }
  if (!companyResult.success) return { error: 'Company is required (max 255 characters)' }

  const briefingResult = briefingSchema.safeParse({
    niche: formData.get('niche'),
    target_audience: formData.get('target_audience'),
    additional_context: formData.get('additional_context') || null,
  })
  if (!briefingResult.success) {
    return { error: 'Invalid briefing: ' + briefingResult.error.issues[0]?.message }
  }

  const admin = createAdminClient()
  // SECURITY: only update display fields — never touch current_phase_number, status, cycle_number
  const { error: updateError } = await admin
    .from('clients')
    .update({
      name: nameResult.data,
      company: companyResult.data,
      briefing: briefingResult.data,
    })
    .eq('id', clientId)

  if (updateError) {
    console.error('[updateClientAction] error:', updateError)
    return { error: 'Failed to update client. Please try again.' }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}`)
}

export async function archiveClientAction(clientId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({ status: 'archived' })
    .eq('id', clientId)

  if (error) {
    console.error('[archiveClientAction] error:', error)
    return { error: 'Failed to archive client. Please try again.' }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  redirect('/clients')
}

export async function restoreClientAction(clientId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({ status: 'active' })
    .eq('id', clientId)

  if (error) {
    console.error('[restoreClientAction] error:', error)
    return { error: 'Failed to restore client. Please try again.' }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}`)
}
