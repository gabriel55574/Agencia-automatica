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
