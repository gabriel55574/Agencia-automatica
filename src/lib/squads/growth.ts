/**
 * Squad Growth: Prompt template for Phase 4 (processes 12-15).
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
const SQUAD_IDENTITY = `Squad Growth (Fase 4)
Agentes: Diretor Criativo, Gestor de Midia, Growth Hacker (Bullseye), Closer de Vendas
Trigger: Quality Gate 3 aprovado
Fluxo: Executa Processos 12-15, valida Quality Gate 4`

// Process numbers this squad handles
const VALID_PROCESSES = [12, 13, 14, 15]

// Static output format descriptions derived from process Zod schemas
const OUTPUT_FORMATS: Record<number, string> = {
  12: `{
  "channel_copies": { "canal_name": "string - Copy para o canal" },
  "visual_creatives": ["string - Descricao do criativo visual"],
  "video_scripts": ["string - Roteiro de video/audio"],
  "landing_pages": ["string - Estrutura de landing page"],
  "positioning_consistency_check": "string - Validacao de consistencia com posicionamento Fase 2"
}`,
  13: `{
  "communication_mix": [
    {
      "channel": "string - Canal de comunicacao",
      "budget": "string - Orcamento alocado"
    }
  ],
  "horizontal_integration": "string - Validacao de integracao horizontal",
  "vertical_integration": "string - Validacao de integracao vertical",
  "editorial_calendar": "string - Calendario editorial configurado"
}`,
  14: `{
  "brainstorm_19_channels": ["string - Canal avaliado no brainstorm"],
  "tested_channels": [
    {
      "channel": "string - Canal testado",
      "result": "string - Resultado do teste"
    }
  ],
  "cac_by_channel": { "canal_name": "string - CAC medido" },
  "ltv_by_channel": { "canal_name": "string - LTV estimado" },
  "primary_channel": "string - Canal principal selecionado para foco total",
  "rule_50_applied": true
}`,
  15: `{
  "leads_classified": [
    {
      "category": "A | B | C",
      "count": 0,
      "description": "string - Descricao do grupo de leads"
    }
  ],
  "spin_script": "string - Script SPIN documentado",
  "objection_faqs": ["string - FAQ de contorno de objecoes"],
  "conversion_rate_by_stage": { "stage_name": "string - Taxa de conversao" },
  "onboarding_process": "string - Processo de onboarding pos-venda"
}`,
}

export function buildPrompt(context: AssembledContext, processNumber: number): string {
  if (!VALID_PROCESSES.includes(processNumber)) {
    throw new Error(`Process ${processNumber} is not handled by Squad Growth`)
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
You are an autonomous growth and traction agent executing within Agency OS.
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
1. Review the prior phase outputs (strategy + planning) to understand the foundation
2. Use WebSearch to research ad platforms, channel costs, creative benchmarks, and conversion data for this niche
3. Build growth tactics grounded in real market data and the client's positioning
4. Produce your final deliverable as a JSON object

=== DELIVERABLE FORMAT ===
After completing your research, your FINAL response must be a valid JSON object matching this structure:
${outputFormat}

CRITICAL: Base your growth plan on REAL data from your research and prior phase outputs. Your final message must be ONLY the JSON object.`
}
