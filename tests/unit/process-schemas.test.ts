/**
 * Unit tests for all 16 process Zod schemas and the schema dispatcher.
 *
 * Each process has:
 *   - A positive test (valid data returns success=true)
 *   - A negative test (invalid/missing data returns success=false)
 *
 * The dispatcher getProcessSchema(N) is also tested.
 */

import { describe, it, expect } from 'vitest'
import { getProcessSchema } from '../../src/lib/squads/schemas/index'
import { process01Schema } from '../../src/lib/squads/schemas/process-01'
import { process02Schema } from '../../src/lib/squads/schemas/process-02'
import { process03Schema } from '../../src/lib/squads/schemas/process-03'
import { process04Schema } from '../../src/lib/squads/schemas/process-04'
import { process05Schema } from '../../src/lib/squads/schemas/process-05'
import { process06Schema } from '../../src/lib/squads/schemas/process-06'
import { process07Schema } from '../../src/lib/squads/schemas/process-07'
import { process08Schema } from '../../src/lib/squads/schemas/process-08'
import { process09Schema } from '../../src/lib/squads/schemas/process-09'
import { process10Schema } from '../../src/lib/squads/schemas/process-10'
import { process11Schema } from '../../src/lib/squads/schemas/process-11'
import { process12Schema } from '../../src/lib/squads/schemas/process-12'
import { process13Schema } from '../../src/lib/squads/schemas/process-13'
import { process14Schema } from '../../src/lib/squads/schemas/process-14'
import { process15Schema } from '../../src/lib/squads/schemas/process-15'
import { process16Schema } from '../../src/lib/squads/schemas/process-16'

// ============================================================
// Schema Dispatcher
// ============================================================

describe('getProcessSchema', () => {
  it('returns the correct schema for process 1', () => {
    const schema = getProcessSchema(1)
    expect(schema).toBe(process01Schema)
  })

  it('returns the correct schema for process 16', () => {
    const schema = getProcessSchema(16)
    expect(schema).toBe(process16Schema)
  })

  it('returns null for invalid process number 0', () => {
    expect(getProcessSchema(0)).toBeNull()
  })

  it('returns null for invalid process number 99', () => {
    expect(getProcessSchema(99)).toBeNull()
  })

  it('returns null for negative process number', () => {
    expect(getProcessSchema(-1)).toBeNull()
  })
})

// ============================================================
// Process 01: Pesquisa de Mercado
// ============================================================

