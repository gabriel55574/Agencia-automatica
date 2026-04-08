# Architecture Patterns

**Domain:** AI-powered agency management system (Next.js + Supabase + Claude Code CLI)
**Researched:** 2026-04-08
**Confidence:** MEDIUM (training data for established patterns; no live verification of latest Supabase/Next.js docs)

## System Overview

Agency OS is a **three-tier architecture** with a clear separation: a Next.js web application for UI and API, Supabase as the data/realtime backbone, and Claude Code CLI processes as the AI execution engine. The critical architectural challenge is bridging a web application with long-running CLI processes that can take minutes to complete.

```
+------------------------------------------------------------------+
|                        OPERATOR BROWSER                          |
|  Dashboard  |  Client Detail  |  Phase View  |  Quality Gate    |
+------------------------------------------------------------------+
        |  HTTP / WebSocket (Supabase Realtime)
        v
+------------------------------------------------------------------+
|                    NEXT.JS APPLICATION                           |
|  App Router (RSC)  |  API Routes  |  Server Actions              |
|  +-------------------+  +----------------------------+           |
|  | UI Layer (React)  |  | Orchestration API Layer    |           |
|  | - Dashboard page  |  | - /api/squad/trigger       |           |
|  | - Client pages    |  | - /api/gate/evaluate       |           |
|  | - Phase views     |  | - /api/client/[id]         |           |
|  | - Gate reviews    |  | - /api/pipeline/advance    |           |
|  +-------------------+  +----------------------------+           |
+------------------------------------------------------------------+
        |  SQL / REST / Realtime          |  child_process.spawn()
        v                                 v
+---------------------------+   +---------------------------+
|       SUPABASE            |   |   CLI ORCHESTRATOR        |
| - PostgreSQL (data)       |   | - Job Queue (DB-backed)   |
| - Auth (operator login)   |   | - Process Manager         |
| - Storage (deliverables)  |   | - Output Parser           |
| - Realtime (status push)  |   | - Claude Code CLI spawn   |
| - Edge Functions (opt.)   |   +---------------------------+
+---------------------------+              |
                                           v
                              +---------------------------+
                              |   CLAUDE CODE CLI         |
                              | - Squad prompts injected  |
                              | - Client context piped    |
                              | - Structured output       |
                              +---------------------------+
```

## Component Boundaries

### Component 1: Web Application (Next.js App Router)

| Aspect | Detail |
|--------|--------|
| **Responsibility** | UI rendering, API endpoints, server actions, authentication middleware |
| **Technology** | Next.js 14+ App Router, React Server Components, Server Actions |
| **Communicates with** | Supabase (data/auth/storage), CLI Orchestrator (spawn jobs) |
| **Deployment** | Self-hosted (required -- Vercel/Cloudflare cannot spawn CLI processes) |
| **Boundary rule** | No business logic about marketing processes lives here. This layer only knows "trigger phase X for client Y" and "display results." |

**Key sub-components:**

1. **Dashboard Pages** (`/app/(dashboard)/`): Multi-client Kanban board, alert panels, overview stats. Uses React Server Components for initial load, Supabase Realtime for live updates.

2. **Client Detail Pages** (`/app/clients/[clientId]/`): Per-client phase progression, deliverable viewer, history timeline.

3. **Phase Execution Pages** (`/app/clients/[clientId]/phases/[phaseId]/`): Squad trigger buttons, execution progress, output preview.

4. **Quality Gate Pages** (`/app/clients/[clientId]/gates/[gateId]/`): AI pre-review results, checklist display, approve/reject controls.

5. **API Routes** (`/app/api/`): REST endpoints for squad triggers, gate evaluations, pipeline state transitions. These are the bridge to the CLI Orchestrator.

### Component 2: Database Layer (Supabase PostgreSQL)

