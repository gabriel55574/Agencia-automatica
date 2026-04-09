# Phase 3: Pipeline Engine - Research

**Researched:** 2026-04-08
**Domain:** Pipeline state UI (accordion), gate Server Actions with row-level locking, process initialization migration, static process definition config
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Accordion UI on Client Profile**
- Replaces the existing `PipelineTimeline` component on `/clients/[id]`
- Each phase row is clickable — click to expand/collapse its processes
- Active phase auto-expands on page load; non-active phases collapsed by default
- Per-process row: process name + status badge only (pending / active / completed / failed / needs rework)
- Clicking a process row expands inline with definition details: name, squad, inputs, outputs, checklist
- No navigation away from profile — all detail inline on the scrollable page

**Gate Advancement Flow**
- Gate controls live inside the active phase section, below the process list
- Approve Gate: opens confirmation AlertDialog → gate.status = `approved`, phase advances, next phase activates
- Reject Gate: opens dialog with checkboxes for each process in phase → gate.status = `rejected`, selected processes.status = `failed`
- Phase remains `active` after rejection (no regression)
- Gate UI persists in rejected state until re-approved
- Race condition protection via SELECT FOR UPDATE in Server Actions (DB trigger already handles phase sequence)

**Process Definitions Source**
- All 16 process definitions live in `src/lib/pipeline/processes.ts` (static TypeScript file, no DB queries)
- Content sourced from `docs/agency-os-prompt.md`
- Sub-processes (3.1, 3.2, 4.1, 7.1, 13.1, 13.2, 14.1, 14.2) are execution steps within main processes, NOT separate DB rows

**Process Row Initialization**
- All 16 process rows created atomically when a new client is created
- The existing `create_client_with_phases` RPC (migration 00004) must be extended
- All process rows start with `status: 'pending'`

**Race Condition Protection**
- Phase sequence enforcement trigger already handles phase-level race conditions (migration 00002)
- Gate Server Actions must use SELECT FOR UPDATE on the gate row before updating
- No additional DB migrations needed for race condition protection itself

**Routes**
- No new routes in Phase 3 — all interactions on existing `/clients/[id]`

### Claude's Discretion

None specified — all major decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- AI gate pre-review and structured checklists (Phase 6)
- Squad execution trigger (Phase 5)
- Real output display in process rows (Phase 7)
- XState integration (may be revisited in Phase 5)
- Job queue worker (Phase 4)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIPE-01 | Each client has an independent pipeline state tracked in the database | Schema already supports this via phases.client_id FK; accordion reads per-client phases + processes |
| PIPE-02 | Clients can only advance to the next phase after the quality gate is approved | `approveGate` Server Action: updates gate → completed phase → activates next phase; DB trigger enforces sequence |
| PIPE-03 | If a quality gate fails, client returns to the specific failed process (not the entire phase) | `rejectGate` Server Action: sets gate.status = rejected, selected processes.status = failed; phase stays active |
| PIPE-04 | Pipeline transitions are protected against race conditions with row-level locking | SELECT FOR UPDATE on quality_gates row in approveGate; DB trigger provides second enforcement layer |
| PIPE-05 | Each of the 16 processes has defined inputs, execution steps, and output checklists viewable in the app | Static `processes.ts` config + accordion inline expansion; content extracted from agency-os-prompt.md |
</phase_requirements>

---

## Summary

Phase 3 builds on a fully functional client management layer (Phase 2) and a solid database schema (Phase 1). The work is divided into three distinct streams: (1) a DB migration extending the `create_client_with_phases` RPC to also seed 16 process rows, (2) two Server Actions (`approveGate` / `rejectGate`) with row-level locking, and (3) a new accordion UI component on the client profile page that replaces the existing `PipelineTimeline`.

The codebase is in excellent shape for this phase. The schema already has the `processes` table with all required columns (`process_number`, `name`, `squad`, `phase_id`, `client_id`, `status`). The quality_gates table has all columns needed for gate approval/rejection including `operator_decision` and `operator_notes`. The existing Server Action pattern in `src/lib/actions/clients.ts` is a clean template to follow: auth check first, Zod validation, then admin client write. The `createAdminClient()` utility already exists.

The most significant discovery is that `radix-ui` (v1.4.3, already installed) exports both `Accordion` and `Dialog` primitives directly — no additional npm installs are needed for the UI. The existing shadcn/ui pattern of wrapping radix primitives in styled components in `src/components/ui/` can be followed exactly. No new npm dependencies are required for Phase 3.

**Primary recommendation:** Plan three work units — (1) DB migration + process initialization, (2) gate Server Actions, (3) accordion pipeline component. The static `processes.ts` config is a prerequisite for the accordion and should be created in the same work unit as the UI.

---

## Standard Stack

### Core (all already installed)

| Library | Installed Version | Purpose | Why Standard |
|---------|------------------|---------|--------------|
| `radix-ui` | 1.4.3 | Accordion and Dialog primitives | Already installed; exports `Accordion` and `Dialog` directly — no additional install needed |
| `zod` | 4.3.6 | Input validation for gate actions | Already installed; `safeParse` API unchanged in v4 |
| `@supabase/supabase-js` | 2.102.1 | Database client | Already installed; admin client pattern established |
| `next` | 16.2.3 | Server Actions | Already installed; `'use server'` pattern established |
| `react-hook-form` | 7.72.1 | Reject gate form (checkboxes + notes) | Already installed; used in Phase 2 forms |

[VERIFIED: npm registry / node_modules inspection]

### No New npm Dependencies Required

Phase 3 requires zero new package installations. All needed primitives are already present:
- Accordion: `radix-ui` exports `Accordion` with `Root`, `Item`, `Trigger`, `Header`, `Content`
- Dialog (for gate actions): `radix-ui` exports `Dialog` with full API
- Checkbox (for reject gate process selector): `radix-ui` exports `Checkbox` with `Root` and `Indicator`

[VERIFIED: `node -e "require('radix-ui')"` confirmed Accordion, Dialog, Checkbox all present]

### shadcn/ui Components to Create

Phase 3 needs three new shadcn/ui wrapper files (copy-paste pattern, not npm):
- `src/components/ui/accordion.tsx` — wrap `radix-ui` Accordion primitives
- `src/components/ui/dialog.tsx` — wrap `radix-ui` Dialog primitives (for gate actions)
- `src/components/ui/checkbox.tsx` — wrap `radix-ui` Checkbox (for reject gate selector)

