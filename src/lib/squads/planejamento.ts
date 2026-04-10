/**
 * Squad Planejamento: Prompt template for Phase 3 (processes 7-11).
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
const SQUAD_IDENTITY = `Squad Planejamento (Fase 3)
Agentes: Planejador G-STIC, Arquiteto de Canais, Especialista em Logistica
Trigger: Quality Gate 2 aprovado
Fluxo: Executa Processos 7-11, valida Quality Gate 3`

// Process numbers this squad handles
const VALID_PROCESSES = [7, 8, 9, 10, 11]

// Static output format descriptions derived from process Zod schemas
const OUTPUT_FORMATS: Record<number, string> = {
  7: `{
  "goal": {
    "focus": "string - Foco da meta",
    "quantitative_benchmark": "string - Benchmark quantitativo",
    "temporal_benchmark": "string - Benchmark temporal"
  },
  "strategy": {
    "client_value": "string - Proposicao de valor para o cliente",
    "company_value": "string - Proposicao de valor para a companhia",
    "partner_value": "string - Proposicao de valor para parceiros"
  },
  "tactics_7t": { "Produto": "string", "Servico": "string", "Marca": "string", "Preco": "string", "Incentivos": "string", "Comunicacao": "string", "Distribuicao": "string" },
  "implementation_timeline": "string - Cronograma de implementacao",
  "control_dashboard": "string - Dashboard de metricas de controle"
}`,
  8: `{
  "channels": [
    {
      "type": "direct | indirect | omnichannel",
      "description": "string - Descricao do canal"
    }
  ],
  "intermediaries": ["string - Intermediario selecionado e avaliado"],
  "conflict_management_plan": "string - Plano de gestao de conflitos de canal"
}`,
  9: `{
  "integrated_experience": "string - Experiencia integrada online + fisica",
  "assortment_and_service_level": "string - Sortimento e nivel de servico",
  "private_label_strategy": "string - Estrategia de marcas proprias"
}`,
  10: `{
  "order_to_payment_cycle": "string - Ciclo pedido-ate-pagamento otimizado",
  "storage_points": ["string - Ponto de armazenagem"],
  "inventory_management": "string - Gestao de estoque configurada",
  "transport_modes": ["string - Modo de transporte selecionado"]
}`,
  11: `{
  "cause_campaign": "string - Campanha de impacto social alinhada aos valores",
  "authenticity_validation": "string - Validacao de autenticidade (nao greenwashing)"
}`,
}

export function buildPrompt(context: AssembledContext, processNumber: number): string {
  if (!VALID_PROCESSES.includes(processNumber)) {
    throw new Error(`Process ${processNumber} is not handled by Squad Planejamento`)
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
You are an autonomous marketing planning agent executing within Agency OS.
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
1. Review the prior phase outputs above to understand the strategic foundation
2. Use WebSearch to research best practices, channel strategies, and implementation patterns for this client's niche
3. Build your plan grounded in the strategy outputs and real market data
4. Produce your final deliverable as a JSON object

=== DELIVERABLE FORMAT ===
After completing your research, your FINAL response must be a valid JSON object matching this structure:
${outputFormat}

CRITICAL: Base your plans on the prior phase outputs and REAL market data from your research. Your final message must be ONLY the JSON object.`
}