| Aspect | Detail |
|--------|--------|
| **Responsibility** | All persistent state: clients, phases, process outputs, gate results, job queue |
| **Technology** | PostgreSQL via Supabase, Row Level Security, Database Functions |
| **Communicates with** | Next.js (via Supabase client), CLI Orchestrator (direct DB writes for job status) |
| **Boundary rule** | The database is the single source of truth for pipeline state. Phase transitions are enforced at the DB level via constraints and triggers, not application code. |

**Core schema design:**

```sql
-- Clients
clients (id, name, briefing, current_phase, current_status, created_at, updated_at)

-- Pipeline state machine
phases (id, client_id, phase_number, status, started_at, completed_at)
  -- status: pending | active | completed | failed
  -- constraint: phase N cannot be 'active' unless phase N-1 is 'completed'

-- Process execution records
processes (id, phase_id, process_number, status, squad, input_snapshot, output_json, output_markdown, started_at, completed_at)

-- Quality gates
quality_gates (id, phase_id, gate_number, ai_review_json, checklist_results, operator_decision, operator_notes, reviewed_at)
  -- operator_decision: pending | approved | rejected

-- Job queue for CLI orchestration
squad_jobs (id, client_id, phase_id, process_numbers, squad_type, status, cli_pid, progress_log, error_log, created_at, started_at, completed_at)
  -- status: queued | running | completed | failed | cancelled

-- Deliverables / documents
deliverables (id, process_id, client_id, file_type, storage_path, metadata, created_at)

-- Notifications / alerts
alerts (id, client_id, alert_type, message, is_read, created_at)
```

**Why DB-level enforcement:** With 15+ clients, the operator will sometimes trigger actions in quick succession. Race conditions between "approve gate" and "start next phase" must be impossible. PostgreSQL constraints and triggers enforce the state machine, not JavaScript.

### Component 3: CLI Orchestrator

| Aspect | Detail |
|--------|--------|
| **Responsibility** | Manage the lifecycle of Claude Code CLI processes: queue, spawn, monitor, capture output, parse results |
| **Technology** | Node.js `child_process.spawn()`, running in the same Node.js process as Next.js |
| **Communicates with** | Supabase (reads job queue, writes status/output), Claude Code CLI (spawns processes), File system (temp files for prompts/context) |
| **Boundary rule** | This component does NOT understand marketing processes. It knows how to: take a job definition, assemble a CLI command with prompt + context, spawn it, stream output, parse the result, and write it back. |

**This is the most architecturally critical component.** It must handle:

1. **Job queuing** -- Only one Claude Code CLI process should run at a time per machine (to avoid resource contention and API rate limits). Jobs are queued in the `squad_jobs` table and processed FIFO.

2. **Process lifecycle** -- spawn, monitor stdout/stderr, detect completion/failure, parse structured output.

3. **Progress streaming** -- Write incremental progress to the database so the UI can show real-time status via Supabase Realtime.

4. **Graceful failure** -- If a CLI process crashes, the job is marked `failed` with error logs. The operator can retry.

5. **Cancellation** -- The operator can cancel a running job. The orchestrator sends SIGTERM to the child process.

### Component 4: File Storage (Supabase Storage)

| Aspect | Detail |
|--------|--------|
| **Responsibility** | Store deliverables, exported documents, generated reports per client per phase |
| **Technology** | Supabase Storage (S3-compatible) |
| **Communicates with** | Next.js (upload/download via API), CLI Orchestrator (writes generated files) |
| **Boundary rule** | Files are organized by client and phase. Metadata lives in PostgreSQL; binary content lives in Storage. |

**Bucket structure:**
```
deliverables/
  {client_id}/
    phase-1/
      processo-1-insights.md
      processo-2-segmentacao.md
    phase-2/
      processo-3-posicionamento.md
      processo-4-offer-stack.md
      ...
    exports/
      relatorio-completo.pdf
```

### Component 5: Realtime Layer (Supabase Realtime)

