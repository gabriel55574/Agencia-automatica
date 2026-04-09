/**
 * Process 12: Producao Criativa
 * Phase 4 (Tracao e Vendas) — Squad Growth
 *
 * Output schema derived from docs/agency-os-prompt.md output checklist:
 * - Copys para cada canal
 * - Criativos visuais (imagens, videos)
 * - Roteiros de video/audio
 * - Landing pages estruturadas
 * - Todos consistentes com posicionamento da Fase 2
 */

import { z } from 'zod'

export const process12Schema = z.object({
  channel_copies: z.record(z.string(), z.string()),
  visual_creatives: z.array(z.string().min(1)),
  video_scripts: z.array(z.string().min(1)),
  landing_pages: z.array(z.string().min(1)),
  positioning_consistency_check: z.string().min(1),
})

export type Process12Output = z.infer<typeof process12Schema>
