/**
 * Process 05: Pricing
 * Phase 2 (Engenharia de Valor) — Squad Estrategia
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Preco baseado em valor, nao em custo
 * - Bonus adicionados
 * - Gatilhos de escassez e urgencia definidos
 * - Garantia de reversao de risco incluida
 * - Nome da oferta com formula M-A-G-I-C
 */

import { z } from 'zod'

export const process05Schema = z.object({
  pricing_method: z.string().min(1),
  final_price: z.string().min(1),
  bonuses: z.array(z.string().min(1)),
  scarcity_triggers: z.array(z.string().min(1)),
  guarantee: z.string().min(1),
  offer_name_magic: z.string().min(1),
})

export type Process05Output = z.infer<typeof process05Schema>
