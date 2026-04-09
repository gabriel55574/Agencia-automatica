/**
 * Process 02: Segmentacao, Targeting e Personas
 * Phase 1 (Diagnostico) — Squad Estrategia
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Segmentos identificados com variaveis claras
 * - Teste de atratividade aprovado
 * - Teste de compatibilidade aprovado
 * - Personas detalhadas com dores, desejos e comportamentos
 * - Custo para servir < receita esperada
 */

import { z } from 'zod'

export const process02Schema = z.object({
  segments: z.array(
    z.object({
      name: z.string().min(1),
      variables: z.string().min(1),
      attractiveness: z.string().min(1),
      compatibility: z.string().min(1),
    })
  ).min(1),
  personas: z.array(
    z.object({
      name: z.string().min(1),
      pains: z.string().min(1),
      desires: z.string().min(1),
      behaviors: z.string().min(1),
    })
  ).min(1),
  cost_to_serve_validated: z.boolean(),
})

export type Process02Output = z.infer<typeof process02Schema>
