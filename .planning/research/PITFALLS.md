# Domain Pitfalls

**Domain:** AI-powered agency management system (Next.js + Supabase + Claude Code CLI)
**Researched:** 2026-04-08

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or system-level failures.

---

### Pitfall 1: Next.js Serverless Functions Cannot Spawn Long-Running CLI Processes

**What goes wrong:** The operator clicks "Run Squad Estrategia" in the dashboard. The app calls an API route that spawns `claude` CLI via `child_process.spawn()`. The serverless function times out after 10-60 seconds (Vercel) or the connection drops. The Claude session was running a complex 4-process Phase 1 analysis that takes 5-15 minutes. The process is orphaned -- no output is captured, Supabase is not updated, and the client shows as "running" forever.

**Why it happens:** Next.js API routes are designed for request-response cycles, not long-running background jobs. On Vercel, the hard timeout is 10s (Hobby) to 300s (Pro). Even self-hosted, HTTP connections drop. Developers assume "it works in local dev" means it will work in production. It will not.

**Consequences:**
- Squad sessions silently fail in production
- Client pipeline state becomes corrupted (stuck in "processing")
- Operator has no visibility into what is happening
- Orphaned Claude processes consume resources and API credits

**Prevention:**
1. **Never spawn Claude CLI directly from an API route.** Use a separate long-running process architecture:
   - Option A: Run a persistent Node.js worker process (via PM2, systemd, or Docker) that listens to a job queue. The Next.js app enqueues jobs; the worker dequeues and spawns Claude CLI.
   - Option B: Use Supabase Edge Functions with Deno for lightweight triggers, but still delegate to a persistent worker for the actual CLI execution.
   - Option C: If self-hosting on a VPS (not Vercel), use a BullMQ + Redis queue with a separate worker process.
2. **Implement a job status table** in Supabase: `squad_jobs(id, client_id, phase, squad, status, started_at, output, error, completed_at)`. The API route creates a job row, the worker updates it, the frontend polls or subscribes via Supabase Realtime.
3. **Add heartbeat monitoring.** The worker writes `last_heartbeat` to the job row every 30 seconds while Claude is running. If heartbeat stops, the dashboard shows "stalled" and the operator can retry.

**Detection:** Any test where you trigger a squad and wait more than 30 seconds for a response through the web UI.

**Phase to address:** Phase 1 (infrastructure setup). This is foundational -- everything else depends on reliable squad execution.

---

### Pitfall 2: Pipeline State Machine Corruption Under Concurrent Operations

**What goes wrong:** The operator has 15+ clients. They trigger Phase 2 for Client A, then immediately trigger Phase 1 for Client B, then approve Quality Gate 1 for Client C. A race condition occurs: Client A's phase transition writes overlap with Client C's gate approval. Or worse: the operator accidentally triggers a squad for a client that is already mid-processing, creating duplicate runs. The pipeline state becomes inconsistent -- a client shows Phase 3 but never passed Gate 2.

**Why it happens:** The 5-phase pipeline with 4 quality gates is a state machine, but developers often implement it as simple status fields (`current_phase: 3`) without enforcing state transition rules at the database level. Application-level checks are insufficient because concurrent requests can pass the same check simultaneously.

**Consequences:**
- Clients skip quality gates (defeats the entire Agency OS methodology)
- Duplicate squad runs waste Claude API credits
- Operator loses trust in the system and reverts to manual tracking
- Data integrity violations that are hard to detect and harder to repair

**Prevention:**
1. **Enforce state transitions in the database, not just the application.** Use a Supabase/PostgreSQL transition table:
   ```sql
   -- Valid transitions as a lookup table
   CREATE TABLE valid_transitions (
     from_state TEXT,
     to_state TEXT,
     requires_gate BOOLEAN,
     PRIMARY KEY (from_state, to_state)
   );
   
   -- Transition function with row-level locking
   CREATE OR REPLACE FUNCTION transition_client_phase(
     p_client_id UUID,
     p_from_state TEXT,
     p_to_state TEXT
   ) RETURNS BOOLEAN AS $$
   DECLARE
     current TEXT;
   BEGIN
     SELECT phase INTO current FROM clients WHERE id = p_client_id FOR UPDATE;
     IF current != p_from_state THEN RETURN FALSE; END IF;
     IF NOT EXISTS (SELECT 1 FROM valid_transitions WHERE from_state = p_from_state AND to_state = p_to_state) THEN
       RETURN FALSE;
     END IF;
     UPDATE clients SET phase = p_to_state WHERE id = p_client_id;
     RETURN TRUE;
   END;
   $$ LANGUAGE plpgsql;
   ```
