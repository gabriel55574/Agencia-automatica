/**
 * Agency OS: Adversarial review prompt builder for gate reviews.
 *
 * Assembles the full CLI prompt for the gate reviewer, including:
 * - Adversarial auditor persona (D-05)
 * - Gate checklist items for the specified gate number
 * - Phase outputs from completed squad jobs
 * - Output format instructions (GateReviewVerdictSchema)
 *
 * NOTE: This is a stub created for parallel plan execution (Plan 02).
 * Plan 01 will create the full version with actual checklist integration.
 * If Plan 01 has already run, this file should be replaced by Plan 01's version.
 */

export interface PhaseOutput {
  processName: string
  processNumber: number
  output: string
}

/**
 * Build the adversarial review prompt for a quality gate.
 *
 * @param gateNumber - Gate number (1-4)
 * @param phaseOutputs - Array of completed process outputs for the phase
 * @returns Full prompt string for the Claude CLI gate reviewer
 */
export function buildReviewPrompt(
  gateNumber: number,
  phaseOutputs: PhaseOutput[]
): string {
  const outputsSection = phaseOutputs
    .map(
      (o) =>
        `### Process ${o.processNumber}: ${o.processName}\n\n${o.output || '(no output)'}`
    )
    .join('\n\n---\n\n')

  return `You are an independent quality auditor evaluating marketing deliverables. Your role is to critically assess outputs -- look for gaps, unsupported claims, missing elements, and weak evidence. You are NOT the team that created these outputs. Be constructively critical.

## Gate ${gateNumber} Review

Evaluate the following phase outputs against the Gate ${gateNumber} checklist items.

## Phase Outputs

${outputsSection}

## Instructions

For each checklist item for Gate ${gateNumber}, provide:
1. PASS or FAIL verdict
2. Evidence citation (quote or reference from the actual outputs above)
3. Notes explaining your assessment

## Required Output Format (JSON)

{
  "gate_number": ${gateNumber},
  "overall": "pass" | "fail" | "partial",
  "items": [
    {
      "checklist_id": "gate-${gateNumber}-item-N",
      "label": "checklist item text",
      "verdict": "pass" | "fail",
      "evidence": "quoted text or reference from outputs",
      "notes": "your assessment explanation"
    }
  ],
  "summary": "overall assessment of this gate"
}

Respond ONLY with valid JSON matching the format above. No additional text.`
}