The `alert-dialog.tsx` already installed demonstrates the exact import pattern:
```typescript
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
// wrap with className, cn(), data-slot attributes
```

[VERIFIED: inspected `src/components/ui/alert-dialog.tsx`]

---

## Architecture Patterns

### Recommended Project Structure for Phase 3

```
src/
├── lib/
│   ├── pipeline/
│   │   └── processes.ts          # NEW: static ProcessDefinition config for all 16
│   ├── actions/
│   │   ├── clients.ts            # EXISTING: createClient, updateClient, archive, restore
│   │   └── gates.ts              # NEW: approveGate, rejectGate
│   └── database/
│       ├── enums.ts              # EXISTING: PROCESS_TO_PHASE, PROCESS_TO_SQUAD
│       └── schema.ts             # EXISTING: gateActionSchema (add)
├── components/
│   ├── ui/
│   │   ├── accordion.tsx         # NEW: shadcn/ui Accordion wrapper
│   │   ├── dialog.tsx            # NEW: shadcn/ui Dialog wrapper
│   │   └── checkbox.tsx          # NEW: shadcn/ui Checkbox wrapper
│   └── clients/
│       ├── pipeline-accordion.tsx # NEW: replaces PipelineTimeline
│       ├── pipeline-phase.tsx     # NEW: single phase row (expandable)
│       ├── process-row.tsx        # NEW: single process row with inline definition
│       ├── gate-section.tsx       # NEW: approve/reject UI for active gate
│       └── pipeline-timeline.tsx  # EXISTING: remove after accordion is live
├── app/
│   └── (dashboard)/clients/[id]/
│       └── page.tsx              # MODIFY: swap PipelineTimeline for PipelineAccordion,
│                                 #         fetch processes + quality_gates
supabase/
└── migrations/
    └── 00005_initialize_client_processes.sql  # NEW: extend RPC to seed process rows
```

### Pattern 1: Server Action with Row-Level Locking

The gate Server Actions cannot use `supabase.from('quality_gates').update()` directly because that does not acquire a row lock before the read. For atomic gate state transitions, Supabase's PostgREST layer does not expose `SELECT FOR UPDATE` — it must be done via an RPC (stored function).

**The correct approach:** Create a PostgreSQL function for each gate operation that wraps the transition atomically:

```sql
-- supabase/migrations/00006_gate_actions.sql
CREATE OR REPLACE FUNCTION approve_gate(p_gate_id UUID, p_client_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_gate quality_gates%ROWTYPE;
  v_phase phases%ROWTYPE;
  v_next_phase phases%ROWTYPE;
BEGIN
  -- Acquire row lock on the gate (prevents concurrent double-approval)
  SELECT * INTO v_gate
  FROM quality_gates
  WHERE id = p_gate_id AND client_id = p_client_id
  FOR UPDATE;

  -- Guard: only approve if pending or rejected
  IF v_gate.status NOT IN ('pending', 'rejected') THEN
    RAISE EXCEPTION 'Gate % cannot be approved: current status is %',
      p_gate_id, v_gate.status;
  END IF;

  -- Update gate
  UPDATE quality_gates
  SET status = 'approved',
      operator_decision = 'approved',
      reviewed_at = NOW()
  WHERE id = p_gate_id;

  -- Complete current phase
  UPDATE phases
  SET status = 'completed', completed_at = NOW()
  WHERE id = v_gate.phase_id;

  -- Activate next phase (trigger enforce_phase_sequence fires here)
  UPDATE phases
  SET status = 'active', started_at = NOW()
  WHERE client_id = p_client_id
    AND phase_number = v_gate.gate_number + 1;

  -- Update clients.current_phase_number
  UPDATE clients
  SET current_phase_number = v_gate.gate_number + 1
  WHERE id = p_client_id;
END;
$$;
```