| Aspect | Detail |
|--------|--------|
| **Responsibility** | Push live updates to the operator's browser: job progress, phase transitions, new alerts |
| **Technology** | Supabase Realtime (Postgres Changes channel) |
| **Communicates with** | Browser (WebSocket), PostgreSQL (listens to table changes) |
| **Boundary rule** | Realtime is read-only from the client perspective. All mutations go through API routes or Server Actions. |

**Subscriptions needed:**

| Table | Events | UI Update |
|-------|--------|-----------|
| `squad_jobs` | UPDATE (status, progress_log) | Job progress bar, status badges |
| `phases` | UPDATE (status) | Kanban card moves between columns |
| `quality_gates` | INSERT, UPDATE | Gate review notifications |
| `alerts` | INSERT | Toast notifications, alert badge count |
| `clients` | UPDATE (current_phase, current_status) | Dashboard overview refresh |

## Data Flow

### Flow 1: Client Intake to Phase 1 Start

```
Operator fills intake form
  -> Server Action: insert into `clients` + `phases` (phase 1 = active)
  -> Dashboard updates via Realtime (new card appears in Phase 1 column)
  -> Operator clicks "Run Diagnostico" button
  -> API Route: insert into `squad_jobs` (squad=estrategia, processes=[1,2])
  -> CLI Orchestrator picks up job from queue
  -> Spawns: claude --prompt squad-estrategia.md --context client-briefing.json
  -> Progress streams to `squad_jobs.progress_log`
  -> UI shows progress via Realtime subscription
  -> CLI completes -> output parsed -> stored in `processes` + `deliverables`
  -> Job marked completed
```

### Flow 2: Quality Gate Evaluation

```
All processes in phase completed
  -> System auto-triggers gate evaluation OR operator clicks "Evaluate Gate"
  -> API Route: spawns Claude Code CLI with gate prompt + all process outputs
  -> Claude reviews outputs against checklist
  -> Result stored in `quality_gates` (ai_review_json with pass/fail per item)
  -> Operator reviews AI assessment in Gate UI
  -> Operator clicks Approve or Reject
  -> If Approved: Server Action advances client to next phase
     - Update `phases` (current = completed, next = active)
     - Update `clients` (current_phase incremented)
  -> If Rejected: Server Action marks specific processes for rework
     - Insert note in `quality_gates.operator_notes`
     - Flag processes needing rework
```

### Flow 3: Phase Execution (Detailed)

```
                  +---> [squad_jobs] queued
                  |
[Operator Click] -+
                  |
                  +---> UI shows "Queued..." badge

[CLI Orchestrator polling loop detects new job]
  |
  +---> Update squad_jobs.status = 'running'
  |     (Realtime pushes update -> UI shows "Running...")
  |
  +---> Assemble CLI command:
  |     1. Load squad prompt template from /prompts/{squad}.md
  |     2. Load client context from DB (briefing + prior phase outputs)
  |     3. Write temp context file to /tmp/agency-os/{jobId}/context.json
  |     4. Spawn: claude --print --prompt /prompts/squad-estrategia.md
  |              with context piped via stdin or --context flag
  |
  +---> Stream stdout chunks -> append to squad_jobs.progress_log
  |     (Realtime pushes updates -> UI shows live output)
  |
  +---> On process exit:
        - Exit 0: Parse structured output, store in `processes`, move files to Storage
        - Exit != 0: Mark job as failed, store stderr in error_log
        (Realtime pushes final status -> UI updates)
```

### Flow 4: Feedback Loop (Phase 5 -> Phase 1)

```
Phase 5 (CRM) completes for a client
  -> Operator reviews results, approves Gate 4
  -> System generates feedback summary:
     - NPS insights
     - Churn patterns
     - CLV by segment
     - Promoter feedback themes
  -> Feedback stored in `deliverables` under phase-5/feedback-loop.json
  -> If client is returning:
     - New pipeline instance created (same client, fresh phases)
     - Phase 1 auto-populated with feedback data as additional context
     - Squad Estrategia gets both original briefing + Phase 5 feedback
```

## Architecture Patterns to Follow

