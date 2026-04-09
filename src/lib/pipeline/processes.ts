/**
 * Agency OS: Static process definitions for all 16 marketing processes.
 *
 * These definitions are the source of truth for what the operator sees when
 * they expand a process row in the pipeline view. They are derived from
 * docs/agency-os-prompt.md and must align with PROCESS_TO_PHASE and
 * PROCESS_TO_SQUAD in src/lib/database/enums.ts.
 *
 * Phase/squad alignment:
 *   Phase 1 (Diagnostico):         processes 1-2   — squad: estrategia
 *   Phase 2 (Engenharia de Valor): processes 3-6   — squad: estrategia
 *   Phase 3 (Go-to-Market):        processes 7-11  — squad: planejamento
 *   Phase 4 (Tracao e Vendas):     processes 12-15 — squad: growth
 *   Phase 5 (Retencao e Escala):   process 16      — squad: crm
 */

export type ProcessDefinition = {
  name: string
  phase: 1 | 2 | 3 | 4 | 5
  squad: 'estrategia' | 'planejamento' | 'growth' | 'crm'
  inputs: string[]
  steps: string[]
  checklist: string[]
}

export const PROCESS_DEFINITIONS: Record<number, ProcessDefinition> = {
  // ============================================================
  // PHASE 1: DIAGNOSTICO — Squad Estrategia
  // ============================================================

  1: {
    name: 'Pesquisa de Mercado e Insights',
    phase: 1,
    squad: 'estrategia',
    inputs: [
      'Briefing inicial do cliente (problema/objetivo, dados brutos disponiveis)',
    ],
    steps: [
      'Definir o problema de marketing especifico',
      'Desenvolver plano de pesquisa (fontes primarias/secundarias)',
      'Coletar informacoes (pesquisa observacional, grupos focais, behavioral)',
      'Analisar e extrair insights acionaveis',
    ],
    checklist: [
      'Problema/oportunidade claramente definido',
      'Fontes de dados mapeadas (primarios e secundarios)',
      'Analise competitiva (5 Cs: Clientes, Colaboradores, Companhia, Concorrentes, Contexto)',
      'Insights acionaveis para decisao de negocio',
    ],
  },

  2: {
    name: 'Segmentacao, Targeting e Personas',
    phase: 1,
    squad: 'estrategia',
    inputs: [
      'Relatorio de Insights do Processo 1',
    ],
    steps: [
      'Segmentar mercado (demografico, geografico, psicografico, comportamental)',
      'Avaliar atratividade de cada segmento (potencial de lucro)',
      'Avaliar compatibilidade (capacidade de criar valor superior)',
      'Criar perfil tatico (personas)',
    ],
    checklist: [
      'Segmentos identificados com variaveis claras',
      'Teste de atratividade aprovado (potencial financeiro)',
      'Teste de compatibilidade aprovado (capacidade de atender)',
      'Personas detalhadas com dores, desejos e comportamentos',
      'Custo para servir < receita esperada',
    ],
  },

  // ============================================================
  // PHASE 2: ENGENHARIA DE VALOR — Squad Estrategia
  // ============================================================

  3: {
    name: 'Posicionamento',
    phase: 2,
    squad: 'estrategia',
    inputs: [
      'Documento de Segmentacao e Personas da Fase 1',
    ],
    steps: [
      // Dunford 10 Steps
      'Entender clientes que amam o produto',
      'Formar equipe de posicionamento',
      'Alinhar vocabulario e desapegar da bagagem',
      'Listar alternativas competitivas REAIS (o que cliente faria sem voce?)',
      'Isolar atributos/recursos UNICOS (factuais, nao subjetivos)',
      'Mapear atributos em temas de valor',
      'Determinar quem se importa MUITO',
      'Encontrar quadro de referencia de mercado',
      'Adicionar tendencia relevante (opcional)',
      'Capturar e compartilhar documento',
      // Complemento Ries/Trout
      'Mapear mente do prospecto (diferencial semantico)',
      'Encontrar/criar "buraco" (posicao vazia)',
      'Definir nome estrategico',
      'Manter consistencia (evitar F.W.M.T.S.)',
    ],
    checklist: [
      'Alternativas competitivas mapeadas',
      'Atributos unicos FACTUAIS (nao subjetivos)',
      'Proposta de valor conectada a beneficios reais',
      'Categoria de mercado que torna pontos fortes obvios',
      'Nome estrategico validado',
    ],
  },

  4: {
    name: 'Grand Slam Offers',
    phase: 2,
    squad: 'estrategia',
    inputs: [
      'Documento de Posicionamento + mapa de desejos do cliente',
    ],
    steps: [
      'Identificar resultado dos sonhos do consumidor',
      'Listar TODOS os problemas/obstaculos que impedem o sonho',
      'Transformar cada obstaculo em uma solucao',
      'Criar veiculos de entrega (pensamento divergente)',
      'Cortar e Empilhar (Trim & Stack): alto valor + baixo custo permanecem',
      'Aprimorar com escassez, urgencia, bonus e garantias',
    ],
    checklist: [
      'Resultado dos sonhos claramente articulado',
      'Obstaculos mapeados e transformados em solucoes',
      'Apenas itens de alto valor / baixo custo na pilha final',
      'Value Equation validada: maximiza (Sonho + Probabilidade) / minimiza (Tempo + Esforco)',
    ],
  },

  5: {
    name: 'Pricing',
    phase: 2,
    squad: 'estrategia',
    inputs: [
      'Pilha de Ofertas + custos estimados',
    ],
    steps: [
      'Selecionar objetivo (lucro, penetracao, skimming, lideranca)',
      'Estimar demanda e elasticidade',
      'Estimar custos fixos/variaveis',
      'Analisar precos da concorrencia',
      'Selecionar metodo (markup, valor economico, competitivo)',
      'Definir preco final com psicologia (referencia, bonus, garantias)',
      'Aplicar formula M-A-G-I-C para nomear a oferta',
    ],
    checklist: [
      'Preco baseado em valor, nao em custo',
      'Bonus adicionados (nao descontos no principal)',
      'Gatilhos de escassez e urgencia definidos',
      'Garantia de reversao de risco incluida',
      'Nome da oferta com formula M-A-G-I-C',
    ],
  },

  6: {
    name: 'Branding Estrategico',
    phase: 2,
    squad: 'estrategia',
    inputs: [
      'Documento de Posicionamento + Oferta validada',
    ],
    steps: [
      'Definir mantra da marca (3-5 palavras)',
      'Escolher elementos (logo, simbolos, embalagem)',
      'Construir associacoes secundarias (paises, parceiros, celebridades)',
      'Definir arquitetura do portfolio de marca',
    ],
    checklist: [
      'Mantra da marca definido',
      'Elementos visuais desenhados',
      'Associacoes secundarias mapeadas',
      'Pontos de Diferenca e Paridade identificados',
    ],
  },

  // ============================================================
  // PHASE 3: GO-TO-MARKET — Squad Planejamento
  // ============================================================

  7: {
    name: 'Planejamento G-STIC',
    phase: 3,
    squad: 'planejamento',
    inputs: [
      'Estrategia completa das Fases 1 e 2',
    ],
    steps: [
      'Goal: Definir foco + benchmark quantitativo + benchmark temporal',
      'Strategy: Validar proposicao de valor para cliente, companhia e colaboradores',
      'Tactics: Projetar os 7 Ts (Produto, Servico, Marca, Preco, Incentivos, Comunicacao, Distribuicao)',
      'Implementation: Assegurar recursos, cronograma, responsaveis',
      'Control: Definir KPIs, metricas e frequencia de revisao',
    ],
    checklist: [
      'Meta com foco + quanto + quando',
      'Proposicao de valor para 3 entidades (cliente/empresa/parceiros)',
      '7 Ts detalhados',
      'Cronograma de implementacao',
      'Dashboard de metricas de controle',
    ],
  },

  8: {
    name: 'Design de Canais de Distribuicao',
    phase: 3,
    squad: 'planejamento',
    inputs: [
      'Plano G-STIC (componente Distribuicao)',
    ],
    steps: [
      'Mapear opcoes de canais diretos, indiretos e omnichannel',
      'Selecionar e avaliar intermediarios',
      'Desenvolver plano de gestao de conflitos de canal',
    ],
    checklist: [
      'Canais mapeados (direto/indireto/omnichannel)',
      'Intermediarios selecionados e avaliados',
      'Plano de gestao de conflitos de canal',
    ],
  },

  9: {
    name: 'Varejo e Omnichannel',
    phase: 3,
    squad: 'planejamento',
    inputs: [
      'Design de Canais',
    ],
    steps: [
      'Definir experiencia integrada online e fisica (se aplicavel)',
      'Definir sortimento e nivel de servico',
      'Desenvolver estrategia de marcas proprias (se aplicavel)',
    ],
    checklist: [
      'Experiencia integrada online + fisica (se aplicavel)',
      'Sortimento e nivel de servico definidos',
      'Estrategia de marcas proprias (se aplicavel)',
    ],
  },

  10: {
    name: 'Logistica e Supply Chain',
    phase: 3,
    squad: 'planejamento',
    inputs: [
      'Design de Canais + Plano G-STIC',
    ],
    steps: [
      'Otimizar ciclo pedido-ate-pagamento',
      'Definir pontos de armazenagem',
      'Configurar gestao de estoque',
      'Selecionar modos de transporte',
    ],
    checklist: [
      'Ciclo pedido-ate-pagamento otimizado',
      'Pontos de armazenagem definidos',
      'Gestao de estoque configurada',
      'Modos de transporte selecionados',
    ],
  },

  11: {
    name: 'Marketing de Causa e RSC',
    phase: 3,
    squad: 'planejamento',
    inputs: [
      'Valores da marca + interesses da comunidade',
    ],
    steps: [
      'Identificar causas alinhadas aos valores da marca',
      'Desenvolver campanha de impacto social',
      'Validar autenticidade (evitar greenwashing)',
    ],
    checklist: [
      'Campanha de impacto social alinhada aos valores (se aplicavel)',
      'Autenticidade validada (nao greenwashing)',
    ],
  },

  // ============================================================
  // PHASE 4: TRACAO E VENDAS — Squad Growth
  // ============================================================

  12: {
    name: 'Producao Criativa',
    phase: 4,
    squad: 'growth',
    inputs: [
      'Briefing G-STIC + Swipe files de referencias',
    ],
    steps: [
      'Mesa Analogica: Gerar ideias livre de telas (papel, quadro branco)',
      'Colecionar referencias seletivamente (swipe file)',
      'Copiar > Emular > Criar voz propria',
      'Mesa Digital: Editar, refinar e finalizar',
      'Criar o que voce quer consumir (nao apenas o que sabe)',
    ],
    checklist: [
      'Copys para cada canal',
      'Criativos visuais (imagens, videos)',
      'Roteiros de video/audio',
      'Landing pages estruturadas',
      'Todos consistentes com posicionamento da Fase 2',
    ],
  },

  13: {
    name: 'Comunicacao Integrada IMC',
    phase: 4,
    squad: 'growth',
    inputs: [
      'Assets criativos + publico-alvo tatico',
    ],
    steps: [
      'Definir mix de comunicacao (Ads, RP, Social, Email, Eventos)',
      'Garantir integracao horizontal (preco, embalagem, distribuicao alinhados)',
      'Garantir integracao vertical (comunicacao alinhada com G-STIC)',
      'Definir orcamento por canal',
    ],
    checklist: [
      'Mix de canais definido com orcamento',
      'Mesma mensagem em todos os pontos de contato',
      'Integracao horizontal e vertical validadas',
      'Calendario editorial configurado',
    ],
  },

  14: {
    name: 'Bullseye Framework - 19 Canais',
    phase: 4,
    squad: 'growth',
    inputs: [
      'Plano de Midia + Caminho Critico definido',
    ],
    steps: [
      'Anel Externo: Brainstorm dos 19 canais (SEO, SEM, Social Ads, Content Marketing, Email, PR, Engenharia como Marketing, Blogs, Comunidades, Eventos, Speaking, Trade Shows, Offline Ads, Sales, Affiliates, Existing Platforms, Business Development, Viral Marketing)',
      'Anel Medio: Testes rapidos (<$1.000, <1 mes) nos 3-5 mais promissores',
      'Anel Interno: Foco 100% no canal que PROVOU mover a agulha',
    ],
    checklist: [
      '19 canais avaliados no brainstorm',
      '3-5 canais testados com dados reais',
      'CAC (custo de aquisicao) medido por canal',
      'LTV estimado por canal',
      '1 canal principal selecionado para foco total',
      'Regra dos 50% aplicada (metade produto, metade tracao)',
    ],
  },

  15: {
    name: 'Funil de Vendas',
    phase: 4,
    squad: 'growth',
    inputs: [
      'Leads gerados pela tracao',
    ],
    steps: [
      'Classificar leads: A (fecha <3 meses), B (3-12 meses), C (marketing passivo)',
      'Qualificar com BANT (Budget, Authority, Need, Timeline)',
      'Aplicar SPIN Selling (Situacao, Problema, Implicacao, Need-Payoff)',
      'Contornar objecoes logicas e psicologicas',
      'Fechar e iniciar onboarding do cliente',
    ],
    checklist: [
      'Leads classificados em A/B/C',
      'Script SPIN documentado',
      'FAQs e materiais de contorno de objecoes',
      'Taxa de conversao por etapa do funil',
      'Processo de onboarding pos-venda definido',
    ],
  },

  // ============================================================
  // PHASE 5: RETENCAO E ESCALA — Squad CRM
  // ============================================================

  16: {
    name: 'CRM, Lealdade e CLV',
    phase: 5,
    squad: 'crm',
    inputs: [
      'Base de clientes ativos + historico de interacoes',
    ],
    steps: [
      'Calcular Customer Lifetime Value (CLV) por segmento',
      'Implementar NPS (Net Promoter Score)',
      'Criar automacoes de email (onboarding, reengajamento, upsell)',
      'Identificar pontos de maior risco de abandono (churn)',
      'Criar programas de fidelidade',
      'Fomentar comunidades de marca e boca a boca',
    ],
    checklist: [
      'CLV calculado e atualizado',
      'NPS implementado (promotores vs detratores mapeados)',
      'Automacoes de email ativas nos pontos de maior churn',
      'Programa de fidelidade operando',
      'Taxa de retencao > taxa de aquisicao em custo',
      'Clientes promotores gerando referrals',
    ],
  },
}