2. **Add a `processing_lock` column** to the clients table. Before spawning a squad, set `processing_lock = TRUE` with a conditional update (`WHERE processing_lock = FALSE`). If the update affects 0 rows, the client is already being processed -- reject the request.
3. **Log every state transition** to an audit table (`phase_transitions(client_id, from_phase, to_phase, triggered_by, gate_result, timestamp)`). This creates an immutable history that lets you detect and repair corruption.
4. **Use optimistic locking** with a version column on the client row. Every update must include `WHERE version = expected_version`.

**Detection:** Any state where `current_phase > gates_passed + 1`. Run a daily integrity check query.

**Phase to address:** Phase 2 (pipeline engine). Must be correct from the start -- retrofitting state machine integrity is extremely painful.

---

### Pitfall 3: Claude Code CLI Output Parsing Breaks Silently

**What goes wrong:** The squad prompt asks Claude to produce a structured output (e.g., a JSON object with market research findings, or a markdown document with specific checklist items). Claude produces output that is 95% correct but includes an unexpected preamble ("Sure! Here's the analysis..."), uses a slightly different JSON key name, wraps the JSON in markdown code fences, or splits the output across multiple messages. The parser fails silently, stores a null or partial result, and the operator sees an empty deliverable.

**Why it happens:** LLM outputs are probabilistic. Even with strong prompts, Claude may:
- Add conversational preamble/postamble around structured data
- Use slightly different field names than expected
- Output valid but differently-formatted JSON (nested vs flat)
- Truncate output if the response is very long
- Include markdown formatting characters that break JSON parsing
- Return an error message or refusal instead of the expected output

Developers test with 5 examples during development and assume the pattern holds. In production with diverse client data, edge cases multiply rapidly.

**Consequences:**
- Deliverables silently lost -- operator thinks the squad ran but sees empty results
- Quality gates cannot evaluate incomplete data
- Months of accumulated silent failures before anyone notices the pattern
- Operator loses trust and starts manually checking every output

**Prevention:**
1. **Never parse LLM output with a rigid parser.** Use a multi-layer extraction strategy:
   - Layer 1: Try to extract JSON from code fences (```json ... ```)
   - Layer 2: Try to find JSON anywhere in the output (regex for `{...}` or `[...]`)
   - Layer 3: If no valid JSON, store the raw text and flag for manual review
2. **Use Claude's structured output capabilities.** When using the CLI with `--output-format json` or system prompts that enforce JSON-only responses, output is more reliable. But still validate.
3. **Define a schema and validate against it.** Use Zod or similar to define the expected output shape. If validation fails, store the raw output + the validation errors. Never discard output.
4. **Store raw output ALWAYS.** The parsed/structured version goes in one column; the raw CLI stdout goes in another. This lets you re-parse later when you improve the parser.
5. **Implement an output quality score.** For each expected field in the checklist, check if it is present in the output. Score = fields_present / fields_expected. Alert the operator if score < 0.8.
6. **Use `--print` or `--output-file` flags** in Claude Code CLI to capture output to a file rather than parsing stdout, which can be interleaved with status messages.

**Detection:** Compare `expected_fields_count` vs `actual_fields_count` for every squad output. Alert on any mismatch.

**Phase to address:** Phase 1 (infrastructure) for the storage/parsing layer; Phase 3 (squad integration) for prompt engineering and output schemas.

---

### Pitfall 4: Uncontrolled AI Costs Escalate Exponentially with Client Count

**What goes wrong:** With 15 clients, each going through 16 processes, each process requiring a Claude Code session that may involve multiple tool calls and long conversations, the monthly Claude API bill reaches thousands of dollars. The operator does not realize it until the invoice arrives because there is no cost tracking in the system. Worse: a retry loop (Pitfall 7) or a stuck squad session burns tokens continuously.