### Pattern 1: Database-Backed Job Queue (not Redis, not Bull)

**What:** Use the `squad_jobs` PostgreSQL table as the job queue. The CLI Orchestrator polls this table every 2-3 seconds for new jobs.

**Why this over Redis/Bull/BullMQ:** 
- One fewer infrastructure dependency (Supabase already provides PostgreSQL)
- Job state is automatically persistent and queryable
- Supabase Realtime can push job status changes to the UI for free
- At 15 clients with sequential processing, throughput needs are minimal (~20 jobs/day max)
- PostgreSQL advisory locks prevent double-processing

**Implementation:**
```typescript
// CLI Orchestrator - simplified polling loop
async function processJobQueue() {
  while (true) {
    // Atomic claim: SELECT ... FOR UPDATE SKIP LOCKED
    const job = await supabase.rpc('claim_next_job');
    
    if (job) {
      await executeJob(job);
    }
    
    await sleep(2000); // Poll every 2 seconds
  }
}

// Database function for atomic job claiming
// claim_next_job():
//   UPDATE squad_jobs 
//   SET status = 'running', started_at = now()
//   WHERE id = (
//     SELECT id FROM squad_jobs 
//     WHERE status = 'queued' 
//     ORDER BY created_at 
//     LIMIT 1 
//     FOR UPDATE SKIP LOCKED
//   )
//   RETURNING *;
```

### Pattern 2: Spawn CLI as Child Process with Output Streaming

**What:** Use Node.js `child_process.spawn()` to run Claude Code CLI, streaming stdout to the database in chunks.

**Why spawn over exec:** `exec` buffers the entire output in memory. `spawn` streams it, which matters for long-running squad sessions that can produce substantial output.

**Implementation:**
```typescript
import { spawn } from 'child_process';

async function executeSquadSession(job: SquadJob): Promise<void> {
  const contextPath = await writeContextFile(job);
  
  const proc = spawn('claude', [
    '--print',
    '--max-turns', '25',
    '--prompt', getSquadPromptPath(job.squad_type),
  ], {
    cwd: getClientWorkdir(job.client_id),
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  
  // Pipe client context to stdin
  proc.stdin.write(await getClientContext(job));
  proc.stdin.end();
  
  // Stream stdout to database
  let output = '';
  proc.stdout.on('data', async (chunk) => {
    output += chunk.toString();
    await updateJobProgress(job.id, output);
  });
  
  // Capture errors
  let errorLog = '';
  proc.stderr.on('data', (chunk) => {
    errorLog += chunk.toString();
  });
  
  // Handle completion
  return new Promise((resolve, reject) => {
    proc.on('close', async (code) => {
      if (code === 0) {
        await parseAndStoreOutput(job, output);
        await markJobCompleted(job.id);
        resolve();
      } else {
        await markJobFailed(job.id, errorLog);
        reject(new Error(`CLI exited with code ${code}`));
      }
    });
  });
}
```

### Pattern 3: State Machine for Pipeline Phases

**What:** Model each client's pipeline as a finite state machine enforced at the database level.

