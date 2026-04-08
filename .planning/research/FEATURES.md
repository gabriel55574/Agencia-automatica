# Feature Landscape

**Domain:** AI-powered solo-operator marketing agency management system
**Researched:** 2026-04-08
**Confidence:** MEDIUM (based on training data knowledge of agency management platforms + detailed project methodology doc; no live web verification available)

## Context

This feature analysis is tailored for a system that is NOT a generic project management tool. It is a purpose-built operating system for a solo operator running 15+ marketing clients through a fixed 5-phase, 16-process, 4-gate pipeline powered by Claude Code CLI squads. The feature set must serve one person managing everything -- not a team collaborating.

Key reference platforms analyzed from training data: Monday.com, ClickUp, Teamwork.com, Productive.io, Function Point, HubSpot (operations hub), Notion-based agency setups, and emerging AI-native tools like Jasper, Copy.ai workflows, and Lindy.ai agent orchestration.

---

## Table Stakes

Features the operator absolutely needs or the system is unusable. Missing any of these means the product cannot fulfill its core promise of "one person, 15+ clients, agency quality."

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| T1 | **Multi-client Kanban pipeline board** | Solo operator must see all 15+ clients' phase status at a glance. Without this, tracking happens in spreadsheets and the system has no reason to exist. | Medium | 5 fixed columns (one per phase), cards show client name, current process, days-in-phase, gate status. Must handle 15-30 cards without feeling cluttered. |
| T2 | **Client intake / onboarding form** | Every client starts at Phase 1. Need structured capture of briefing data (problem/objective, industry, existing assets) to feed Process 1 (Market Research). | Low | Simple form -> creates client record + initial briefing doc in Supabase. No complex wizard needed for v1. |
| T3 | **Phase state machine (sequential enforcement)** | The methodology is non-negotiable: no skipping phases. System must enforce Phase 1 -> Gate 1 -> Phase 2 -> Gate 2 -> ... -> Phase 5 -> Feedback Loop. | Medium | State machine per client. Each phase has sub-states for its processes (e.g., Phase 1 has Process 1, Process 2). Transitions gated by quality gate approval. |
| T4 | **Squad trigger buttons (Claude Code CLI execution)** | Core value prop. Operator clicks "Run Squad Estrategia for Client X" and the system spawns a Claude Code CLI session with the right prompt + client context. | High | Must pass client context (briefing, prior outputs) to CLI, capture stdout/structured output, handle timeouts and failures. This is the hardest integration. |
| T5 | **Process output storage (per client, per phase, per process)** | Each of the 16 processes produces a specific deliverable (Report, Document, Plan, etc.). Must be stored, versioned, and retrievable. | Medium | Supabase storage for files + structured data table for process outputs. Need clear hierarchy: Client > Phase > Process > Output versions. |
| T6 | **Quality gate checklists with AI pre-review** | 4 gates with explicit checklist items (defined in methodology). Claude evaluates outputs against checklist, flags issues. Operator approves/rejects. | Medium-High | Each gate has 5-6 checklist items. AI reviews all process outputs for that phase, scores each item pass/fail with reasoning. Operator sees summary + can override. |
| T7 | **Operator approval workflow** | Gates need approve/reject with optional notes. Reject must route back to specific failed process, not restart entire phase. | Low-Medium | Simple approve/reject UI per gate. Reject requires selecting which checklist items failed. System routes client back to relevant process. |
| T8 | **Document viewer / deliverable browser** | Operator needs to review AI-generated outputs before approving gates. Must be able to read reports, analysis docs, offer stacks, plans inline. | Medium | Markdown rendering for AI outputs. Organized by client > phase > process. Search within a client's documents. |
| T9 | **Bottleneck alerts** | With 15+ clients, some will get stuck. System must surface: clients stuck in a phase too long, failed gates awaiting re-run, pending approvals the operator forgot about. | Low-Medium | Time-based rules (e.g., >5 days in same phase = alert). Failed gate = immediate alert. Pending approval >24h = reminder. Dashboard badge counts. |
| T10 | **Basic client profile / context page** | Each client needs a landing page showing: current phase, all outputs to date, timeline of phase transitions, contact info, briefing data. | Low-Medium | Aggregation view. No complex CRM -- just enough context to understand where a client stands and what's been produced for them. |

---

## Differentiators