**Why RPC not direct update:** PostgREST (Supabase's HTTP layer) does not support `SELECT FOR UPDATE` in its query builder. The only way to get row-level locking with Supabase is through a stored function called via `admin.rpc()`. This is the same pattern used in `claim_next_job()` (migration 00002).

[VERIFIED: inspection of migrations 00002 and 00004; confirmed `claim_next_job` uses FOR UPDATE SKIP LOCKED via RPC]

**Server Action wrapper:**

```typescript
// src/lib/actions/gates.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from './clients'

const approveGateSchema = z.object({
  gateId: z.string().uuid(),
  clientId: z.string().uuid(),
})

export async function approveGateAction(
  gateId: string,
  clientId: string
): Promise<ActionResult> {
  // Auth check (T-2-01-03 pattern)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const input = approveGateSchema.safeParse({ gateId, clientId })
  if (!input.success) return { error: 'Invalid gate ID' }

  const admin = createAdminClient()
  const { error } = await admin.rpc('approve_gate', {
    p_gate_id: input.data.gateId,
    p_client_id: input.data.clientId,
  })

  if (error) {
    console.error('[approveGateAction] RPC error:', error)
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
```

[ASSUMED: Supabase JS client `.rpc()` returns `{ error }` on PostgreSQL RAISE EXCEPTION — this is the established pattern from Phase 1/2 but was not live-tested in this session]

### Pattern 2: Accordion UI (React Client Component)

The accordion must be a Client Component (`'use client'`) because it manages open/closed state. The profile page (`/clients/[id]/page.tsx`) is a Server Component that fetches data and passes it as props.

**Data fetching shape needed by the accordion:**

```typescript
// In /clients/[id]/page.tsx (Server Component)
const [{ data: phases }, { data: processes }, { data: gates }] = await Promise.all([
  supabase.from('phases').select('id, phase_number, name, status, started_at, completed_at').eq('client_id', id).order('phase_number'),
  supabase.from('processes').select('id, phase_id, process_number, name, squad, status').eq('client_id', id).order('process_number'),
  supabase.from('quality_gates').select('id, phase_id, gate_number, status, operator_decision, operator_notes').eq('client_id', id).order('gate_number'),
])
```

**PipelineAccordion component signature:**

```typescript
// src/components/clients/pipeline-accordion.tsx
'use client'

type PipelineAccordionProps = {
  phases: PhaseRow[]
  processes: ProcessRow[]
  gates: GateRow[]
  clientId: string
  clientName: string
}
```

**Default open value:** Radix Accordion `type="multiple"` with `defaultValue` set to the active phase ID. This auto-expands the active phase on load without requiring `useEffect`.

```typescript
// Source: radix-ui Accordion API (verified via node inspection)
<Accordion.Root
  type="multiple"
  defaultValue={[activePhase?.id ?? '']}
>
```

[VERIFIED: `node -e "const {Accordion} = require('radix-ui'); console.log(Object.keys(Accordion))"` — confirms Root, Item, Trigger, Header, Content exports]

### Pattern 3: Process Initialization Migration

The existing `create_client_with_phases` function (migration 00004) must be extended. The cleanest approach is to replace the function in a new migration (PostgreSQL allows `CREATE OR REPLACE FUNCTION`) while adding the process inserts:

```sql
-- supabase/migrations/00005_initialize_client_processes.sql
CREATE OR REPLACE FUNCTION create_client_with_phases(
  p_name TEXT,
  p_company TEXT,
  p_briefing JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_id UUID;
  v_phase_ids UUID[5];
  v_phase_names TEXT[] := ARRAY['Diagnostico','Engenharia de Valor','Go-to-Market','Tracao e Vendas','Retencao e Escala'];
  -- Process definitions: (process_number, phase_index 1-5, name, squad)
  -- Phase 1 (index 1): processes 1-2
  -- Phase 2 (index 2): processes 3-6
  -- Phase 3 (index 3): processes 7-11
  -- Phase 4 (index 4): processes 12-15
  -- Phase 5 (index 5): process 16
  i INT;
BEGIN
  INSERT INTO clients (name, company, briefing)
  VALUES (p_name, p_company, p_briefing)
  RETURNING id INTO v_client_id;

  FOR i IN 1..5 LOOP
    INSERT INTO phases (client_id, phase_number, name, status, started_at)
    VALUES (
      v_client_id, i, v_phase_names[i],
      CASE WHEN i = 1 THEN 'active' ELSE 'pending' END,
      CASE WHEN i = 1 THEN NOW() ELSE NULL END
    )
    RETURNING id INTO v_phase_ids[i];
  END LOOP;

  -- Insert 16 process rows (all pending)
  -- Uses the phase_id for the correct phase
  INSERT INTO processes (phase_id, client_id, process_number, name, squad, status)
  VALUES
    -- Phase 1: Diagnostico
    (v_phase_ids[1], v_client_id, 1,  'Pesquisa de Mercado e Insights',    'estrategia',   'pending'),
    (v_phase_ids[1], v_client_id, 2,  'Segmentacao, Targeting e Personas', 'estrategia',   'pending'),
    -- Phase 2: Engenharia de Valor
    (v_phase_ids[2], v_client_id, 3,  'Posicionamento',                    'estrategia',   'pending'),
    (v_phase_ids[2], v_client_id, 4,  'Grand Slam Offers',                 'estrategia',   'pending'),
    (v_phase_ids[2], v_client_id, 5,  'Pricing',                           'estrategia',   'pending'),
    (v_phase_ids[2], v_client_id, 6,  'Branding Estrategico',              'estrategia',   'pending'),
    -- Phase 3: Go-to-Market
    (v_phase_ids[3], v_client_id, 7,  'Planejamento G-STIC',               'planejamento', 'pending'),
    (v_phase_ids[3], v_client_id, 8,  'Design de Canais de Distribuicao',  'planejamento', 'pending'),
    (v_phase_ids[3], v_client_id, 9,  'Varejo e Omnichannel',              'planejamento', 'pending'),
    (v_phase_ids[3], v_client_id, 10, 'Logistica e Supply Chain',          'planejamento', 'pending'),
    (v_phase_ids[3], v_client_id, 11, 'Marketing de Causa e RSC',          'planejamento', 'pending'),
    -- Phase 4: Tracao e Vendas
    (v_phase_ids[4], v_client_id, 12, 'Producao Criativa',                 'growth',       'pending'),
    (v_phase_ids[4], v_client_id, 13, 'Comunicacao Integrada IMC',         'growth',       'pending'),
    (v_phase_ids[4], v_client_id, 14, 'Bullseye Framework - 19 Canais',    'growth',       'pending'),
    (v_phase_ids[4], v_client_id, 15, 'Funil de Vendas',                   'growth',       'pending'),
    -- Phase 5: Retencao e Escala
    (v_phase_ids[5], v_client_id, 16, 'CRM, Lealdade e CLV',               'crm',          'pending');

  -- Insert 4 quality gate rows (one per phase 1-4, all pending)
  INSERT INTO quality_gates (phase_id, client_id, gate_number, status)
  VALUES
    (v_phase_ids[1], v_client_id, 1, 'pending'),
    (v_phase_ids[2], v_client_id, 2, 'pending'),
    (v_phase_ids[3], v_client_id, 3, 'pending'),
    (v_phase_ids[4], v_client_id, 4, 'pending');

  RETURN v_client_id;
END;
$$;
```

**Key insight:** The existing test `CLNT-01: create_client_with_phases RPC creates 1 client + 5 phase rows` must be updated to also assert 16 process rows and 4 gate rows. This is expected — the migration replaces the function signature-compatibly.

**Important:** The `quality_gates` table has `UNIQUE(phase_id, gate_number)`. The RPC must insert quality_gate rows atomically alongside processes. Currently the RPC does NOT insert gate rows (verified by reading migration 00004). Both processes AND gates should be seeded here.

[VERIFIED: inspected migration 00004 — no process or gate inserts exist in current RPC]

### Anti-Patterns to Avoid

- **Direct `.update()` for gate approval:** PostgREST does not support `FOR UPDATE`. Use RPC.
- **`useState` for accordion open/closed in Server Component:** The profile page is a Server Component. The accordion must be its own `'use client'` component receiving data as props.
- **Fetching process definitions from DB at runtime:** Process definitions are static config. Only process instance state (status, started_at, etc.) comes from the DB. Fetching definitions from DB adds latency for no reason.
- **Setting phase status directly in the gate Server Action without the DB trigger:** Let the trigger `enforce_phase_sequence` validate the transition. The RPC should attempt the phase update and allow the trigger to raise an exception if something is wrong.
- **Registering quality_gate rows separately from process rows:** Both must be seeded in the same atomic RPC to prevent partially-initialized clients.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accordion expand/collapse | Custom div + useState toggle for each phase | `radix-ui` Accordion | Keyboard navigation, ARIA `aria-expanded`, animation states via `data-state` attributes — all built in |
| Modal dialog for gate actions | Custom modal with Portal, overlay, focus trap | `radix-ui` Dialog | Focus trapping, escape key, scroll lock, ARIA `role="dialog"` — mandatory for accessibility |
| Row-level locking | Application-level mutex, localStorage flag | PostgreSQL `SELECT FOR UPDATE` via RPC | Only DB-level locking is safe across concurrent requests; application locks don't work with multiple server processes |
| Sequential phase enforcement | Application-level guard in Server Action | Existing `enforce_phase_sequence` trigger | Trigger fires at DB level regardless of whether the attempt comes from the app, dashboard, or direct SQL |
| Process-to-phase mapping | Hard-coded if/else or switch | `PROCESS_TO_PHASE` from `src/lib/database/enums.ts` | Already exists, single source of truth |

---

## Complete Process Definitions (for `src/lib/pipeline/processes.ts`)

Extracted from `docs/agency-os-prompt.md`. This is the full content the static config file needs to contain.

### TypeScript Type

```typescript
export type ProcessDefinition = {
  name: string
  phase: 1 | 2 | 3 | 4 | 5
  squad: 'estrategia' | 'planejamento' | 'growth' | 'crm'
  inputs: string[]
  steps: string[]
  checklist: string[]
}

export const PROCESS_DEFINITIONS: Record<number, ProcessDefinition> = { ... }
```

### All 16 Process Definitions

**Process 1: Pesquisa de Mercado e Insights**
- Phase: 1 | Squad: estrategia
- Inputs: `['Briefing inicial do cliente (problema/objetivo, dados brutos disponiveis)']`
- Steps:
  1. Definir o problema de marketing especifico
  2. Desenvolver plano de pesquisa (fontes primarias/secundarias)
  3. Coletar informacoes (pesquisa observacional, grupos focais, behavioral)
  4. Analisar e extrair insights acionaveis
- Checklist:
  - Problema/oportunidade claramente definido
  - Fontes de dados mapeadas (primarios e secundarios)
  - Analise competitiva (5 Cs: Clientes, Colaboradores, Companhia, Concorrentes, Contexto)
  - Insights acionaveis para decisao de negocio

**Process 2: Segmentacao, Targeting e Personas**
- Phase: 1 | Squad: estrategia
- Inputs: `['Relatorio de Insights do Processo 1']`
- Steps:
  1. Segmentar mercado (demografico, geografico, psicografico, comportamental)
  2. Avaliar atratividade de cada segmento (potencial de lucro)
  3. Avaliar compatibilidade (capacidade de criar valor superior)
  4. Criar perfil tatico (personas)
- Checklist:
  - Segmentos identificados com variaveis claras
  - Teste de atratividade aprovado (potencial financeiro)
  - Teste de compatibilidade aprovado (capacidade de atender)
  - Personas detalhadas com dores, desejos e comportamentos
  - Custo para servir < receita esperada

**Process 3: Posicionamento** (sub-processes 3.1 Vaca Roxa, 3.2 StoryBrand are steps)
- Phase: 2 | Squad: estrategia
- Inputs: `['Documento de Segmentacao e Personas da Fase 1']`
- Steps (10 Passos Dunford + Ries/Trout complement):
  1. Entender clientes que amam o produto
  2. Formar equipe de posicionamento
  3. Alinhar vocabulario e desapegar da bagagem
  4. Listar alternativas competitivas REAIS (o que cliente faria sem voce?)
  5. Isolar atributos/recursos UNICOS (factuais, nao subjetivos)
  6. Mapear atributos em temas de valor
  7. Determinar quem se importa MUITO
  8. Encontrar quadro de referencia de mercado
  9. Adicionar tendencia relevante (opcional)
  10. Capturar e compartilhar documento
  11. Mapear mente do prospecto (diferencial semantico) — Ries/Trout
  12. Encontrar/criar "buraco" (posicao vazia)
  13. Definir nome estrategico
  14. Manter consistencia (evitar F.W.M.T.S.)
- Checklist:
  - Alternativas competitivas mapeadas
  - Atributos unicos FACTUAIS (nao subjetivos)
  - Proposta de valor conectada a beneficios reais
  - Categoria de mercado que torna pontos fortes obvios
  - Nome estrategico validado

**Process 4: Grand Slam Offers** (sub-process 4.1 Cagan Validation is a step)
- Phase: 2 | Squad: estrategia
- Inputs: `['Documento de Posicionamento', 'mapa de desejos do cliente']`
- Steps:
  1. Identificar resultado dos sonhos do consumidor
  2. Listar TODOS os problemas/obstaculos que impedem o sonho
  3. Transformar cada obstaculo em uma solucao
  4. Criar veiculos de entrega (pensamento divergente)
  5. Cortar e Empilhar (Trim & Stack): alto valor + baixo custo permanecem
  6. Aprimorar com escassez, urgencia, bonus e garantias
- Checklist:
  - Resultado dos sonhos claramente articulado
  - Obstaculos mapeados e transformados em solucoes
  - Apenas itens de alto valor / baixo custo na pilha final
  - Value Equation validada: maximiza (Sonho + Probabilidade) / minimiza (Tempo + Esforco)

**Process 5: Pricing**
- Phase: 2 | Squad: estrategia
- Inputs: `['Pilha de Ofertas', 'custos estimados']`
- Steps:
  1. Selecionar objetivo (lucro, penetracao, skimming, lideranca)
  2. Estimar demanda e elasticidade
  3. Estimar custos fixos/variaveis
  4. Analisar precos da concorrencia
  5. Selecionar metodo (markup, valor economico, competitivo)
  6. Definir preco final com psicologia (referencia, bonus, garantias)
  7. Aplicar formula M-A-G-I-C para nomear a oferta
- Checklist:
  - Preco baseado em valor, nao em custo
  - Bonus adicionados (nao descontos no principal)
  - Gatilhos de escassez e urgencia definidos
  - Garantia de reversao de risco incluida
  - Nome da oferta com formula M-A-G-I-C

**Process 6: Branding Estrategico**
- Phase: 2 | Squad: estrategia
- Inputs: `['Documento de Posicionamento', 'Oferta validada']`
- Steps:
  1. Definir mantra da marca (3-5 palavras)
  2. Escolher elementos (logo, simbolos, embalagem)
  3. Construir associacoes secundarias (paises, parceiros, celebridades)
  4. Definir arquitetura do portfolio de marca
- Checklist:
  - Mantra da marca definido
  - Elementos visuais desenhados
  - Associacoes secundarias mapeadas
  - Pontos de Diferenca e Paridade identificados

**Process 7: Planejamento G-STIC** (sub-process 7.1 Content Strategy is a step)
- Phase: 3 | Squad: planejamento
- Inputs: `['Estrategia completa das Fases 1 e 2']`
- Steps:
  1. Goal: Definir foco + benchmark quantitativo + benchmark temporal
  2. Strategy: Validar proposicao de valor para cliente, companhia e colaboradores
  3. Tactics: Projetar os 7 Ts (Produto, Servico, Marca, Preco, Incentivos, Comunicacao, Distribuicao)
  4. Implementation: Assegurar recursos, cronograma, responsaveis
  5. Control: Definir KPIs, metricas e frequencia de revisao
- Checklist:
  - Meta com foco + quanto + quando
  - Proposicao de valor para 3 entidades (cliente/empresa/parceiros)
  - 7 Ts detalhados
  - Cronograma de implementacao
  - Dashboard de metricas de controle

**Process 8: Design de Canais de Distribuicao**
- Phase: 3 | Squad: planejamento
- Inputs: `['Plano G-STIC (componente Distribuicao)']`
- Steps:
  1. Mapear opcoes de canais (direto, indireto, omnichannel)
  2. Selecionar e avaliar intermediarios
  3. Definir plano de gestao de conflitos de canal
- Checklist:
  - Canais mapeados (direto/indireto/omnichannel)
  - Intermediarios selecionados e avaliados
  - Plano de gestao de conflitos de canal

**Process 9: Varejo e Omnichannel**
- Phase: 3 | Squad: planejamento
- Inputs: `['Design de Canais']`
- Steps:
  1. Mapear pontos de contato online e fisicos
  2. Definir sortimento e nivel de servico
  3. Avaliar estrategia de marcas proprias (se aplicavel)
- Checklist:
  - Experiencia integrada online + fisica (se aplicavel)
  - Sortimento e nivel de servico definidos
  - Estrategia de marcas proprias (se aplicavel)

**Process 10: Logistica e Supply Chain**
- Phase: 3 | Squad: planejamento
- Inputs: `['Design de Canais', 'Plano G-STIC']`
- Steps:
  1. Otimizar ciclo pedido-ate-pagamento
  2. Definir pontos de armazenagem
  3. Configurar gestao de estoque
  4. Selecionar modos de transporte
- Checklist:
  - Ciclo pedido-ate-pagamento otimizado
  - Pontos de armazenagem definidos
  - Gestao de estoque configurada
  - Modos de transporte selecionados

**Process 11: Marketing de Causa e RSC**
- Phase: 3 | Squad: planejamento
- Inputs: `['Valores da marca', 'interesses da comunidade']`
- Steps:
  1. Identificar causa alinhada aos valores da marca
  2. Validar autenticidade (evitar greenwashing)
  3. Estruturar campanha de impacto social
- Checklist:
  - Campanha de impacto social alinhada aos valores (se aplicavel)
  - Autenticidade validada (nao greenwashing)

**Process 12: Producao Criativa**
- Phase: 4 | Squad: growth
- Inputs: `['Briefing G-STIC', 'Swipe files de referencias']`
- Steps:
  1. Mesa Analogica: Gerar ideias livre de telas (papel, quadro branco)
  2. Colecionar referencias seletivamente (swipe file)
  3. Copiar > Emular > Criar voz propria
  4. Mesa Digital: Editar, refinar e finalizar
  5. Criar o que voce quer consumir (nao apenas o que sabe)
- Checklist:
  - Copys para cada canal
  - Criativos visuais (imagens, videos)
  - Roteiros de video/audio
  - Landing pages estruturadas
  - Todos consistentes com posicionamento da Fase 2

**Process 13: Comunicacao Integrada IMC** (sub-processes 13.1 Email Nurturing/Chaperon, 13.2 Dream 100 are steps)
- Phase: 4 | Squad: growth
- Inputs: `['Assets criativos', 'publico-alvo tatico']`
- Steps:
  1. Definir mix de comunicacao (Ads, RP, Social, Email, Eventos)
  2. Garantir integracao horizontal (preco, embalagem, distribuicao alinhados)
  3. Garantir integracao vertical (comunicacao alinhada com G-STIC)
  4. Definir orcamento por canal
- Checklist:
  - Mix de canais definido com orcamento
  - Mesma mensagem em todos os pontos de contato
  - Integracao horizontal e vertical validadas
  - Calendario editorial configurado

**Process 14: Bullseye Framework - 19 Canais** (sub-processes 14.1 Growth Hacking Loop, 14.2 CRO are steps)
- Phase: 4 | Squad: growth
- Inputs: `['Plano de Midia', 'Caminho Critico definido']`
- Steps:
  1. Anel Externo: Brainstorm dos 19 canais (SEO, SEM, Social Ads, Content, Email, PR, Engineering as Marketing, Blogs, Comunidades, Eventos, Speaking, Trade Shows, Offline Ads, Sales, Affiliates, Existing Platforms, Business Development, Viral Marketing) — sem descartar nenhum
  2. Anel Medio: Testes rapidos (<$1.000, <1 mes) nos 3-5 mais promissores
  3. Anel Interno: Foco 100% no canal que PROVOU mover a agulha
- Checklist:
  - 19 canais avaliados no brainstorm
  - 3-5 canais testados com dados reais
  - CAC (custo de aquisicao) medido por canal
  - LTV estimado por canal
  - 1 canal principal selecionado para foco total
  - Regra dos 50% aplicada (metade produto, metade tracao)

**Process 15: Funil de Vendas**
- Phase: 4 | Squad: growth
- Inputs: `['Leads gerados pela tracao']`
- Steps:
  1. Classificar leads: A (fecha <3 meses), B (3-12 meses), C (marketing passivo)
  2. Qualificar com BANT (Budget, Authority, Need, Timeline)
  3. Aplicar SPIN Selling (Situacao, Problema, Implicacao, Need-Payoff)
  4. Contornar objecoes logicas e psicologicas
  5. Fechar e iniciar onboarding do cliente
- Checklist:
  - Leads classificados em A/B/C
  - Script SPIN documentado
  - FAQs e materiais de contorno de objecoes
  - Taxa de conversao por etapa do funil
  - Processo de onboarding pos-venda definido

**Process 16: CRM, Lealdade e CLV**
- Phase: 5 | Squad: crm
- Inputs: `['Base de clientes ativos', 'historico de interacoes']`
- Steps:
  1. Calcular Customer Lifetime Value (CLV) por segmento
  2. Implementar NPS (Net Promoter Score)
  3. Criar automacoes de email (onboarding, reengajamento, upsell)
  4. Identificar pontos de maior risco de abandono (churn)
  5. Criar programas de fidelidade
  6. Fomentar comunidades de marca e boca a boca
- Checklist:
  - CLV calculado e atualizado
  - NPS implementado (promotores vs detratores mapeados)
  - Automacoes de email ativas nos pontos de maior churn
  - Programa de fidelidade operando
  - Taxa de retencao > taxa de aquisicao em custo
  - Clientes promotores gerando referrals

[VERIFIED: all content extracted directly from `docs/agency-os-prompt.md`]

---

## Common Pitfalls

### Pitfall 1: quality_gates Not Seeded at Client Creation

**What goes wrong:** A client is created, the operator views the profile, the gate section tries to query `quality_gates` and finds zero rows. The UI shows nothing for the gate, or worse, crashes on `.single()`.

**Why it happens:** The current `create_client_with_phases` RPC (migration 00004) seeds phases but NOT processes or quality_gates. The planner might add process seeding in one migration but forget gate seeding.

**How to avoid:** The new migration must seed ALL three: phase rows, process rows, and quality_gate rows — in a single atomic transaction. Verify by asserting 4 quality_gate rows in the CLNT-01 test.

**Warning signs:** `quality_gates` query returns empty array for a newly created client.

### Pitfall 2: Accordion open state lost on Server Action revalidation

**What goes wrong:** Operator opens Phase 1 accordion, clicks "Approve Gate". Server Action runs, `revalidatePath` fires, the page re-renders — but the accordion resets to its `defaultValue` (active phase). If the gate advanced to Phase 2, the accordion now auto-opens Phase 2, which may confuse the operator.

**Why it happens:** `revalidatePath` causes a full Server Component re-render. The accordion's `defaultValue` re-applies. This is expected React behavior.

**How to avoid:** This is actually correct behavior — after gate approval, Phase 2 is now active, and the accordion should auto-expand Phase 2. No special handling needed. The `defaultValue` derived from the active phase handles this correctly.

**Warning signs:** Accordion opens the wrong phase after gate action — indicates `defaultValue` logic is reading stale data.

### Pitfall 3: `FOR UPDATE` attempted via PostgREST query builder

**What goes wrong:** Developer writes `admin.from('quality_gates').select('*').eq('id', gateId).single()` then immediately updates. Two concurrent clicks both read the same row state before either writes, both proceed, gate ends up double-processed.

**Why it happens:** PostgREST does not expose SQL locking hints. The JavaScript query builder has no `.forUpdate()` method.

**How to avoid:** Gate state transitions (approve, reject) MUST use `admin.rpc()` to call a PostgreSQL function that uses `SELECT ... FOR UPDATE`.

**Warning signs:** Unit tests pass but production shows gate approved twice; `quality_gates.reviewed_at` is set to two different timestamps within milliseconds.

### Pitfall 4: Zod v4 breaking change — `z.enum()` with `as const` arrays

**What goes wrong:** `schema.ts` uses `z.enum(GATE_STATUSES)` where `GATE_STATUSES` is a `const` array. Zod v4 changed enum input requirements.

**Why it happens:** The project uses Zod 4.3.6 (verified). The schema.ts comment says "Do NOT use Zod v4 breaking changes" — meaning it was written expecting v3 but v4 is actually installed.

**How to avoid:** Verify that `z.enum(GATE_STATUSES)` works with the Zod 4.3.6 API. Live test: `node -e "const {z} = require('zod'); const GATE_STATUSES = ['pending','evaluating','approved','rejected']; console.log(z.enum(GATE_STATUSES).safeParse('pending').success)"` — confirmed this works. The existing schema files compile and work in v4.

**Warning signs:** TypeScript errors on `z.enum()` calls; runtime `ZodError` on valid enum values.

### Pitfall 5: Orphaned processes if RPC extends UNIQUE constraint

**What goes wrong:** `processes` has `UNIQUE(phase_id, process_number)`. If the RPC is called on an existing client (e.g., during a re-run scenario), the INSERT will fail with a unique constraint violation.

**Why it happens:** The RPC is idempotent for phases (they also have `UNIQUE(client_id, phase_number)`) but would fail on re-insertion of processes.

**How to avoid:** The RPC is called exactly once at client creation. Add `ON CONFLICT DO NOTHING` to the process inserts as a defensive measure. For gates: same pattern.

**Warning signs:** `duplicate key value violates unique constraint "processes_phase_id_process_number_key"` in logs.

---

## Existing Code to Modify or Replace

### Files to Replace/Modify

| File | Change | Reason |
|------|--------|--------|
| `src/components/clients/pipeline-timeline.tsx` | Replace with `pipeline-accordion.tsx` | Phase 3 decision: accordion replaces timeline |
| `src/app/(dashboard)/clients/[id]/page.tsx` | Add processes + gates queries; swap `PipelineTimeline` for `PipelineAccordion` | Page must fetch processes and gates data |
| `supabase/migrations/00004_create_client_with_phases.sql` | Superseded by migration 00005 | New migration replaces the RPC via `CREATE OR REPLACE FUNCTION` |
| `tests/db/clients.test.ts` | Update CLNT-01 tests to assert 16 process rows + 4 gate rows | RPC now seeds more rows; existing tests will still pass but should be extended |

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/pipeline/processes.ts` | Static PROCESS_DEFINITIONS config (all 16) |
| `src/lib/actions/gates.ts` | `approveGateAction`, `rejectGateAction` Server Actions |
| `src/components/ui/accordion.tsx` | shadcn/ui Accordion wrapper around radix-ui |
| `src/components/ui/dialog.tsx` | shadcn/ui Dialog wrapper (for gate confirmation) |
| `src/components/ui/checkbox.tsx` | shadcn/ui Checkbox wrapper (for reject gate selector) |
| `src/components/clients/pipeline-accordion.tsx` | Main accordion component (replaces PipelineTimeline) |
| `src/components/clients/gate-section.tsx` | Approve/Reject gate UI |
| `supabase/migrations/00005_initialize_client_processes.sql` | Extended RPC + gate seeding |
| `supabase/migrations/00006_gate_actions.sql` | `approve_gate` and `reject_gate` PostgreSQL functions |
| `tests/db/pipeline.test.ts` | Integration tests for PIPE-01 through PIPE-04 |
| `tests/unit/processes-config.test.ts` | Unit tests for PROCESS_DEFINITIONS config (PIPE-05) |
| `tests/unit/gate-actions.test.ts` | Unit tests for gate action input validation |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@radix-ui/react-accordion` (separate package) | `radix-ui` unified package (all primitives) | shadcn/ui v2+ / late 2024 | Import from `radix-ui` not `@radix-ui/react-accordion` |
| `@radix-ui/react-dialog` (separate package) | `radix-ui` unified package | shadcn/ui v2+ / late 2024 | Import from `radix-ui` not `@radix-ui/react-dialog` |
| `import { useFormState } from 'react-dom'` | `import { useActionState } from 'react'` | React 19 | `useActionState` is the React 19 stable API; `useFormState` is deprecated |

[VERIFIED: inspected `alert-dialog.tsx` which already imports `from "radix-ui"` — confirms the unified package pattern is what this project uses]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase JS client `.rpc()` returns `{ error }` containing the PostgreSQL `RAISE EXCEPTION` message text | Architecture Patterns — Pattern 1 | Gate Server Actions would need different error handling; low risk — this is the established pattern from migrations 00002/00004 |
| A2 | Zod 4.3.6 is fully backward-compatible with `z.enum(const_array)` as used in `schema.ts` | Common Pitfalls — Pitfall 4 | Schema validation would fail at runtime; mitigated by the live `safeParse` test confirming v4 works |

---

## Environment Availability

Phase 3 is code/config changes with the Supabase cloud project already connected. No new external dependencies.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase cloud project | All DB operations | Assumed (Phase 1+2 complete) | Latest | — |
| `radix-ui` | Accordion, Dialog, Checkbox | Yes | 1.4.3 | — |
| `zod` | Gate action validation | Yes | 4.3.6 | — |
| `vitest` | Test suite | Yes | 4.1.3 | — |

[VERIFIED: `package.json` and `node_modules` inspection]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` (runs `vitest run`) |
| Full suite command | `npm test` |
| Watch mode | `npm run test:watch` |

Test pattern: unit tests in `tests/unit/`, integration tests (requiring live Supabase) in `tests/db/`. Integration tests use `testClient` (service role) and call `cleanTestData()` in `beforeEach`/`afterEach`.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIPE-01 | Two clients have independent pipeline states | integration | `npm test -- --reporter=verbose tests/db/pipeline.test.ts` | No — Wave 0 |
| PIPE-02 | Gate approval transitions phase to completed + activates next | integration | `npm test -- tests/db/pipeline.test.ts` | No — Wave 0 |
| PIPE-02 | Gate cannot be approved if already approved | integration | `npm test -- tests/db/pipeline.test.ts` | No — Wave 0 |
| PIPE-03 | Gate rejection marks selected processes as `failed`, phase stays `active` | integration | `npm test -- tests/db/pipeline.test.ts` | No — Wave 0 |
| PIPE-04 | Concurrent approve_gate calls do not double-process | integration | `npm test -- tests/db/pipeline.test.ts` | No — Wave 0 |
| PIPE-05 | PROCESS_DEFINITIONS has exactly 16 entries | unit | `npm test -- tests/unit/processes-config.test.ts` | No — Wave 0 |
| PIPE-05 | Each process definition has required fields (name, phase, squad, inputs, steps, checklist) | unit | `npm test -- tests/unit/processes-config.test.ts` | No — Wave 0 |
| PIPE-05 | Process phase assignments match PROCESS_TO_PHASE enum | unit | `npm test -- tests/unit/processes-config.test.ts` | No — Wave 0 |
| PIPE-05 | Process squad assignments match PROCESS_TO_SQUAD enum | unit | `npm test -- tests/unit/processes-config.test.ts` | No — Wave 0 |

### Unit-Testable Functions

**`src/lib/pipeline/processes.ts`** (pure data, no I/O):
- `PROCESS_DEFINITIONS` has exactly 16 keys: `Object.keys(PROCESS_DEFINITIONS).length === 16`
- Every definition's `phase` matches `PROCESS_TO_PHASE[processNumber]`
- Every definition's `squad` matches `PROCESS_TO_SQUAD[processNumber]`
- Every definition has non-empty `inputs`, `steps`, `checklist` arrays

**`src/lib/actions/gates.ts`** (testable validation logic):
- `approveGateAction` returns `{ error: 'Unauthorized' }` when no session (mock `createClient`)
- `approveGateAction` returns `{ error: 'Invalid gate ID' }` on non-UUID input
- `rejectGateAction` returns `{ error: ... }` when `failedProcessIds` is empty array
- Input schemas validate correctly (UUID format, non-empty process ID list)

### Integration Test Scenarios

**Test file: `tests/db/pipeline.test.ts`**

1. **PIPE-01: Independent pipeline states**
   - Create two clients via `create_client_with_phases` RPC
   - Verify each has 16 process rows and 4 gate rows (tests updated RPC)
   - Approve Gate 1 for Client A via `approve_gate` RPC
   - Verify Client A Phase 1 = completed, Phase 2 = active
   - Verify Client B Phase 1 = active (unchanged)

2. **PIPE-02: Gate-controlled advancement**
   - Create client, call `approve_gate` for Gate 1
   - Assert: `quality_gates.status` = `approved`, `quality_gates.operator_decision` = `approved`
   - Assert: Phase 1 `status` = `completed`, `completed_at` is not null
   - Assert: Phase 2 `status` = `active`, `started_at` is not null
   - Assert: `clients.current_phase_number` = 2
   - Assert: Calling `approve_gate` again on already-approved gate raises exception

3. **PIPE-03: Rework routing to specific process**
   - Create client, call `reject_gate` with `failedProcessIds = [process_1_id]`
   - Assert: `quality_gates.status` = `rejected`
   - Assert: Process 1 `status` = `failed`
   - Assert: Process 2 `status` still = `pending` (not all processes failed)
   - Assert: Phase 1 `status` = `active` (no regression)
   - Assert: After rejection, calling `approve_gate` again succeeds (gate: rejected → approved)

4. **PIPE-04: Race condition protection**
   - Call `approve_gate` twice concurrently via `Promise.all`
   - Assert: Exactly one call succeeds; one returns an error about already-approved state
   - Assert: `quality_gates.reviewed_at` is a single timestamp (not two close timestamps)

5. **Updated CLNT-01: RPC seeds processes and gates**
   - Extend existing `clients.test.ts` CLNT-01 test:
   - Assert 16 process rows with correct `process_number`, `squad`, `phase_id` assignments
   - Assert 4 quality_gate rows with `gate_number` 1-4 and `status = 'pending'`

### Implementation Verifiable via grep

```bash
# Verify accordion does not import from @radix-ui/react-accordion (old pattern)
grep -r "@radix-ui/react-accordion" src/

# Verify gate actions use admin.rpc() not direct .update()
grep -n "\.from('quality_gates')\.update" src/lib/actions/gates.ts
# Expected: no matches (all updates happen inside RPC functions)

# Verify all 16 processes are defined
grep -c "^  [0-9]\+:" src/lib/pipeline/processes.ts
# Expected: 16

# Verify pipeline accordion is client component
head -1 src/components/clients/pipeline-accordion.tsx
# Expected: 'use client'

# Verify profile page fetches processes
grep "from('processes')" src/app/\(dashboard\)/clients/\[id\]/page.tsx
# Expected: 1 match

# Verify gate actions have auth check
grep "getUser" src/lib/actions/gates.ts
# Expected: at least 1 match per action
```

### Wave 0 Gaps (Test Files to Create Before Implementation)

- `tests/db/pipeline.test.ts` — covers PIPE-01, PIPE-02, PIPE-03, PIPE-04
- `tests/unit/processes-config.test.ts` — covers PIPE-05
- `tests/unit/gate-actions.test.ts` — unit tests for gate action input validation

*(Existing tests: `tests/db/clients.test.ts` covers CLNT-01 and must be extended in Wave 1 to assert 16 process rows + 4 gate rows)*

### Sampling Rate

- **Per task commit:** `npm test -- tests/unit/processes-config.test.ts tests/unit/gate-actions.test.ts` (unit only, fast)
- **Per wave merge:** `npm test` (full suite including integration tests against Supabase cloud)
- **Phase gate:** Full suite green before `/gsd-verify-work`

---

## Security Domain

Phase 3 adds gate Server Actions and extends the client creation RPC. Applicable ASVS categories:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | `supabase.auth.getUser()` check at start of every Server Action — pattern from `clients.ts` |
| V3 Session Management | No (handled by existing middleware) | — |
| V4 Access Control | Yes | Admin client (`createAdminClient()`) used only after auth check; gate actions verify `clientId` matches gate owner |
| V5 Input Validation | Yes | Zod schemas for `gateId` (UUID), `clientId` (UUID), `failedProcessIds` (UUID[]) |
| V6 Cryptography | No | — |

| Threat Pattern | STRIDE | Standard Mitigation |
|----------------|--------|---------------------|
| Unauthenticated gate approval | Elevation of Privilege | `getUser()` check returns `{ error: 'Unauthorized' }` before any DB write |
| Client ID spoofing in gate action | Tampering | RPC checks `WHERE client_id = p_client_id` — gate row must belong to specified client |
| Double-approval via concurrent requests | Tampering | `SELECT FOR UPDATE` in the `approve_gate` PostgreSQL function |
| Invalid UUID injection | Tampering | Zod UUID validation rejects malformed IDs before RPC call |

---

## Sources

### Primary (HIGH confidence)

- `docs/agency-os-prompt.md` — all 16 process definitions, steps, checklists extracted verbatim
- `supabase/migrations/00001_initial_schema.sql` — processes table schema, quality_gates table schema
- `supabase/migrations/00002_phase_enforcement.sql` — `enforce_phase_sequence` trigger, `claim_next_job` FOR UPDATE pattern
- `supabase/migrations/00004_create_client_with_phases.sql` — current RPC (no process/gate seeding confirmed)
- `src/lib/database/enums.ts` — PROCESS_TO_PHASE, PROCESS_TO_SQUAD, all status enums
- `src/lib/actions/clients.ts` — Server Action pattern (auth check, Zod, admin client)
- `src/components/ui/alert-dialog.tsx` — shadcn/ui wrapper pattern using `radix-ui` unified package
- `src/app/(dashboard)/clients/[id]/page.tsx` — current profile page structure
- `src/components/clients/pipeline-timeline.tsx` — component being replaced
- `node_modules/radix-ui` (runtime inspection) — confirmed Accordion, Dialog, Checkbox exports

### Secondary (MEDIUM confidence)

- `package.json` — all installed dependencies and versions
- `vitest.config.ts` — test runner configuration
- `tests/setup.ts` — test infrastructure pattern

### Tertiary (LOW confidence — ASSUMED)

- Supabase `.rpc()` error propagation behavior for RAISE EXCEPTION (A1 above)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via node_modules inspection
- Architecture: HIGH — patterns derived from existing working code in the codebase
- Process definitions: HIGH — extracted verbatim from agency-os-prompt.md
- Pitfalls: HIGH — derived from actual code inspection (missing gate seeding, Zod version mismatch)
- Gate Server Action pattern: MEDIUM — FOR UPDATE via RPC is the correct approach; exact error propagation is ASSUMED

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable stack, no fast-moving dependencies)

---

## RESEARCH COMPLETE
