/**
 * Agency OS: Gate Review Verdict Zod schema.
 *
 * Defines the expected structured output from the adversarial gate reviewer.
 * Used by:
 * - Worker (job-runner.ts) to validate CLI output for gate_review jobs
 * - UI (gate-review-display.tsx) to type the verdict for rendering
 *
 * NOTE: This is a stub created for parallel plan execution (Plan 02).
 * Plan 01 will create the full version. If Plan 01 has already run,
 * this file should be replaced by Plan 01's version.
 */

import { z } from 'zod'

export const GateReviewVerdictSchema = z.object({
  gate_number: z.number().int().min(1).max(4),
  overall: z.enum(['pass', 'fail', 'partial']),
  items: z.array(
    z.object({
      checklist_id: z.string(),
      label: z.string(),
      verdict: z.enum(['pass', 'fail']),
      evidence: z.string(),
      notes: z.string(),
    })
  ),
  summary: z.string(),
})

export type GateReviewVerdict = z.infer<typeof GateReviewVerdictSchema>