describe('process01Schema', () => {
  const validData = {
    problem_definition: 'Entender mercado de SaaS B2B no Brasil',
    data_sources: ['IBGE', 'Statista', 'entrevistas diretas'],
    competitive_analysis: {
      clientes: 'PMEs com 10-50 funcionarios',
      colaboradores: 'Equipe de vendas e suporte',
      companhia: 'Startup com 2 anos de mercado',
      concorrentes: 'RD Station, HubSpot',
      contexto: 'Mercado em expansao pos-pandemia',
    },
    actionable_insights: ['Foco em nicho de agencias', 'Preco abaixo de R$200/mes'],
  }

  it('accepts valid process 01 data', () => {
    const result = process01Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing required fields', () => {
    const result = process01Schema.safeParse({ wrong_field: 'x' })
    expect(result.success).toBe(false)
  })

  it('rejects data with wrong competitive_analysis shape', () => {
    const result = process01Schema.safeParse({
      ...validData,
      competitive_analysis: 'not an object',
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 02: Segmentacao
// ============================================================

describe('process02Schema', () => {
  const validData = {
    segments: [
      {
        name: 'PMEs de tecnologia',
        variables: 'B2B, 10-50 funcionarios, receita >R$500k',
        attractiveness: 'Alto potencial de crescimento',
        compatibility: 'Forte alinhamento com produto',
      },
    ],
    personas: [
      {
        name: 'Carlos, o CTO',
        pains: 'Falta de integracao entre ferramentas',
        desires: 'Plataforma unica para gestao',
        behaviors: 'Pesquisa online, assina newsletters tech',
      },
    ],
    cost_to_serve_validated: true,
  }

  it('accepts valid process 02 data', () => {
    const result = process02Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing segments', () => {
    const result = process02Schema.safeParse({ personas: [], cost_to_serve_validated: true })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 03: Posicionamento
// ============================================================

describe('process03Schema', () => {
  const validData = {
    competitive_alternatives: ['Planilhas Excel', 'Consultores freelance'],
    unique_attributes: ['Automacao com IA', 'Metodologia proprietaria'],
    value_proposition: 'Gestao de agencia 10x mais eficiente com IA',
    market_category: 'Software de gestao para agencias',
    strategic_name: 'Agency OS',
  }

  it('accepts valid process 03 data', () => {
    const result = process03Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with wrong types', () => {
    const result = process03Schema.safeParse({
      ...validData,
      competitive_alternatives: 'not an array',
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 04: Grand Slam Offers
// ============================================================

describe('process04Schema', () => {
  const validData = {
    dream_outcome: 'Gerenciar 15+ clientes sozinho com qualidade de agencia',
    obstacles_and_solutions: [
      { obstacle: 'Tempo limitado', solution: 'Automacao com squads de IA' },
    ],
    final_stack_items: ['Dashboard de pipeline', 'Execucao automatizada', 'Relatorios PDF'],
    value_equation_validated: true,
  }

  it('accepts valid process 04 data', () => {
    const result = process04Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing dream_outcome', () => {
    const result = process04Schema.safeParse({ obstacles_and_solutions: [] })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 05: Pricing
// ============================================================

describe('process05Schema', () => {
  const validData = {
    pricing_method: 'Valor percebido',
    final_price: 'R$197/mes',
    bonuses: ['Template de processos', 'Consultoria inicial 1h'],
    scarcity_triggers: ['Apenas 20 vagas no lancamento'],
    guarantee: '30 dias ou dinheiro de volta',
    offer_name_magic: 'Agency OS Pro Launch Pack',
  }

  it('accepts valid process 05 data', () => {
    const result = process05Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing guarantee', () => {
    const result = process05Schema.safeParse({
      pricing_method: 'test',
      final_price: '100',
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 06: Branding
// ============================================================

describe('process06Schema', () => {
  const validData = {
    brand_mantra: 'Agencia inteligente automatizada',
    visual_elements: ['Logo minimalista', 'Paleta azul/branco'],
    secondary_associations: ['Tecnologia de ponta', 'Parceria com Anthropic'],
    points_of_difference: ['Automacao com Claude Code CLI'],
    points_of_parity: ['Interface amigavel', 'Suporte dedicado'],
  }

  it('accepts valid process 06 data', () => {
    const result = process06Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing brand_mantra', () => {
    const result = process06Schema.safeParse({ visual_elements: [] })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 07: G-STIC
// ============================================================

describe('process07Schema', () => {
  const validData = {
    goal: {
      focus: 'Crescer base de clientes',
      quantitative_benchmark: '100 clientes ativos em 12 meses',
      temporal_benchmark: 'Dezembro 2026',
    },
    strategy: {
      client_value: 'Reducao de 80% no tempo de gestao',
      company_value: 'Receita recorrente R$20k/mes',
      partner_value: 'Comissao de indicacao 10%',
    },
    tactics_7t: {
      produto: 'Plataforma SaaS',
      servico: 'Suporte via chat',
      marca: 'Agency OS',
      preco: 'R$197/mes',
      incentivos: 'Desconto anual 20%',
      comunicacao: 'Content marketing + ads',
      distribuicao: 'Online direto',
    },
    implementation_timeline: 'Q1-Q4 2026 faseado por canal',
    control_dashboard: 'KPIs: MRR, churn, NPS, CAC, LTV',
  }

  it('accepts valid process 07 data', () => {
    const result = process07Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing goal', () => {
    const result = process07Schema.safeParse({ strategy: {} })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 08: Canais
// ============================================================

describe('process08Schema', () => {
  const validData = {
    channels: [
      { type: 'direct' as const, description: 'Venda direta via site' },
      { type: 'indirect' as const, description: 'Parceiros revendedores' },
    ],
    intermediaries: ['Agencias parceiras', 'Consultores independentes'],
    conflict_management_plan: 'Territorios definidos por regiao',
  }

  it('accepts valid process 08 data', () => {
    const result = process08Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with invalid channel type', () => {
    const result = process08Schema.safeParse({
      ...validData,
      channels: [{ type: 'invalid', description: 'test' }],
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 09: Varejo/Omnichannel
// ============================================================

describe('process09Schema', () => {
  const validData = {
    integrated_experience: 'Experiencia 100% digital com suporte humano',
    assortment_and_service_level: 'Plano unico com add-ons opcionais',
    private_label_strategy: 'Nao aplicavel (SaaS)',
  }

  it('accepts valid process 09 data', () => {
    const result = process09Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing fields', () => {
    const result = process09Schema.safeParse({ integrated_experience: 'test' })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 10: Logistica
// ============================================================

describe('process10Schema', () => {
  const validData = {
    order_to_payment_cycle: 'Pagamento instantaneo via Stripe',
    storage_points: ['AWS S3 para documentos', 'Supabase Storage para entregas'],
    inventory_management: 'Nao aplicavel (servico digital)',
    transport_modes: ['Entrega digital instantanea'],
  }

  it('accepts valid process 10 data', () => {
    const result = process10Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing storage_points', () => {
    const result = process10Schema.safeParse({
      order_to_payment_cycle: 'test',
      inventory_management: 'test',
      transport_modes: [],
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 11: Marketing de Causa
// ============================================================

describe('process11Schema', () => {
  const validData = {
    cause_campaign: 'Apoio a capacitacao digital de microempreendedores',
    authenticity_validation: 'Parceria com ONG de empreendedorismo local',
  }

  it('accepts valid process 11 data', () => {
    const result = process11Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing cause_campaign', () => {
    const result = process11Schema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 12: Producao Criativa
// ============================================================

describe('process12Schema', () => {
  const validData = {
    channel_copies: {
      instagram: 'Copy para Instagram',
      linkedin: 'Copy para LinkedIn',
      email: 'Copy para email marketing',
    },
    visual_creatives: ['Banner hero', 'Carrossel de features'],
    video_scripts: ['Video de apresentacao 60s'],
    landing_pages: ['pagina-principal', 'pagina-de-vendas'],
    positioning_consistency_check: 'Todos alinhados com posicionamento da Fase 2',
  }

  it('accepts valid process 12 data', () => {
    const result = process12Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing channel_copies', () => {
    const result = process12Schema.safeParse({
      visual_creatives: [],
      video_scripts: [],
      landing_pages: [],
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 13: IMC
// ============================================================

describe('process13Schema', () => {
  const validData = {
    communication_mix: [
      { channel: 'Google Ads', budget: 'R$3.000/mes' },
      { channel: 'Instagram Ads', budget: 'R$2.000/mes' },
    ],
    horizontal_integration: 'Mesma mensagem em todos os pontos de contato',
    vertical_integration: 'Comunicacao alinhada com G-STIC',
    editorial_calendar: 'Calendario semanal com 3 posts + 2 emails',
  }

  it('accepts valid process 13 data', () => {
    const result = process13Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing communication_mix', () => {
    const result = process13Schema.safeParse({ horizontal_integration: 'test' })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 14: Bullseye
// ============================================================

describe('process14Schema', () => {
  const validData = {
    brainstorm_19_channels: [
      'SEO', 'SEM', 'Social Ads', 'Content Marketing', 'Email',
      'PR', 'Engineering as Marketing', 'Blogs', 'Communities',
      'Events', 'Speaking', 'Trade Shows', 'Offline Ads',
      'Sales', 'Affiliates', 'Existing Platforms',
      'Business Development', 'Viral Marketing', 'Other',
    ],
    tested_channels: [
      { channel: 'Content Marketing', result: 'CAC R$50, 20 leads/mes' },
      { channel: 'Google Ads', result: 'CAC R$80, 15 leads/mes' },
    ],
    cac_by_channel: { content_marketing: 'R$50', google_ads: 'R$80' },
    ltv_by_channel: { content_marketing: 'R$2.000', google_ads: 'R$1.500' },
    primary_channel: 'Content Marketing',
    rule_50_applied: true,
  }

  it('accepts valid process 14 data', () => {
    const result = process14Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing brainstorm_19_channels', () => {
    const result = process14Schema.safeParse({ primary_channel: 'test' })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 15: Funil de Vendas
// ============================================================

describe('process15Schema', () => {
  const validData = {
    leads_classified: [
      { category: 'A' as const, count: 10, description: 'Fecham em <3 meses' },
      { category: 'B' as const, count: 25, description: '3-12 meses' },
      { category: 'C' as const, count: 50, description: 'Marketing passivo' },
    ],
    spin_script: 'Situacao -> Problema -> Implicacao -> Need-Payoff script completo',
    objection_faqs: ['Preco alto -> mostrar ROI', 'Nao preciso -> case studies'],
    conversion_rate_by_stage: { lead: '100%', qualificado: '40%', proposta: '25%', fechamento: '15%' },
    onboarding_process: 'Kickoff call -> configuracao -> primeiro squad em 48h',
  }

  it('accepts valid process 15 data', () => {
    const result = process15Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with invalid lead category', () => {
    const result = process15Schema.safeParse({
      ...validData,
      leads_classified: [{ category: 'X', count: 10, description: 'invalid' }],
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Process 16: CRM
// ============================================================

describe('process16Schema', () => {
  const validData = {
    clv_by_segment: { premium: 'R$5.000', standard: 'R$2.000' },
    nps_analysis: {
      promoters: '60% - muito satisfeitos',
      detractors: '10% - problemas de onboarding',
      passives: '30% - neutros',
    },
    email_automations: ['Onboarding 7 dias', 'Reengajamento 30 dias', 'Upsell trimestral'],
    loyalty_program: 'Pontos por indicacao + desconto progressivo',
    retention_vs_acquisition: 'Retencao 3x mais barata que aquisicao',
    referral_program: 'Indicou e ganhou 1 mes gratis',
  }

  it('accepts valid process 16 data', () => {
    const result = process16Schema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects data with missing clv_by_segment', () => {
    const result = process16Schema.safeParse({ loyalty_program: 'test' })
    expect(result.success).toBe(false)
  })
})
