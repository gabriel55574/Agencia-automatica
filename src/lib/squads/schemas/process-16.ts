/**
 * Process 16: CRM, Lealdade e CLV
 * Phase 5 (Retencao e Escala) — Squad CRM
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - CLV calculado e atualizado
 * - NPS implementado (promotores vs detratores mapeados)
 * - Automacoes de email ativas nos pontos de maior churn
 * - Programa de fidelidade operando
 * - Taxa de retencao > taxa de aquisicao em custo
 * - Clientes promotores gerando referrals
 */

import { z } from 'zod'

export const process16Schema = z.object({
  clv_by_segment: z.record(z.string(), z.string()),
  nps_analysis: z.object({
    promoters: z.string().min(1),
    detractors: z.string().min(1),
    passives: z.string().min(1),
  }),
  email_automations: z.array(z.string().min(1)),
  loyalty_program: z.string().min(1),
  retention_vs_acquisition: z.string().min(1),
  referral_program: z.string().min(1),
})

export type Process16Output = z.infer<typeof process16Schema>
