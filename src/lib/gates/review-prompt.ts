/**
 * Adversarial Gate Review Prompt Builder.
 *
 * Generates the prompt for Claude CLI to perform an independent quality gate review.
 * The reviewer persona is deliberately adversarial -- distinct from the generation
 * squads that created the outputs being evaluated.
 *
 * Architecture (D-05, D-06):
 * - Adversarial auditor identity: critically evaluates, not rubber-stamps
 * - Gate checklist items embedded for systematic evaluation
 * - Phase outputs included as evidence base
 * - Structured JSON output format matching GateReviewVerdictSchema
 *
 * Security (T-06-03): Adversarial persona is a static string, not user-controllable.
 * Checklist items are static data from gate-N-checklist.ts files.
 */

import { getGateChecklist } from './index'

// ============================================================
// Types
// ============================================================

export type PhaseOutput = {
  processName: string
  processNumber: number
  output: string
}

// ============================================================
// Static prompt sections
// ============================================================

const AUDITOR_IDENTITY = `You are an independent quality auditor evaluating marketing deliverables. Your role is to critically assess outputs -- look for gaps, unsupported claims, missing elements, and weak evidence. You are NOT the team that created these outputs. Be constructively critical. Do not rubber-stamp -- your job is to find problems before they reach the client.`

const OUTPUT_FORMAT_INSTRUCTIONS = `Respond with ONLY a valid JSON object matching this exact structure:
{
  "gate_number": <number 1-4>,
  "overall": "<pass|fail|partial>",
  "items": [
    {
      "checklist_id": "<string - the checklist item id, e.g. gate-1-item-1>",
      "label": "<string - the checklist item label>",
      "verdict": "<pass|fail>",
      "evidence": "<string - quote or reference from the phase outputs that supports this verdict>",
      "notes": "<string - your explanation of why this item passes or fails>"
    }
  ],
  "summary": "<string - overall assessment of the gate review>"
}

Rules:
- "overall" is "pass" only if ALL items pass. "fail" if majority fail. "partial" if some pass and some fail.
- Each checklist item MUST have a corresponding entry in the "items" array.
- "evidence" MUST cite specific text from the phase outputs. If no evidence exists, state that explicitly.
- Your response must be valid JSON. Do not include markdown code fences or any text outside the JSON object.`

const EVALUATION_INSTRUCTIONS = `For each checklist item:
1. Evaluate whether the phase outputs satisfy this requirement.
2. Cite specific text from the outputs as evidence.
3. If an item cannot be verified from the outputs, mark it as FAIL with an explanation in notes.
4. Be rigorous -- vague or unsupported claims should not pass.`

// ============================================================
// Main function
// ============================================================

/**
 * Builds the adversarial review prompt for a quality gate evaluation.
 *
 * @param gateNumber - The gate number (1-4)
 * @param phaseOutputs - Array of phase outputs to evaluate
 * @returns The complete prompt string for Claude CLI
 * @throws Error if gateNumber is invalid (no checklist found)
 */
export function buildReviewPrompt(
  gateNumber: number,
  phaseOutputs: PhaseOutput[]
): string {
  const checklist = getGateChecklist(gateNumber)

  if (!checklist) {
    throw new Error(`No checklist found for gate ${gateNumber}`)
  }

  // Format checklist items as numbered list
  const checklistSection = checklist.items
    .map(
      (item, idx) =>
        `${idx + 1}. [${item.id}] ${item.label}\n   Description: ${item.description}`
    )
    .join('\n')

  // Format phase outputs as labeled sections
  const outputsSection =
    phaseOutputs.length > 0
      ? phaseOutputs
          .map(
            (o) =>
              `=== Process ${o.processNumber}: ${o.processName} ===\n${o.output}`
          )
          .join('\n\n')
      : 'No phase outputs available for evaluation.'

  return `=== AUDITOR IDENTITY ===
${AUDITOR_IDENTITY}

=== GATE REVIEW ===
Gate ${checklist.gateNumber}: ${checklist.gateName}

=== CHECKLIST ITEMS ===
${checklistSection}

=== PHASE OUTPUTS TO EVALUATE ===
${outputsSection}

=== OUTPUT FORMAT ===
${OUTPUT_FORMAT_INSTRUCTIONS}

=== EVALUATION INSTRUCTIONS ===
${EVALUATION_INSTRUCTIONS}`
}
