/**
 * Process 15: Funil de Vendas
 * Phase 4 (Tracao e Vendas) — Squad Growth
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Leads classificados em A/B/C
 * - Script SPIN documentado
 * - FAQs e materiais de contorno de objecoes
 * - Taxa de conversao por etapa do funil
 * - Processo de onboarding pos-venda definido
 */

import { z } from 'zod'

export const process15Schema = z.object({
  leads_classified: z.array(
    z.object({
      category: z.enum(['A', 'B', 'C']),
      count: z.number().int().min(0),
      description: z.string().min(1),
    })
  ),
  spin_script: z.string().min(1),
  objection_faqs: z.array(z.string().min(1)),
  conversion_rate_by_stage: z.record(z.string(), z.string()),
  onboarding_process: z.string().min(1),
})

export type Process15Output = z.infer<typeof process15Schema>
