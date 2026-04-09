/**
 * Gate Review Verdict Schema: Zod validation for AI-generated gate verdicts.
 *
 * Defines the structured output contract for Claude CLI gate reviews.
 * The schema is used to:
 * 1. Instruct Claude on the expected JSON output format (in review-prompt.ts)
 * 2. Validate CLI output before storing as a verdict (T-06-01: safeParse)
 *
 * Security: All CLI output MUST pass safeParse before being stored.
 * Malformed output is rejected -- no partial data enters the system.
 */

import { z } from 'zod'

/**
 * Schema for a single checklist item verdict.
 * Each item from the gate checklist gets an independent pass/fail assessment.
 */
export const GateReviewVerdictItemSchema = z.object({
  checklist_id: z.string().min(1),
  label: z.string().min(1),
  verdict: z.enum(['pass', 'fail']),
  evidence: z.string(), // quote or reference from actual output
  notes: z.string(), // auditor explanation
})

/**
 * Schema for the complete gate review verdict.
 * Contains the overall assessment plus per-item breakdowns.
 */
export const GateReviewVerdictSchema = z.object({
  gate_number: z.number().int().min(1).max(4),
  overall: z.enum(['pass', 'fail', 'partial']),
  items: z.array(GateReviewVerdictItemSchema).min(1),
  summary: z.string().min(1), // overall assessment
})

export type GateReviewVerdict = z.infer<typeof GateReviewVerdictSchema>
export type GateReviewVerdictItem = z.infer<typeof GateReviewVerdictItemSchema>
