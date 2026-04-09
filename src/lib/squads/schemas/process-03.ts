/**
 * Process 03: Posicionamento
 * Phase 2 (Engenharia de Valor) — Squad Estrategia
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Alternativas competitivas mapeadas
 * - Atributos unicos FACTUAIS
 * - Proposta de valor conectada a beneficios reais
 * - Categoria de mercado que torna pontos fortes obvios
 * - Nome estrategico validado
 */

import { z } from 'zod'

export const process03Schema = z.object({
  competitive_alternatives: z.array(z.string().min(1)),
  unique_attributes: z.array(z.string().min(1)),
  value_proposition: z.string().min(1),
  market_category: z.string().min(1),
  strategic_name: z.string().min(1),
})

export type Process03Output = z.infer<typeof process03Schema>
