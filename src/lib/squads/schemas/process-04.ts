/**
 * Process 04: Grand Slam Offers
 * Phase 2 (Engenharia de Valor) — Squad Estrategia
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Resultado dos sonhos claramente articulado
 * - Obstaculos mapeados e transformados em solucoes
 * - Apenas itens de alto valor / baixo custo na pilha final
 * - Value Equation validada
 */

import { z } from 'zod'

export const process04Schema = z.object({
  dream_outcome: z.string().min(1),
  obstacles_and_solutions: z.array(
    z.object({
      obstacle: z.string().min(1),
      solution: z.string().min(1),
    })
  ),
  final_stack_items: z.array(z.string().min(1)),
  value_equation_validated: z.boolean(),
})

export type Process04Output = z.infer<typeof process04Schema>
