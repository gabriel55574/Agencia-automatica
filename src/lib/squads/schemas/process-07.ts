/**
 * Process 07: Planejamento G-STIC
 * Phase 3 (Go-to-Market) — Squad Planejamento
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Meta com foco + quanto + quando
 * - Proposicao de valor para 3 entidades
 * - 7 Ts detalhados
 * - Cronograma de implementacao
 * - Dashboard de metricas de controle
 */

import { z } from 'zod'

export const process07Schema = z.object({
  goal: z.object({
    focus: z.string().min(1),
    quantitative_benchmark: z.string().min(1),
    temporal_benchmark: z.string().min(1),
  }),
  strategy: z.object({
    client_value: z.string().min(1),
    company_value: z.string().min(1),
    partner_value: z.string().min(1),
  }),
  tactics_7t: z.record(z.string(), z.string()),
  implementation_timeline: z.string().min(1),
  control_dashboard: z.string().min(1),
})

export type Process07Output = z.infer<typeof process07Schema>
