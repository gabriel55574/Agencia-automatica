import type { PhaseNumber } from '@/lib/database/enums'

/** Bottleneck threshold in days per phase. Clients in a phase longer than this are flagged as "stuck". */
export const BOTTLENECK_THRESHOLDS: Record<PhaseNumber, number> = {
  1: 7,
  2: 7,
  3: 7,
  4: 7,
  5: 7,
}