**Why it happens:** Claude Code CLI sessions are not simple one-shot API calls. A single squad session may involve:
- A system prompt (large -- the agency-os-prompt.md is 460+ lines)
- Multiple turns of internal reasoning
- Tool calls (file reading, web search) that add context
- Long client-specific context (briefings, previous phase outputs)

Multiply this by 16 processes x 15 clients x retries = hundreds of sessions per month. Each session may consume 50K-200K tokens. At Claude's pricing, this adds up fast.

**Consequences:**
- Monthly costs that exceed the revenue from client work
- No ability to predict or budget for AI costs
- Forced to reduce quality (shorter prompts, fewer retries) to control costs
- Business model becomes unviable

**Prevention:**
1. **Track token usage per squad session.** Claude Code CLI outputs usage statistics. Capture and store them: `token_usage(job_id, client_id, phase, process, input_tokens, output_tokens, estimated_cost, timestamp)`.
2. **Set per-client and per-phase cost budgets.** Before spawning a squad, check cumulative spend. If approaching budget, alert the operator instead of auto-running.
3. **Use `--max-turns` flag** in Claude Code CLI to limit conversation length. A Phase 1 market research session should not exceed 20 turns. Set hard limits per process type.
4. **Minimize context window bloat.** Do not pass the entire 460-line agency-os-prompt.md to every session. Create per-squad, per-process prompt slices that include only the relevant section. A Phase 1 Process 1 session needs only the Phase 1 section, not Phases 2-5.
5. **Implement cost dashboard.** Show daily/weekly/monthly spend with per-client breakdown. This is not optional -- it is a core feature for business viability.
6. **Cache reusable outputs.** If a client's briefing has not changed, do not re-run Phase 1 Process 1. Store checksums of inputs and skip re-execution when inputs are identical.
7. **Use tiered model selection.** Not every process needs the most expensive model. Market research (Process 1) may need Opus; checklist validation may be fine with Sonnet or Haiku.

**Detection:** Add a cost estimate to the job creation step. If estimated cost > threshold, require explicit operator confirmation.

**Phase to address:** Phase 1 (infrastructure) for tracking; Phase 2 (pipeline engine) for budget enforcement; Phase 3 (squad integration) for prompt optimization.

---

### Pitfall 5: Supabase Realtime Subscriptions Leak and Dashboard Becomes Unresponsive

**What goes wrong:** The Kanban dashboard subscribes to Supabase Realtime for live updates on all 15+ clients. Each client card subscribes to its own channel for status updates. As the operator navigates between views, old subscriptions are not cleaned up. After a few hours of use, the browser has 50+ active WebSocket subscriptions, memory usage climbs, and the dashboard becomes sluggish or crashes. On mobile (responsive), this is even worse.

**Why it happens:** React component lifecycle and Supabase Realtime subscriptions are easy to mismanage. Common mistakes:
- Not unsubscribing in `useEffect` cleanup
- Subscribing on every re-render
- Creating a new subscription per list item instead of one subscription for the entire table
- Not handling reconnection after network interruptions

**Consequences:**
- Dashboard becomes unusable after extended use
- Operator has to refresh the page constantly
- Missed real-time updates lead to stale state display
- Memory leaks crash the browser tab

**Prevention:**
1. **One subscription for the entire clients table, not per client.** Subscribe to `postgres_changes` on the `clients` table with a single channel. Filter and distribute updates in the application layer.
2. **Strict cleanup in useEffect.** Every `supabase.channel().subscribe()` must have a corresponding `supabase.removeChannel()` in the cleanup function.
3. **Use a centralized subscription manager.** Create a singleton `RealtimeManager` class that manages all subscriptions, prevents duplicates, and handles reconnection. Components request updates from this manager, not from Supabase directly.
4. **Implement connection health monitoring.** Show a "Live" / "Reconnecting" / "Offline" indicator in the dashboard. If the connection drops, show stale data warning.
5. **Add a manual refresh button** as a fallback. Realtime is a convenience, not a requirement. The dashboard should work correctly with polling alone.

**Detection:** Monitor `supabase.getChannels().length` in development. If it exceeds the expected count (should be 2-3 max), you have a leak.

**Phase to address:** Phase 2 (dashboard). Get this right from the first dashboard implementation.

---

## Moderate Pitfalls

Mistakes that cause significant rework or degraded user experience.

