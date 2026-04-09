/**
 * Process 01: Pesquisa de Mercado e Insights
 * Phase 1 (Diagnostico) — Squad Estrategia
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Problema/oportunidade claramente definido
 * - Fontes de dados mapeadas (primarios e secundarios)
 * - Analise competitiva (5 Cs)
 * - Insights acionaveis para decisao de negocio
 */

import { z } from 'zod'

export const process01Schema = z.object({
  problem_definition: z.string().min(1),
  data_sources: z.array(z.string().min(1)),
  competitive_analysis: z.object({
    clientes: z.string().min(1),
    colaboradores: z.string().min(1),
    companhia: z.string().min(1),
    concorrentes: z.string().min(1),
    contexto: z.string().min(1),
  }),
  actionable_insights: z.array(z.string().min(1)),
})

export type Process01Output = z.infer<typeof process01Schema>
