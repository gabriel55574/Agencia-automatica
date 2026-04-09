/**
 * Process 08: Design de Canais de Distribuicao
 * Phase 3 (Go-to-Market) — Squad Planejamento
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Canais mapeados (direto/indireto/omnichannel)
 * - Intermediarios selecionados e avaliados
 * - Plano de gestao de conflitos de canal
 */

import { z } from 'zod'

export const process08Schema = z.object({
  channels: z.array(
    z.object({
      type: z.enum(['direct', 'indirect', 'omnichannel']),
      description: z.string().min(1),
    })
  ),
  intermediaries: z.array(z.string().min(1)),
  conflict_management_plan: z.string().min(1),
})

export type Process08Output = z.infer<typeof process08Schema>
