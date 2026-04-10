'use server'

/**
 * Agency OS: Server Actions for squad execution.
 *
 * Two-step flow:
 * 1. assembleSquadContext — assembles context + builds prompt for preview
 * 2. confirmSquadRun — inserts job with status='queued' and the full CLI command
 *
 * Security:
 * - T-05-05: Auth check via createClient().auth.getUser() at top of every action
 * - T-05-06: All inputs validated with Zod (UUID format, enum, non-empty)
 * - T-05-08: assembleContext scopes all queries to clientId
 * - T-05-09: Admin client used only for INSERT, not for auth decisions
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assembleContext } from '@/lib/squads/assembler'
import { PROCESS_TO_SQUAD } from '@/lib/database/enums'
import { PROCESS_DEFINITIONS } from '@/lib/pipeline/processes'
import type { ActionResult } from './clients'
import type { AssembledContext } from '@/lib/squads/assembler'

// Import the correct buildPrompt based on squad type
import { buildPrompt as buildEstrategiaPrompt } from '@/lib/squads/estrategia'
import { buildPrompt as buildPlanejamentoPrompt } from '@/lib/squads/planejamento'
import { buildPrompt as buildGrowthPrompt } from '@/lib/squads/growth'
import { buildPrompt as buildCrmPrompt } from '@/lib/squads/crm'

const SQUAD_PROMPT_BUILDERS: Record<string, typeof buildEstrategiaPrompt> = {
  estrategia: buildEstrategiaPrompt,
  planejamento: buildPlanejamentoPrompt,
  growth: buildGrowthPrompt,
  crm: buildCrmPrompt,
}

// Zod validation for inputs
const assembleInputSchema = z.object({
  clientId: z.string().uuid(),
  processId: z.string().uuid(),
  processNumber: z.number().int().min(1).max(16),
})

const confirmInputSchema = z.object({
  processId: z.string().uuid(),
  clientId: z.string().uuid(),
  phaseId: z.string().uuid(),
  squadType: z.enum(['estrategia', 'planejamento', 'growth', 'crm']),
  cliCommand: z.string().min(1),
})

/**
 * Step 1: Assemble context and build prompt for preview.
 * Called when operator clicks "Run Squad" -- before the modal confirms.
 * TMPL-03: Optional templateId fetches template content and includes it in context.
 */
export async function assembleSquadContext(
  clientId: string,
  processId: string,
  processNumber: number,
  templateId?: string | null
): Promise<{ context: AssembledContext; prompt: string; squadType: string } | { error: string }> {
  // Auth check (always first -- matches gates.ts pattern)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  const input = assembleInputSchema.safeParse({ clientId, processId, processNumber })
  if (!input.success) return { error: 'Entrada invalida: ' + input.error.issues[0]?.message }

  const squadType = PROCESS_TO_SQUAD[processNumber]
  if (!squadType) return { error: `Nenhum squad mapeado para o processo ${processNumber}` }

  // TMPL-03: Fetch template content if templateId provided
  let templateContent: string | undefined
  if (templateId) {
    const tidResult = z.string().uuid().safeParse(templateId)
    if (!tidResult.success) return { error: 'ID de template invalido' }

    const admin = createAdminClient()
    const { data: template, error: tplError } = await admin
      .from('templates')
      .select('content')
      .eq('id', tidResult.data)
      .single()

    if (tplError || !template) return { error: 'Template nao encontrado' }
    templateContent = JSON.stringify(template.content)
  }

  const context = await assembleContext(
    clientId,
    processNumber,
    undefined,
    templateContent,
    PROCESS_DEFINITIONS[processNumber]?.context_from
  )
  const builder = SQUAD_PROMPT_BUILDERS[squadType]
  if (!builder) return { error: `Nenhum construtor de prompt para o squad ${squadType}` }

  const prompt = builder(context, processNumber)
  return { context, prompt, squadType }
}

/**
 * Step 2: Confirm and queue the squad run.
 * Called when operator clicks "Confirm & Run" in the preview modal.
 * Inserts into squad_jobs with status='queued' and the full CLI command string.
 */
export async function confirmSquadRun(
  processId: string,
  clientId: string,
  phaseId: string,
  squadType: string,
  cliCommand: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autorizado' }

  const input = confirmInputSchema.safeParse({
    processId, clientId, phaseId, squadType, cliCommand,
  })
  if (!input.success) return { error: input.error.issues[0]?.message ?? 'Entrada invalida' }

  const admin = createAdminClient()
  const { error } = await admin.from('squad_jobs').insert({
    client_id: input.data.clientId,
    phase_id: input.data.phaseId,
    process_id: input.data.processId,
    squad_type: input.data.squadType,
    status: 'queued',
    cli_command: input.data.cliCommand,
  })

  if (error) {
    console.error('[confirmSquadRun] Insert error:', error)
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
