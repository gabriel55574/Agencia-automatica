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

  let priorOutputsSection = 'Nenhum output anterior disponivel.'

  if (context.priorOutputFilePaths.length > 0 || context.priorOutputs.length > 0) {
    const parts: string[] = []

    if (context.priorOutputFilePaths.length > 0) {
      parts.push(
        'Leia os seguintes arquivos de contexto dos processos anteriores:\n' +
        context.priorOutputFilePaths.map(p => `@${p}`).join('\n')
      )
    }

    if (context.priorOutputs.length > 0) {
      parts.push(
        context.priorOutputs
          .map(o => `--- Process ${o.processNumber}: ${o.processName} ---\n${o.output}`)
          .join('\n\n')
      )
    }

    priorOutputsSection = parts.join('\n\n')
  }

  const feedbackSection = context.feedbackContext
    ? `Feedback Loop Data:\n${context.feedbackContext}`
    : ''

  // TMPL-03: Template reference content (if operator selected a template)
  const templateSection = context.templateContent
    ? `\n=== REFERENCE OUTPUT (TEMPLATE) ===\nThe following is a reference output from a previous successful run. Use it as a guide for structure and quality, adapting the content to the current client's context:\n${context.templateContent}\n`
    : ''

  return `=== YOUR ROLE ===
You are an autonomous CRM and retention agent executing within Agency OS.
${SQUAD_IDENTITY}

You have FULL ACCESS to tools: WebSearch, Read, Bash, and others.
You MUST use them to conduct real research — do NOT generate answers from memory alone.

=== AGENCY OS METHODOLOGY ===
Agency OS operates 16 processes across 5 sequential phases. Each phase is executed by a specialized Squad. No client advances without passing the corresponding Quality Gate.

=== CLIENT CONTEXT ===
Briefing:
${context.briefing}

Prior Phase Outputs:
${priorOutputsSection}

${feedbackSection}
${templateSection}
=== TASK ===
Execute: ${def.name} (Process #${processNumber}, Phase ${def.phase})

Required Inputs:
${def.inputs.map((i) => `- ${i}`).join('\n')}

Execution Steps — USE YOUR TOOLS for each step:
${def.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Output Checklist (ALL items must be addressed):
${def.checklist.map((c) => `- [ ] ${c}`).join('\n')}

=== INSTRUCTIONS ===
1. Review ALL prior phase outputs (strategy, planning, growth) to understand the complete client journey
2. Use WebSearch to research CRM best practices, retention strategies, and loyalty programs for this niche
3. Design retention and CLV strategies grounded in the client's actual funnel and real industry benchmarks
4. Produce your final deliverable as a JSON object

=== DELIVERABLE FORMAT ===
After completing your research, your FINAL response must be a valid JSON object matching this structure:
${outputFormat}

CRITICAL: Base your retention strategy on REAL industry benchmarks and prior phase outputs. Your final message must be ONLY the JSON object.`
}
