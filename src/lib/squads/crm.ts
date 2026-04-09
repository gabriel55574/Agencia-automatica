/**
 * Squad CRM: Prompt template for Phase 5 (process 16).
 *
 * Builds a complete prompt string for Claude CLI execution, including:
 * - Squad identity (verbatim from docs/agency-os-prompt.md)
 * - Agency OS methodology context
 * - Client briefing + prior phase outputs
 * - Process-specific instructions (inputs, steps, checklist)
 * - Output format matching the process Zod schema fields
 */

import { PROCESS_DEFINITIONS } from '@/lib/pipeline/processes'
import type { AssembledContext } from './assembler'

// Squad identity text -- VERBATIM from docs/agency-os-prompt.md
// "COMO OS SQUADS CLAUDE OPERAM" section
const SQUAD_IDENTITY = `Squad CRM (Fase 5)
Agentes: Analista de CLV, Gestor de Retencao, Especialista em Automacao
Trigger: Quality Gate 4 aprovado
Fluxo: Executa Processo 16, gera Feedback Loop para Fase 1`

// Process numbers this squad handles
const VALID_PROCESSES = [16]

// Static output format descriptions derived from process Zod schemas
const OUTPUT_FORMATS: Record<number, string> = {
  16: `{
  "clv_by_segment": { "segment_name": "string - CLV calculado para o segmento" },
  "nps_analysis": {
    "promoters": "string - Analise dos promotores",
    "detractors": "string - Analise dos detratores",
    "passives": "string - Analise dos passivos"
  },
  "email_automations": ["string - Automacao de email ativa"],
  "loyalty_program": "string - Programa de fidelidade operando",
  "retention_vs_acquisition": "string - Taxa de retencao vs taxa de aquisicao em custo",
  "referral_program": "string - Programa de referrals de clientes promotores"
}`,
}

export function buildPrompt(context: AssembledContext, processNumber: number): string {
  if (!VALID_PROCESSES.includes(processNumber)) {
    throw new Error(`Process ${processNumber} is not handled by Squad CRM`)
  }

  const def = PROCESS_DEFINITIONS[processNumber]
  const outputFormat = OUTPUT_FORMATS[processNumber]

  const priorOutputsSection = context.priorOutputs.length > 0
    ? context.priorOutputs
        .map(
          (o) =>
            `--- Process ${o.processNumber}: ${o.processName} ---\n${o.output}`
        )
        .join('\n\n')
    : 'Nenhum output anterior disponivel.'

  const feedbackSection = context.feedbackContext
    ? `Feedback Loop Data:\n${context.feedbackContext}`
    : ''

  // TMPL-03: Template reference content (if operator selected a template)
  const templateSection = context.templateContent
    ? `\n=== REFERENCE OUTPUT (TEMPLATE) ===\nThe following is a reference output from a previous successful run. Use it as a guide for structure and quality, adapting the content to the current client's context:\n${context.templateContent}\n`
    : ''

  return `=== SQUAD IDENTITY ===
${SQUAD_IDENTITY}

=== AGENCY OS METHODOLOGY ===
Voce opera dentro do Agency OS, um sistema de 16 processos distribuidos em 5 fases sequenciais. Cada fase e executada por um Squad especializado. Nenhum cliente avanca de fase sem passar pelo Quality Gate correspondente.

=== CLIENT CONTEXT ===
Briefing:
${context.briefing}

Prior Phase Outputs:
${priorOutputsSection}

${feedbackSection}
${templateSection}
=== PROCESS INSTRUCTIONS ===
Process: ${def.name} (Process #${processNumber})
Phase: ${def.phase}

Required Inputs:
${def.inputs.map((i) => `- ${i}`).join('\n')}

Execution Steps:
${def.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Output Checklist (ALL items must be addressed):
${def.checklist.map((c) => `- [ ] ${c}`).join('\n')}

=== OUTPUT FORMAT ===
Respond with a single JSON object matching this exact structure:
${outputFormat}

IMPORTANT: Your response must be valid JSON. Do not include markdown code fences.
Do not include any text before or after the JSON object.`
}
