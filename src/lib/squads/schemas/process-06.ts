/**
 * Process 06: Branding Estrategico
 * Phase 2 (Engenharia de Valor) — Squad Estrategia
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Mantra da marca definido
 * - Elementos visuais desenhados
 * - Associacoes secundarias mapeadas
 * - Pontos de Diferenca e Paridade identificados
 */

import { z } from 'zod'

export const process06Schema = z.object({
  brand_mantra: z.string().min(1),
  visual_elements: z.array(z.string().min(1)),
  secondary_associations: z.array(z.string().min(1)),
  points_of_difference: z.array(z.string().min(1)),
  points_of_parity: z.array(z.string().min(1)),
})

export type Process06Output = z.infer<typeof process06Schema>