Features that make this system genuinely valuable beyond a Notion board + manual Claude sessions. These leverage the AI-native architecture for things no traditional tool does.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| D1 | **Intelligent context injection for squads** | When triggering a squad, the system automatically assembles the right context: prior phase outputs, client briefing, feedback loop data from Phase 5. Operator doesn't manually copy-paste. | High | This is the "magic." Must build a context assembly pipeline: gather all prior outputs for the client, format them as structured input for Claude CLI prompts. Different squads need different context slices. |
| D2 | **AI pre-review with reasoning chains** | Quality gate AI review doesn't just say pass/fail -- it shows WHY each checklist item passed or failed with specific references to the output. Operator can trust the review or dig in. | Medium-High | Structured output from Claude: for each checklist item, a verdict + evidence quote from the deliverable + confidence. Saves operator from reading every document end-to-end. |
| D3 | **Feedback loop automation (Phase 5 -> Phase 1)** | When Phase 5 CRM generates insights (NPS patterns, churn signals, CLV data), system automatically creates actionable notes that appear when the client re-enters Phase 1. No manual knowledge transfer. | Medium | Structured extraction from Phase 5 outputs. Store as "feedback notes" linked to client. Surface in Phase 1 context for returning clients. This closes the methodology's feedback loop digitally. |
| D4 | **Process-level progress tracking** | Not just "Client X is in Phase 2" but "Client X is in Phase 2, Process 4 (Grand Slam Offers) -- Process 3 (Positioning) completed 2 days ago." Granular visibility into the 16-step journey. | Medium | Requires tracking state at process level, not just phase level. Each process has: not started / in progress / completed / needs revision. |
| D5 | **Squad execution history + output diffing** | Track every squad execution: when it ran, what context was provided, what it produced. If a process is re-run (after gate rejection), show diff between v1 and v2 of outputs. | Medium-High | Execution log table. Version outputs (v1, v2, etc.). Diff view for markdown outputs. Invaluable for understanding what changed after a gate rejection + re-run. |
| D6 | **Smart dashboard with health scoring** | Beyond simple Kanban, compute a "health score" per client: factoring days-in-phase, gate pass rate, number of re-runs, velocity compared to other clients. Surface the clients that need attention NOW. | Medium | Algorithm combining: time-in-phase vs. average, number of gate failures, recency of last activity. Sort/filter dashboard by health score. Red/yellow/green visual indicators. |
| D7 | **One-click export packages** | Generate client-ready deliverable packages: compile all outputs from a phase (or all phases) into a branded PDF/doc bundle. Ready to send to the client. | Medium | PDF generation from markdown outputs. Template with agency branding. Table of contents. Phase-by-phase organization. Could use a library like react-pdf or puppeteer-based generation. |
| D8 | **Batch operations across clients** | "Run Squad Estrategia for all 4 clients in Phase 1" instead of triggering one at a time. Solo operator efficiency multiplier. | Medium | Queue system for batch CLI executions. Progress indicator showing which clients are processing. Error handling per-client (one failure doesn't block others). |
| D9 | **Gate analytics / methodology insights** | Over time, show patterns: "Gate 2 fails 40% of the time on the Pricing checklist item" or "Phase 3 takes 2x longer than average." Helps operator improve the methodology itself. | Low-Medium | Aggregate query on gate results + phase durations. Simple charts. Becomes valuable after 10+ clients have gone through the pipeline. |
| D10 | **Contextual process templates / prompts preview** | Before triggering a squad, show the operator exactly what prompt/context will be sent. Allow minor adjustments (e.g., "focus on B2B positioning" or "this client has unusual constraints"). | Medium | Display assembled prompt. Allow operator to append custom instructions. Store customizations for audit trail. Prevents "black box" feeling of AI execution. |

---

## Anti-Features

Features to explicitly NOT build. Each would add complexity without proportional value for a solo operator, or would violate the system's design principles.

| # | Anti-Feature | Why Avoid | What to Do Instead |
|---|--------------|-----------|-------------------|
| A1 | **Team collaboration / multi-user roles** | Solo operator. Adding auth roles, permissions, activity feeds, @mentions adds massive complexity for zero users. Out of scope per PROJECT.md. | Single-user auth (Supabase Auth). One login. No roles. |
| A2 | **Client-facing portal** | Clients don't need to log in and watch sausage being made. Adds security concerns, separate UI, notification systems. Out of scope per PROJECT.md. | Export packages (D7) shared manually via email/drive. |
| A3 | **Custom process builder / workflow editor** | The 5-phase/16-process structure IS the product. Making it customizable invites complexity, breaks the standardization principle, and means AI prompts can't be pre-optimized. | Hard-code the pipeline structure. If methodology evolves, update in code as a versioned change. |
| A4 | **Built-in chat / messaging** | Communication with clients happens on WhatsApp, email, calls -- not inside the agency OS. Building a messaging system solves no real problem. | Link to external communication (store a "last contacted" date if useful). |
| A5 | **Payment / billing / invoicing** | Financial management is a different domain with heavy compliance requirements. Out of scope per PROJECT.md. | Track client status only. Billing in external tools (Stripe, NF-e system, etc.). |
| A6 | **Real-time collaborative editing** | No one else is editing. Real-time sync (CRDT, WebSocket) is expensive to build for zero benefit in single-user mode. | Simple form-based editing with standard save. |
| A7 | **Drag-and-drop pipeline reordering** | Clients cannot be dragged between phases -- the state machine enforces sequential progression. Drag-and-drop Kanban suggests flexibility that doesn't exist. | Visual Kanban for display only. Phase transitions happen through gate approvals, never manual drag. |
| A8 | **Complex notification system (email, push, SMS)** | Solo operator is already in the app. In-app alerts are sufficient. Multi-channel notifications add infrastructure burden (email provider, push service). | In-app notification center + dashboard badge counts. Consider a single daily digest email later if needed. |
| A9 | **AI chat assistant / conversational UI** | The system uses AI for structured squad execution and gate review -- not for open-ended chat. A chat UI implies general-purpose AI that distracts from the methodology-driven approach. | Structured squad triggers with defined inputs/outputs. Preview prompt (D10) gives transparency without chat. |
| A10 | **Analytics dashboards with charts for clients** | Client-facing analytics isn't needed -- the operator needs internal operational metrics. Building chart-heavy dashboards for clients is scope creep. | Internal gate analytics (D9) for the operator. Client-facing insights go into export packages. |
| A11 | **Mobile native app** | Responsive web is sufficient per PROJECT.md constraints. Native app doubles development effort. | Responsive Next.js design. PWA installability if the operator wants a home screen icon. |
| A12 | **Third-party integrations marketplace** | Zapier/webhook/API integrations add surface area. Solo operator has a fixed workflow. | Direct Claude Code CLI integration is the only integration that matters. Add specific integrations (e.g., Google Drive export) only if validated need emerges. |

---

## Feature Dependencies

```
T2 (Client Intake) ─────────────────────────────────────────> T3 (Phase State Machine)
    Client must exist                                             State machine needs client record

T3 (Phase State Machine) ──────────────────────────────────> T4 (Squad Triggers)
    Must know which phase/process                                 to trigger the right squad

T4 (Squad Triggers) ───────────────────────────────────────> T5 (Output Storage)
    Squad produces outputs                                        that must be stored

T5 (Output Storage) ───────────────────────────────────────> T6 (Quality Gate AI Review)
    Gate review reads stored                                      process outputs

T6 (Quality Gate AI Review) ───────────────────────────────> T7 (Operator Approval)
    AI review feeds into                                          operator decision UI

T7 (Operator Approval) ───────────────────────────────────> T3 (Phase State Machine)
    Approval advances phase                                       or rejection routes back

T5 (Output Storage) ───────────────────────────────────────> T8 (Document Viewer)
    Can only view what's                                          been stored

T3 (Phase State Machine) + T9 (Alerts) ───────────────────> T1 (Kanban Board)
    Board displays state +                                        alert indicators

--- Differentiator Dependencies ---

T5 (Output Storage) ───────────────────────────────────────> D1 (Context Injection)
    Context assembly reads                                        from stored outputs

D1 (Context Injection) ───────────────────────────────────> T4 (Squad Triggers)
    Injected context flows                                        into squad execution

T6 (AI Review) ────────────────────────────────────────────> D2 (Reasoning Chains)
    Enhanced review builds                                        on base gate review

T5 + T3 ───────────────────────────────────────────────────> D3 (Feedback Loop)
    Needs Phase 5 outputs                                         + ability to link to Phase 1

T3 (State Machine) ───────────────────────────────────────> D4 (Process-level Tracking)
    Granular tracking extends                                     base phase tracking

T4 + T5 ───────────────────────────────────────────────────> D5 (Execution History)
    Logs executions and                                           versions outputs

T1 + T3 + T9 ─────────────────────────────────────────────> D6 (Health Scoring)
    Health score combines                                         pipeline + alert data

T5 + T8 ───────────────────────────────────────────────────> D7 (Export Packages)
    Exports compile stored                                        documents

T4 ────────────────────────────────────────────────────────> D8 (Batch Operations)
    Batch extends single                                          squad trigger capability

T6 + T7 ───────────────────────────────────────────────────> D9 (Gate Analytics)
    Analytics aggregate                                           historical gate results
```

### Critical Path (Build Order)

```
T2 -> T3 -> T5 -> T4 -> T6 -> T7 -> T8 -> T1 -> T9
 |                  |     |     |                  |
 |                  +-> D1 -> (enhances T4)        +-> D6
 |                  +-> D4                         
 |                  +-> D5
 +-> T10
```

The critical path is: **Client Intake -> State Machine -> Output Storage -> Squad Triggers -> Quality Gates -> Approval -> Document Viewer -> Kanban Dashboard -> Alerts**

---

## MVP Recommendation

### Phase 1: Foundation (Must ship first)

Prioritize these table stakes -- without them, the system literally cannot run a single client through a single phase:

1. **T2 - Client intake** (Low complexity) -- Entry point for everything
2. **T3 - Phase state machine** (Medium complexity) -- The backbone; enforces the methodology
3. **T5 - Process output storage** (Medium complexity) -- Where everything lives
4. **T10 - Client profile page** (Low-Medium complexity) -- Operator needs to see client context

### Phase 2: AI Core (The reason this system exists)

5. **T4 - Squad triggers via Claude Code CLI** (High complexity) -- The killer feature. Without this, it's just a fancy database UI.
6. **D1 - Intelligent context injection** (High complexity) -- Build alongside T4; they're inseparable. A squad trigger without proper context injection is useless.
7. **T8 - Document viewer** (Medium complexity) -- Operator must read what squads produce

### Phase 3: Quality Control (Closing the loop)

8. **T6 - Quality gate AI pre-review** (Medium-High complexity) -- Enables the operator to manage 15+ clients without reading every word
9. **T7 - Operator approval workflow** (Low-Medium complexity) -- Simple UI on top of T6
10. **D2 - AI reasoning chains for gates** (Medium-High complexity) -- Build into T6 from the start; retrofitting is painful

### Phase 4: Operational Dashboard (Scaling to 15+)

11. **T1 - Multi-client Kanban board** (Medium complexity) -- Now that data flows, visualize it
12. **T9 - Bottleneck alerts** (Low-Medium complexity) -- Prevent clients from falling through cracks
13. **D6 - Health scoring** (Medium complexity) -- Makes Kanban actionable, not just visual
14. **D4 - Process-level tracking** (Medium complexity) -- Granular visibility

### Phase 5: Optimization (Making it great)

15. **D3 - Feedback loop automation** (Medium complexity) -- Closes the methodology's most unique loop
16. **D7 - Export packages** (Medium complexity) -- Client communication
17. **D5 - Execution history + diffing** (Medium-High complexity) -- Audit trail and improvement
18. **D10 - Prompt preview / customization** (Medium complexity) -- Transparency and control

### Defer Indefinitely

- **D8 - Batch operations**: Nice optimization but not needed until operator workflow is proven
- **D9 - Gate analytics**: Needs 10+ clients through the full pipeline to be meaningful. Build after months of real usage data.

---

## Complexity Budget Reality Check

| Complexity Level | Features | Estimated Effort |
|-----------------|----------|-----------------|
| Low | T2, T10 | 1-2 days each |
| Low-Medium | T7, T9 | 2-3 days each |
| Medium | T1, T3, T5, T8, D3, D4, D7, D9, D10 | 3-5 days each |
| Medium-High | T6, D2, D5 | 5-8 days each |
| High | T4, D1, D6, D8 | 8-15 days each |

Total MVP (Phases 1-3): Roughly 6-8 weeks of focused development for a solo developer.
Total Full System (Phases 1-5): Roughly 12-16 weeks.

These are rough estimates assuming Next.js + Supabase proficiency and that Claude Code CLI integration patterns are already understood.

---

## Sources and Confidence Notes

- **Agency management platform features** (Monday.com, ClickUp, Teamwork, Productive.io, Function Point): MEDIUM confidence. Based on training data knowledge of these platforms' feature sets as of early 2025. Core features of established platforms are stable and unlikely to have changed significantly.
- **AI-powered project management features**: MEDIUM confidence. Based on training data knowledge of AI integration patterns in tools like Notion AI, ClickUp AI, Monday AI, and AI-native tools like Jasper and Lindy.ai. The AI landscape moves fast -- specific capabilities may have evolved.
- **Solo operator workflow patterns**: MEDIUM-HIGH confidence. Based on understanding of single-user optimization needs, which are well-documented in indie hacker and solopreneur communities.
- **Agency OS methodology mapping**: HIGH confidence. Directly derived from the project's own `docs/agency-os-prompt.md` -- the authoritative source for what this specific system needs.
- **Complexity estimates**: LOW-MEDIUM confidence. Depend heavily on developer experience, existing code patterns, and Claude Code CLI integration complexity, which has limited documentation in training data.

**Key gap:** Could not verify current (2026) state of AI-powered agency tools via web search. The differentiator analysis may underestimate what competitors now offer. Recommend validating D1-D10 against current market when web search is available.