**Why:** Prevents invalid transitions (e.g., skipping phases, starting a phase when the gate hasn't been approved). With 15+ concurrent clients, UI bugs or race conditions must not corrupt pipeline state.

**States per phase:**
```
pending -> active -> processes_running -> processes_complete -> gate_evaluating -> gate_reviewed -> completed
                                   \-> failed (can retry)          \-> rejected (rework)
```

**Enforcement:**
```sql
-- Trigger: prevent phase activation without prior phase completion
CREATE OR REPLACE FUNCTION enforce_phase_sequence()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.phase_number > 1 THEN
    IF NOT EXISTS (
      SELECT 1 FROM phases 
      WHERE client_id = NEW.client_id 
        AND phase_number = NEW.phase_number - 1 
        AND status = 'completed'
    ) THEN
      RAISE EXCEPTION 'Cannot activate phase % without completing phase %', 
        NEW.phase_number, NEW.phase_number - 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Pattern 4: Supabase Realtime for Live Status

**What:** Subscribe to Postgres Changes on key tables to push updates to the operator's browser without polling.

**Why:** The operator needs to see squad execution progress in real-time. Polling HTTP endpoints creates unnecessary load and latency. Supabase Realtime uses WebSocket and listens to PostgreSQL's WAL (Write-Ahead Log).

**Implementation:**
```typescript
// Client-side subscription (React component)
useEffect(() => {
  const channel = supabase
    .channel('dashboard-updates')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'squad_jobs', 
        filter: `status=eq.running` },
      (payload) => {
        updateJobProgress(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'clients' },
      (payload) => {
        updateClientCard(payload.new);
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'alerts' },
      (payload) => {
        showToast(payload.new);
      }
    )
    .subscribe();
  
  return () => { supabase.removeChannel(channel); };
}, []);
```

### Pattern 5: Structured Output Parsing

**What:** Claude Code CLI outputs are parsed into structured data (JSON) before storage. Raw markdown is also preserved.

**Why:** Downstream components (gate evaluation, feedback loop, exports) need machine-readable data, not just text blobs.

**Implementation approach:**
- Squad prompts include explicit output format instructions (JSON schema at the end of the prompt)
- The output parser attempts JSON extraction first (looking for ```json blocks)
- Falls back to storing raw markdown if JSON parsing fails
- Both `output_json` and `output_markdown` columns exist on the `processes` table

## Anti-Patterns to Avoid

### Anti-Pattern 1: Running CLI Processes from Vercel/Serverless

**What:** Deploying to Vercel or any serverless platform and attempting to spawn Claude Code CLI from serverless functions.

**Why bad:** Serverless functions have execution time limits (10-60 seconds typical, 5 minutes max on Vercel Pro). Squad sessions can run 2-10 minutes. Serverless also lacks persistent filesystem access and cannot maintain child processes across invocations.