---

### Pitfall 6: Quality Gate AI Pre-Review Becomes a Rubber Stamp

**What goes wrong:** The AI pre-review for quality gates is supposed to evaluate squad outputs against the checklist (e.g., "Persona principal definida com dados, nao achismo?"). But the AI that produced the output is also the AI reviewing it. It naturally considers its own output satisfactory. Every quality gate passes. The operator, seeing 100% pass rates, stops reviewing carefully. Quality degrades to whatever Claude happens to produce.

**Why it happens:** Self-evaluation is a known weakness of LLMs. The same model will rate its own output more favorably than a human would. Additionally, the quality gate checklists are subjective ("dados, nao achismo" -- what counts as "data" vs "guessing"?) and the AI lacks the domain expertise to distinguish.

**Consequences:**
- Quality gates lose their purpose -- the core value proposition of the Agency OS methodology
- Clients receive mediocre deliverables that passed automated review
- Operator stops trusting the system and reverts to manual review of everything (defeating the purpose)
- The "15+ clients at agency quality" claim becomes "15+ clients at AI-generated quality"

**Prevention:**
1. **Use a different model or a different prompting strategy for review than for generation.** If Squad Estrategia uses Opus for generation, use Sonnet with an adversarial prompt for review. The review prompt should be: "Your job is to find weaknesses. List every item that could be stronger. Score ruthlessly."
2. **Implement scoring, not pass/fail.** Each checklist item gets a 1-5 score with justification. The operator sees the distribution and focuses attention on low-scoring items.
3. **Require specific evidence.** The review must cite which parts of the output satisfy each checklist item. "Checklist item: Persona with data --> Found in section 2.3: demographic data from IBGE cited" vs "Checklist item: Persona with data --> Yes, persona is data-driven" (too vague).
4. **Track review accuracy over time.** When the operator overrides an AI review (rejects something the AI approved, or approves something flagged), log it. Use this to calibrate the review prompt.
5. **Show the operator a "confidence heatmap"** per gate: green = high confidence pass, yellow = borderline, red = likely fail. Never show just "PASSED."

**Detection:** If pass rate exceeds 90% across all clients for more than a month, the review is too lenient.

**Phase to address:** Phase 3 (quality gates implementation).

---

### Pitfall 7: No Retry/Recovery Strategy for Failed Squad Sessions

**What goes wrong:** A Claude Code CLI session fails midway through a process. Possible causes: network interruption, Claude rate limit, CLI crash, OOM, or the model refuses a request. The job is marked as "failed" but there is no mechanism to retry. The operator must manually re-trigger the entire squad from scratch, losing all progress from the partial run. With 15+ clients, failed sessions accumulate and the operator spends hours on manual recovery.

**Why it happens:** Developers build the happy path first. CLI process management (monitoring, timeout, retry, partial recovery) is infrastructure work that feels boring compared to building features. It gets deferred and then never built.

**Consequences:**
- Operator becomes a babysitter for failed processes
- Partial outputs are lost, wasting the tokens already consumed
- Clients get stuck in the pipeline with no automatic recovery
- Operator frustration leads to abandoning the system

**Prevention:**
1. **Implement job states with explicit failure handling:**
   - `queued` -> `running` -> `completed` | `failed` | `timed_out` | `cancelled`
   - Failed jobs automatically re-queue up to 3 times with exponential backoff
   - After 3 failures, mark as `requires_attention` and alert the operator
2. **Save intermediate outputs.** If a squad session produces output for Process 1 and 2 but fails on Process 3, save the outputs from 1 and 2. On retry, pass them as context so Claude does not redo them.
3. **Implement process-level granularity, not phase-level.** A Phase 1 squad should not be "all or nothing" for Processes 1-2. Run each process as a separate job that can fail and retry independently.
4. **Set timeouts per process type.** Process 1 (market research) might need 10 minutes; Process 6 (branding) might need 5 minutes. A process that exceeds 2x its expected duration is likely stuck.
5. **Add a "retry" button per process** in the dashboard, not just per phase.

**Detection:** Track `failure_rate` per process type. If any process fails more than 20% of the time, the prompt or configuration needs adjustment.

**Phase to address:** Phase 2 (pipeline engine) for job infrastructure; Phase 3 (squad integration) for process-level granularity.

