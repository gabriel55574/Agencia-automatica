/**
 * Process 14: Bullseye Framework - 19 Canais
 * Phase 4 (Tracao e Vendas) — Squad Growth
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - 19 canais avaliados no brainstorm
 * - 3-5 canais testados com dados reais
 * - CAC medido por canal
 * - LTV estimado por canal
 * - 1 canal principal selecionado para foco total
 * - Regra dos 50% aplicada
 */

import { z } from 'zod'

export const process14Schema = z.object({
  brainstorm_19_channels: z.array(z.string().min(1)),
  tested_channels: z.array(
    z.object({
      channel: z.string().min(1),
      result: z.string().min(1),
    })
  ),
  cac_by_channel: z.record(z.string(), z.string()),
  ltv_by_channel: z.record(z.string(), z.string()),
  primary_channel: z.string().min(1),
  rule_50_applied: z.boolean(),
})

export type Process14Output = z.infer<typeof process14Schema>
