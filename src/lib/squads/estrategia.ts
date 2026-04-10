/**
 * Squad Estrategia: Prompt template for Phases 1-2 (processes 1-6).
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
const SQUAD_IDENTITY = `Squad Estrategia (Fases 1 e 2)
Agentes: Pesquisador de Mercado, Analista de Segmentacao, Especialista em Posicionamento, Arquiteto de Ofertas
Trigger: Novo cliente entra no pipeline
Fluxo: Executa Processos 1-6 sequencialmente, valida Quality Gates 1 e 2`

// Process numbers this squad handles
const VALID_PROCESSES = [1, 2, 3, 4, 5, 6]

// Static output format descriptions derived from process Zod schemas
const OUTPUT_FORMATS: Record<number, string> = {
  1: `{
  "problem_definition": "string - Problema/oportunidade claramente definido",
  "data_sources": ["string - Fonte de dado primario ou secundario"],
  "competitive_analysis": {
    "clientes": "string - Analise dos clientes",
    "colaboradores": "string - Analise dos colaboradores",
    "companhia": "string - Analise da companhia",
    "concorrentes": "string - Analise dos concorrentes",
    "contexto": "string - Analise do contexto"
  },
  "actionable_insights": ["string - Insight acionavel para decisao de negocio"]
}`,
  2: `{
  "segments": [
    {
      "name": "string - Nome do segmento",
      "variables": "string - Variaveis de segmentacao",
      "attractiveness": "string - Teste de atratividade",
      "compatibility": "string - Teste de compatibilidade"
    }
  ],
  "personas": [
    {
      "name": "string - Nome da persona",
      "pains": "string - Dores",
      "desires": "string - Desejos",
      "behaviors": "string - Comportamentos"
    }
  ],
  "cost_to_serve_validated": true
}`,
  3: `{
  "competitive_alternatives": ["string - Alternativa competitiva real"],
  "unique_attributes": ["string - Atributo unico factual"],
  "value_proposition": "string - Proposta de valor conectada a beneficios reais",
  "market_category": "string - Categoria de mercado",
  "strategic_name": "string - Nome estrategico validado"
}`,
  4: `{
  "dream_outcome": "string - Resultado dos sonhos do consumidor",
  "obstacles_and_solutions": [
    {
      "obstacle": "string - Obstaculo que impede o sonho",
      "solution": "string - Solucao para o obstaculo"
    }
  ],
  "final_stack_items": ["string - Item de alto valor / baixo custo na pilha final"],
  "value_equation_validated": true
}`,
  5: `{
  "pricing_method": "string - Metodo de precificacao selecionado",
  "final_price": "string - Preco final definido",
  "bonuses": ["string - Bonus adicionado"],
  "scarcity_triggers": ["string - Gatilho de escassez ou urgencia"],
  "guarantee": "string - Garantia de reversao de risco",
  "offer_name_magic": "string - Nome da oferta com formula M-A-G-I-C"
}`,
  6: `{
  "brand_mantra": "string - Mantra da marca (3-5 palavras)",
  "visual_elements": ["string - Elemento visual"],
  "secondary_associations": ["string - Associacao secundaria"],
  "points_of_difference": ["string - Ponto de diferenca"],
  "points_of_parity": ["string - Ponto de paridade"]
}`,
}

export function buildPrompt(context: AssembledContext, processNumber: number): string {
  if (!VALID_PROCESSES.includes(processNumber)) {
    throw new Error(`Process ${processNumber} is not handled by Squad Estrategia`)
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
You are an autonomous marketing research agent executing within Agency OS.
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
1. Use WebSearch to research the client's market, competitors, and audience based on the briefing
2. Use WebSearch to find real data, trends, and insights specific to this niche and location
3. Analyze your findings against the execution steps and checklist above
4. Produce your final deliverable as a JSON object

=== DELIVERABLE FORMAT ===
After completing your research, your FINAL response must be a valid JSON object matching this structure:
${outputFormat}

CRITICAL: Base your analysis on REAL data from your research. Do not fabricate companies, statistics, or market data. Your final message must be ONLY the JSON object.`
}