---

### Pitfall 8: Storing Deliverables as Unstructured Blobs Prevents Quality Gates and Feedback Loops

**What goes wrong:** Squad outputs (market research reports, positioning documents, offer stacks) are stored as raw text or markdown blobs in a single `output` column. When Quality Gate 2 needs to check "Posicionamento usa atributos factuais?", the system must re-parse the entire blob to find the positioning section. When Phase 5's feedback loop needs to send NPS insights back to Phase 1, it must somehow extract the relevant data from the Phase 5 blob. Both operations are fragile and unreliable.

**Why it happens:** It is easy to store the raw Claude output as-is. Defining a structured schema for each of the 16 processes feels like over-engineering during initial development. But the Agency OS methodology explicitly requires cross-phase data flow (feedback loops) and structured evaluation (quality gates), both of which need structured data.

**Consequences:**
- Quality gates cannot reliably evaluate specific checklist items
- Feedback loop from Phase 5 to Phase 1 is impossible to automate
- Export/PDF generation produces inconsistent documents
- Searching across client deliverables is impossible
- Future enhancements (analytics, benchmarking) are blocked

**Prevention:**
1. **Define a JSON schema for each of the 16 processes.** Each process output has known fields from the Agency OS methodology (already documented in the prompt). For example, Process 4 (Grand Slam Offers):
   ```typescript
   interface GrandSlamOfferOutput {
     dream_outcome: string;
     obstacles: Array<{ obstacle: string; solution: string }>;
     offer_stack: Array<{ item: string; value_rating: 'high' | 'medium' | 'low'; cost_rating: 'high' | 'medium' | 'low' }>;
     value_equation: { dream: number; probability: number; time: number; effort: number };
     scarcity_elements: string[];
     urgency_elements: string[];
     bonuses: string[];
     guarantee: string;
   }
   ```
2. **Store both structured and raw.** `process_outputs(id, client_id, process_id, structured_data JSONB, raw_output TEXT, parsed_at, parse_score)`. Never discard the raw output, but always attempt to structure it.
3. **Validate at write time.** When storing a squad output, validate against the schema. If validation fails, store as raw with `parse_score = 0` and flag for operator review.
4. **Use the structured data for quality gates.** The gate evaluation prompt receives the structured data, not the raw blob. This makes evaluation more reliable and cheaper (less tokens).

**Detection:** If more than 10% of outputs have `parse_score < 0.8`, the output schemas or squad prompts need adjustment.

**Phase to address:** Phase 1 (data model design). Retrofitting structured schemas onto unstructured data is one of the most painful migrations.

---

### Pitfall 9: Operator Dashboard Optimized for Overview, Not for Action

**What goes wrong:** The Kanban board shows all 15+ clients across 5 phases -- visually clean. But the operator's actual workflow is: "What do I need to do RIGHT NOW?" The Kanban does not answer this. The operator must mentally scan all cards, remember which ones have pending approvals, check which squads finished, and figure out the priority order. With 15+ clients, this mental overhead defeats the purpose of the system.

**Why it happens:** Developers build dashboards that display state. Operators need dashboards that drive action. The Kanban pattern is good for overview but bad for task management when one person manages everything.

**Consequences:**
- Operator misses pending approvals, blocking client progress
- Mental overhead increases with client count instead of staying flat
- Critical alerts (failed jobs, stuck clients) get lost in the visual noise
- The "one person manages 15+" promise breaks down at scale

**Prevention:**
1. **Build an action queue, not just a Kanban.** The primary view should be a prioritized list:
   - "Client X: Quality Gate 2 needs your approval" (blocker -- highest priority)
   - "Client Y: Squad Growth completed Phase 4 -- review outputs" (action needed)
   - "Client Z: Stuck in Phase 2 for 14 days -- attention needed" (alert)
   - "Client W: Phase 1 running -- estimated 8 min remaining" (informational)
2. **The Kanban is the secondary view.** It provides context, not workflow.
3. **Add "time in phase" tracking.** If a client has been in Phase 2 for 3x the average, automatically escalate visibility.
4. **Notification badges.** Show unread/pending counts: "3 gates pending, 1 failed job, 2 completed reviews."
5. **One-click actions.** From the action queue, the operator can approve a gate, retry a failed job, or view outputs without navigating to the client detail page.

