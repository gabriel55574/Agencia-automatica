'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { briefingSchema, clientInsertSchema } from '@/lib/database/schema'
import { createClient } from '@/lib/supabase/server'

export type ActionResult = { error: string } | { success: true; redirectTo?: string; clientId?: string }

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  // Security (T-2-01-03): verify authenticated session before admin write
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  // Validate briefing fields (T-2-01-01)
  const briefingResult = briefingSchema.safeParse({
    niche: formData.get('niche'),
    target_audience: formData.get('target_audience'),
    additional_context: formData.get('additional_context') || null,
  })
  if (!briefingResult.success) {
    return { error: 'Dados de briefing invalidos: ' + briefingResult.error.issues[0]?.message }
  }

  // Validate top-level client fields (T-2-01-01, T-2-01-02)
  const clientResult = clientInsertSchema.safeParse({
    name: formData.get('name'),
    company: formData.get('company'),
    briefing: briefingResult.data,
  })
  if (!clientResult.success) {
    return { error: 'Dados do cliente invalidos: ' + clientResult.error.issues[0]?.message }
  }

  const admin = createAdminClient()
  const { data: clientId, error: rpcError } = await admin.rpc('create_client_with_phases', {
    p_name: clientResult.data.name,
    p_company: clientResult.data.company,
    p_briefing: clientResult.data.briefing ?? undefined,
  })

  if (rpcError) {
    console.error('[createClientAction] RPC error:', rpcError)
    return { error: 'Falha ao criar cliente. Tente novamente.' }
  }

  revalidatePath('/clients')
  return { success: true as const, redirectTo: `/clients/${clientId}`, clientId: clientId as string }
}

export async function updateClientAction(
  clientId: string,
  formData: FormData
): Promise<ActionResult> {
  // Security: verify authenticated session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  // Validate inputs
  const nameResult = z.string().min(1).max(255).safeParse(formData.get('name'))
  const companyResult = z.string().min(1).max(255).safeParse(formData.get('company'))
  if (!nameResult.success) return { error: 'Nome e obrigatorio (max 255 caracteres)' }
  if (!companyResult.success) return { error: 'Empresa e obrigatoria (max 255 caracteres)' }

  const briefingResult = briefingSchema.safeParse({
    niche: formData.get('niche'),
    target_audience: formData.get('target_audience'),
    additional_context: formData.get('additional_context') || null,
  })
  if (!briefingResult.success) {
    return { error: 'Briefing invalido: ' + briefingResult.error.issues[0]?.message }
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
    return { error: 'Falha ao atualizar cliente. Tente novamente.' }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  return { success: true as const, redirectTo: `/clients/${clientId}` }
}

export async function archiveClientAction(clientId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({ status: 'archived' })
    .eq('id', clientId)

  if (error) {
    console.error('[archiveClientAction] error:', error)
    return { error: 'Falha ao arquivar cliente. Tente novamente.' }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  return { success: true as const, redirectTo: '/clients' }
}

export async function restoreClientAction(clientId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({ status: 'active' })
    .eq('id', clientId)

  if (error) {
    console.error('[restoreClientAction] error:', error)
    return { error: 'Falha ao restaurar cliente. Tente novamente.' }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  return { success: true as const, redirectTo: `/clients/${clientId}` }
}

/**
 * Clone a client's configuration (briefing) to create a new client (TMPL-02).
 * Copies briefing fields from the source client. Does NOT copy pipeline state,
 * squad runs, or gate reviews — the new client starts fresh at Phase 1.
 */
export async function cloneClientAction(
  sourceClientId: string,
  newName: string,
  newCompany: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  // Validate inputs
  const idResult = z.string().uuid().safeParse(sourceClientId)
  if (!idResult.success) return { error: 'ID do cliente de origem invalido' }

  const nameResult = z.string().min(1).max(255).safeParse(newName)
  if (!nameResult.success) return { error: 'Nome e obrigatorio (max 255 caracteres)' }

  const companyResult = z.string().min(1).max(255).safeParse(newCompany)
  if (!companyResult.success) return { error: 'Empresa e obrigatoria (max 255 caracteres)' }

  const admin = createAdminClient()

  // Fetch source client's briefing
  const { data: sourceClient, error: fetchError } = await admin
    .from('clients')
    .select('briefing')
    .eq('id', idResult.data)
    .single()

  if (fetchError || !sourceClient) {
    return { error: 'Cliente de origem nao encontrado' }
  }

  // Create new client with cloned briefing using existing RPC
  // Starts fresh at Phase 1 — does NOT copy pipeline state, jobs, or gate reviews
  const { data: clientId, error: rpcError } = await admin.rpc('create_client_with_phases', {
    p_name: nameResult.data,
    p_company: companyResult.data,
    p_briefing: sourceClient.briefing ?? undefined,
  })

  if (rpcError) {
    console.error('[cloneClientAction] RPC error:', rpcError)
    return { error: 'Falha ao clonar cliente. Tente novamente.' }
  }

  revalidatePath('/clients')
  return { success: true as const, redirectTo: `/clients/${clientId}`, clientId: clientId as string }
}
