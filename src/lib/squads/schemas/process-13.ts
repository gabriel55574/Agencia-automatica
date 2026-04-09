/**
 * Process 13: Comunicacao Integrada IMC
 * Phase 4 (Tracao e Vendas) — Squad Growth
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Mix de canais definido com orcamento
 * - Mesma mensagem em todos os pontos de contato
 * - Integracao horizontal e vertical validadas
 * - Calendario editorial configurado
 */

import { z } from 'zod'

export const process13Schema = z.object({
  communication_mix: z.array(
    z.object({
      channel: z.string().min(1),
      budget: z.string().min(1),
    })
  ),
  horizontal_integration: z.string().min(1),
  vertical_integration: z.string().min(1),
  editorial_calendar: z.string().min(1),
})

export type Process13Output = z.infer<typeof process13Schema>