**Detection:** If the operator consistently has pending approvals older than 24 hours, the dashboard is not surfacing actions effectively.

**Phase to address:** Phase 2 (dashboard design). Design the action queue as the primary interface from the start.

---

### Pitfall 10: Claude Code CLI Version/Configuration Drift

**What goes wrong:** Claude Code CLI gets updated (auto-update or manual). The new version changes output format, deprecates a flag, changes default behavior, or introduces a breaking change in how `--print` mode works. All 15+ client sessions start producing unexpected output. Or: the CLI configuration (model selection, allowed tools, permissions) is set globally on the operator's machine but not version-controlled. A system reinstall or migration loses the configuration, and squads start behaving differently.

**Why it happens:** Claude Code CLI is actively developed and updates frequently. Unlike a pinned npm dependency, CLI tools often auto-update. Configuration lives in `~/.claude/` and is not part of the project repository.

**Consequences:**
- Silent output format changes break all parsing
- Model changes affect output quality and cost unpredictably
- Configuration loss requires manual reconstruction
- No way to roll back to a working configuration

**Prevention:**
1. **Pin the Claude Code CLI version.** Document the exact version in the project. Use a version check before spawning sessions: if the installed version does not match the expected version, alert the operator.
2. **Version-control CLI configuration.** Store the project-level `.claude/settings.json` and relevant CLAUDE.md files in the repository. Use `--profile` or project-level settings rather than global configuration.
3. **Wrap CLI invocation in an abstraction layer.** Never call `claude` directly from the worker. Call it through a wrapper function that:
   - Validates the CLI version
   - Sets explicit flags (model, output format, max turns)
   - Captures and normalizes output
   - Handles version-specific quirks
4. **Test output parsing against real CLI output regularly.** Store sample outputs from the current CLI version and run parsing tests against them. When the CLI updates, re-capture samples and verify.

**Detection:** Automated test that spawns a minimal Claude session and validates output format. Run daily or on deployment.

**Phase to address:** Phase 1 (infrastructure). The CLI wrapper is part of the foundation.

---

## Minor Pitfalls

Mistakes that cause friction or technical debt.

---

### Pitfall 11: Feedback Loop (Phase 5 to Phase 1) is Designed but Never Implemented

**What goes wrong:** The Agency OS methodology explicitly requires Phase 5 (Retention) insights to feed back into Phase 1 (Diagnostic) for returning clients. This is documented, everyone agrees it is important, but it is always deprioritized because no client reaches Phase 5 for months. When clients finally do reach Phase 5, the feedback mechanism does not exist, and retrofitting it requires changes to the Phase 1 data model.

**Prevention:** Design the Phase 1 data model from the start to accept "previous cycle" data. Even if the feedback loop is not built in v1, the schema should have a `previous_cycle_insights` field on the client record. This costs nothing upfront and prevents a schema migration later.

**Phase to address:** Phase 1 (data model) -- schema only, not the full feature.

---

### Pitfall 12: Export/PDF Generation as an Afterthought

**What goes wrong:** The system stores deliverables beautifully in Supabase, but when the operator needs to share something with a client, they must manually copy-paste from the app into a document. PDF export is deferred to "later" and when implemented, it produces ugly documents because the data was not structured with export in mind.

**Prevention:** Define the export template for each process output during schema design. The structured output schema (Pitfall 8) should map directly to a document template. Use a library like `@react-pdf/renderer` or `puppeteer` for HTML-to-PDF. Design the schema with export sections in mind.

**Phase to address:** Phase 3 (export feature). But the schema design in Phase 1 must account for it.

---

### Pitfall 13: Portuguese/English Language Mixing in Code and Data

**What goes wrong:** The Agency OS methodology is in Portuguese (Diagnostico, Engenharia de Valor, Tracao e Vendas). The codebase, libraries, and Claude Code CLI prompts are in English. Developers inconsistently mix languages -- some database columns are Portuguese (`fase_atual`), some are English (`current_phase`), some prompts are bilingual. This creates confusion, makes code harder to maintain, and causes bugs when a Portuguese status value does not match an English enum.