**Instead:** Self-host the Next.js app on a VPS (e.g., a dedicated machine, Hetzner, DigitalOcean, or even the operator's own machine via `next start`). The CLI Orchestrator runs as part of the same Node.js process.

### Anti-Pattern 2: Storing Pipeline State in Application Memory

**What:** Tracking which phase each client is in via in-memory variables, React state, or a cache layer.

**Why bad:** Server restarts lose all state. With 15+ clients, this leads to "ghost" pipeline states where the DB says one thing and the app shows another.

**Instead:** PostgreSQL is the single source of truth. Every pipeline state query hits the database (or its Realtime cache). React state only mirrors what the DB says.

### Anti-Pattern 3: One CLI Process per Process (16 separate spawns per client)

**What:** Spawning a separate Claude Code CLI session for each of the 16 marketing processes individually.

**Why bad:** Each CLI spawn has overhead (loading context, API connection setup). Some processes within a phase depend on the output of the previous process. Running them as separate sessions loses conversational context.

**Instead:** Spawn one CLI session per squad activation. Squad Estrategia runs processes 1-2 (or 3-6) in a single session where Claude can maintain context. The prompt instructs Claude to produce outputs for each process sequentially within one session.

### Anti-Pattern 4: Direct Client-to-CLI Communication

**What:** Having the browser directly trigger or communicate with CLI processes (e.g., WebSocket to CLI stdout).

**Why bad:** Creates a tight coupling between browser sessions and server processes. If the operator closes their browser, the CLI process should continue. If the operator refreshes, they should see current state.

**Instead:** All communication goes through the database. The CLI writes to DB; the browser reads from DB via Realtime. The two never directly connect.

### Anti-Pattern 5: Putting Squad Prompts in the Database

**What:** Storing the marketing methodology prompts in Supabase and loading them dynamically.

**Why bad:** Prompts are code (they define behavior), not data. They should be version-controlled, reviewed via PRs, and tested. Storing them in DB makes them invisible to git.

**Instead:** Squad prompts live in the codebase at `/prompts/`. They are committed, versioned, and deployed with the application. Client-specific context (briefing, prior outputs) is injected at runtime from the database.

## Deployment Architecture

### Self-Hosted Requirement

This system MUST be self-hosted because Claude Code CLI needs to run as a child process on the same machine as the Next.js server. The recommended deployment:

```
Single VPS (4GB+ RAM, 2+ vCPU)
  |
  +-- Next.js app (port 3000)      <- PM2 or systemd managed
  |   +-- CLI Orchestrator          <- runs in same process
  |   +-- API routes
  |   +-- SSR/RSC rendering
  |
  +-- Claude Code CLI (installed)   <- spawned by Orchestrator
  |
  +-- /prompts/                     <- squad prompt files
  +-- /tmp/agency-os/               <- temp context files
  
External:
  +-- Supabase Cloud (managed)      <- database, auth, storage, realtime
```

**Why single machine:** At 15 clients with sequential job processing, there is no need for horizontal scaling. A single machine simplifies the architecture enormously. Scale vertically if needed (more RAM/CPU).

**PM2 for process management:** Use PM2 to run the Next.js app with automatic restart on crash. The CLI Orchestrator runs as part of the Next.js process lifecycle.

### Alternative: Operator's Local Machine

For v1/MVP, the operator can simply run `npm run dev` or `next start` on their own machine. This has the advantage of:
- Zero hosting cost
- Claude Code CLI already installed locally
- Easy debugging (operator is a developer)
- Can use ngrok for external access if needed

## Project Structure

```
agency-os/
  src/
    app/                          # Next.js App Router
      (dashboard)/
        page.tsx                  # Multi-client Kanban dashboard
        layout.tsx
      clients/
        [clientId]/
          page.tsx                # Client detail
          phases/
            [phaseNumber]/
              page.tsx            # Phase execution view
          gates/
            [gateNumber]/
              page.tsx            # Quality gate review
      api/
        squad/
          trigger/route.ts        # POST: queue a squad job
          cancel/route.ts         # POST: cancel running job
        gate/
          evaluate/route.ts       # POST: trigger AI gate evaluation
          decide/route.ts         # POST: operator approve/reject
        client/
          route.ts                # POST: create client
          [clientId]/route.ts     # GET/PATCH: client data
        pipeline/
          advance/route.ts        # POST: advance to next phase
      layout.tsx                  # Root layout with Supabase provider
    
    lib/
      supabase/
        client.ts                 # Browser Supabase client
        server.ts                 # Server Supabase client
        admin.ts                  # Service role client (for Orchestrator)
        types.ts                  # Generated DB types
      orchestrator/
        queue.ts                  # Job queue polling logic
        executor.ts               # CLI spawn and management
        parser.ts                 # Output parsing (JSON extraction)
        index.ts                  # Orchestrator entry point
      pipeline/
        state-machine.ts          # Phase transition logic
        validators.ts             # Gate checklist validation
      prompts/
        loader.ts                 # Load and template squad prompts
    
    components/
      dashboard/
        kanban-board.tsx          # Multi-client pipeline board
        client-card.tsx           # Client status card
        alert-panel.tsx           # Bottleneck alerts
      phase/
        process-list.tsx          # Processes within a phase
        squad-trigger.tsx         # "Run Squad" button + progress
        output-viewer.tsx         # Display process outputs
      gate/
        checklist-review.tsx      # AI review + operator controls
        gate-status.tsx           # Gate pass/fail badge
      shared/
        status-badge.tsx
        progress-bar.tsx
        realtime-provider.tsx     # Supabase Realtime context
  
  prompts/                        # Squad prompt templates (version controlled)
    squad-estrategia.md
    squad-planejamento.md
    squad-growth.md
    squad-crm.md
    gate-evaluation.md
    feedback-loop.md
  
  supabase/
    migrations/                   # Database migrations
      001_initial_schema.sql
      002_state_machine_triggers.sql
      003_rls_policies.sql
    seed.sql                      # Test data
  
  scripts/
    start-orchestrator.ts         # Standalone orchestrator start (alternative to embedded)
```

## Scalability Considerations

| Concern | At 15 clients (v1) | At 50 clients | At 200+ clients |
|---------|---------------------|---------------|-----------------|
| **CLI concurrency** | 1 job at a time, queue the rest | 2-3 concurrent jobs (separate processes) | Dedicated worker machines |
| **Database load** | Supabase free/pro tier sufficient | Supabase Pro tier | Dedicated PostgreSQL |
| **Realtime connections** | 1 operator, ~5 channels | 1-3 operators, ~15 channels | Supabase Realtime limits may need review |
| **Storage** | ~100MB deliverables | ~500MB | Move to dedicated S3 |
| **Job processing time** | Sequential is fine (~20 jobs/day) | May need priority queue | Distributed queue (BullMQ + Redis) |

**Key insight:** At the target scale of 15 clients with one operator, every "enterprise" pattern (message queues, microservices, worker pools) is overkill. Start simple, scale when bottlenecks are measured, not predicted.

## Build Order (Dependencies)

The architecture implies a clear build order based on component dependencies:

### Layer 0: Foundation (must exist first)
1. **Supabase project setup** -- database, auth, storage buckets
2. **Database schema** -- tables, constraints, triggers, RLS policies
3. **Next.js project scaffold** -- App Router, Supabase client configuration

### Layer 1: Core Data (depends on Layer 0)
4. **Client CRUD** -- create, read, update clients with briefing data
5. **Pipeline state machine** -- phase table operations, transition enforcement
6. **Supabase types generation** -- TypeScript types from database schema

### Layer 2: CLI Orchestration (depends on Layer 1)
7. **Job queue** -- `squad_jobs` table + `claim_next_job` function
8. **CLI executor** -- spawn Claude Code CLI, capture output, handle errors
9. **Output parser** -- extract structured JSON from CLI output
10. **Squad prompt templates** -- the 4 squad prompts + gate evaluation prompt

### Layer 3: UI (depends on Layers 1 and 2)
11. **Dashboard Kanban** -- multi-client board with phase columns
12. **Client detail view** -- phase progression, deliverables, history
13. **Squad trigger UI** -- button + progress display + output preview
14. **Realtime subscriptions** -- live updates for all dashboard components

### Layer 4: Quality Gates (depends on Layers 2 and 3)
15. **Gate evaluation trigger** -- AI pre-review via CLI
16. **Gate review UI** -- checklist display, approve/reject controls
17. **Pipeline advancement** -- gate approval triggers next phase activation

### Layer 5: Polish and Export (depends on all above)
18. **Alert system** -- stuck clients, failed gates, pending approvals
19. **Export capability** -- PDF/Doc generation from deliverables
20. **Feedback loop** -- Phase 5 output feeds back into Phase 1 context

**Rationale:** You cannot build the UI without data to display. You cannot test squad execution without the job queue. You cannot test quality gates without squad outputs to review. Each layer provides testable functionality on its own.

## Sources

- Project definition: `.planning/PROJECT.md`
- Agency OS methodology: `docs/agency-os-prompt.md`
- Next.js App Router patterns: Training data knowledge of Next.js 14+ (MEDIUM confidence -- established patterns, but specific API details should be verified against current docs during implementation)
- Supabase Realtime (Postgres Changes): Training data knowledge (MEDIUM confidence -- core feature well-documented, but connection limit details should be verified)
- Node.js child_process.spawn: Training data knowledge (HIGH confidence -- stable Node.js core API, unchanged for years)
- PostgreSQL FOR UPDATE SKIP LOCKED: Training data knowledge (HIGH confidence -- standard PostgreSQL feature since v9.5)
- Self-hosting requirement for CLI spawning: Logical deduction (HIGH confidence -- serverless cannot maintain child processes, this is a fundamental constraint)
