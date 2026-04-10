'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from './clients'

const setBudgetSchema = z.object({
  processId: z.string().uuid(),
  tokenBudget: z.number().int().min(1000, 'Orcamento minimo e 1.000 tokens'),
})

const removeBudgetSchema = z.object({
  processId: z.string().uuid(),
})

export async function setProcessBudget(
  processId: string,
  tokenBudget: number
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  const input = setBudgetSchema.safeParse({ processId, tokenBudget })
  if (!input.success) return { error: input.error.issues[0]?.message ?? 'Entrada invalida' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('processes')
    .update({ token_budget: input.data.tokenBudget })
    .eq('id', input.data.processId)

  if (error) {
    console.error('[setProcessBudget] error:', error)
    return { error: error.message }
  }

  revalidatePath('/clients/[id]', 'page')
  revalidatePath('/costs', 'page')
  return { success: true }
}

export async function removeProcessBudget(
  processId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  const input = removeBudgetSchema.safeParse({ processId })
  if (!input.success) return { error: 'ID de processo invalido' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('processes')
    .update({ token_budget: null })
    .eq('id', input.data.processId)

  if (error) {
    console.error('[removeProcessBudget] error:', error)
    return { error: error.message }
  }

  revalidatePath('/clients/[id]', 'page')
  revalidatePath('/costs', 'page')
  return { success: true }
}