**Prevention:** Pick one language for code and data, another for UI display. Recommendation:
- **Code, database columns, enums, API:** English always (`phase_diagnostic`, `quality_gate_1`)
- **UI labels, squad prompts, deliverable content:** Portuguese (matches the methodology and client-facing content)
- **Create a translation mapping** as a constant: `PHASE_LABELS = { diagnostic: 'Diagnostico', value_engineering: 'Engenharia de Valor', ... }`

**Phase to address:** Phase 1 (project setup). Establish the convention before any code is written.

---

### Pitfall 14: Supabase Row-Level Security (RLS) Neglected Because "Solo Operator"

**What goes wrong:** Since it is a solo operator system, developers skip RLS policies entirely. All tables are accessible without authentication checks. Then: the Next.js app exposes a Supabase client-side key in the browser bundle. Anyone who finds this key can read/modify all client data. Or: a future feature (client-facing exports, team member access) requires RLS and it must be retrofitted across all tables.

**Prevention:** Enable RLS from day one, even for a solo operator. It is easier to set up permissive policies now (`authenticated` user can do everything) than to add RLS to 20+ tables later. Takes 30 minutes during setup, saves days later.

**Phase to address:** Phase 1 (Supabase setup).

---

### Pitfall 15: Squad Prompts Hardcoded in Source Instead of Managed as Data

**What goes wrong:** The squad prompts (the detailed process instructions from agency-os-prompt.md) are embedded as string constants in the worker code. When the operator wants to refine a prompt based on quality gate feedback, they must modify source code, rebuild, and redeploy. This discourages prompt iteration, which is the single most impactful way to improve output quality.

**Prevention:** Store squad prompts in Supabase as versioned records: `squad_prompts(id, squad, process_id, version, prompt_text, is_active, created_at)`. The worker fetches the active prompt at execution time. The operator can edit prompts through an admin UI without touching code. Keep a version history so you can roll back bad prompts.

**Phase to address:** Phase 2 (pipeline engine) for the prompt storage; Phase 3 (squad integration) for the admin UI.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Infrastructure/Foundation | Long-running process architecture (Pitfall 1) | Build job queue + worker from day one. Do not use API routes for squad execution. |
| Infrastructure/Foundation | Data model does not support structured outputs (Pitfall 8) | Define JSON schemas for all 16 processes before writing any code. |
| Infrastructure/Foundation | CLI version drift (Pitfall 10) | Create a CLI wrapper abstraction immediately. |
| Infrastructure/Foundation | No RLS (Pitfall 14) | Enable RLS during Supabase project setup. |
| Infrastructure/Foundation | Language mixing (Pitfall 13) | Establish naming convention in project setup. |
| Pipeline Engine | State machine corruption (Pitfall 2) | Use database-level enforcement with row locking. |
| Pipeline Engine | No retry/recovery (Pitfall 7) | Build job states and retry logic into the queue. |
| Pipeline Engine | Prompts hardcoded (Pitfall 15) | Store prompts as versioned data, not code constants. |
| Dashboard | Subscription leaks (Pitfall 5) | Centralized subscription manager, single table subscription. |
| Dashboard | Overview not action-oriented (Pitfall 9) | Build action queue as primary view, Kanban as secondary. |
| Squad Integration | Output parsing fragility (Pitfall 3) | Multi-layer extraction, always store raw, validate against schema. |
| Squad Integration | Cost explosion (Pitfall 4) | Track tokens per session, set budgets, optimize prompts. |
| Quality Gates | Rubber stamp AI review (Pitfall 6) | Different model for review, scoring not pass/fail, evidence required. |
| Feedback Loop | Phase 5-to-1 never built (Pitfall 11) | Design schema for it in Phase 1, even if feature is deferred. |
| Export | PDF as afterthought (Pitfall 12) | Export-aware schema design from the start. |

---

## Sources

- Direct analysis of the Agency OS methodology document (`docs/agency-os-prompt.md`)
- PROJECT.md system requirements and constraints
- Domain knowledge: Next.js serverless limitations, Supabase Realtime subscription management, Claude Code CLI behavior, LLM output parsing patterns, state machine design in PostgreSQL
- Confidence: MEDIUM-HIGH (based on deep familiarity with all constituent technologies; web search was unavailable to verify the most recent Claude Code CLI changes, so Pitfall 10 recommendations may need updating against current CLI documentation)
