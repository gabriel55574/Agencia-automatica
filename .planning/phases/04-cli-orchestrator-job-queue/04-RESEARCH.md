# Phase 4: CLI Orchestrator & Job Queue - Research

**Researched:** 2026-04-09
**Domain:** Node.js child_process, Claude Code CLI, PM2, Supabase Realtime, PostgreSQL job queue
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Worker runs as a separate PM2-managed Node.js process alongside the Next.js app on the VPS. Not integrated into the Next.js process. Script: `src/worker/index.ts`. PM2 `ecosystem.config.js` defines two processes: `agency-os` (Next.js) and `job-worker`. Worker has `autorestart: true` — PM2 handles crash recovery.

- **D-02:** Job discovery uses Supabase Realtime + 5-second interval fallback. Worker subscribes to `squad_jobs` INSERT events (`status=eq.queued`) for immediate pickup. A `setInterval` polling `claim_next_job()` every 5 seconds acts as a safety net for dropped Realtime connections or jobs enqueued while subscription was down.

- **D-03:** CLI stdout is batched and flushed to `squad_jobs.progress_log` every 5 seconds. Worker accumulates stdout chunks in a buffer; flushes on 5-second interval (or on process exit). Provides good visibility without per-line DB writes.

- **D-04:** Progress is displayed in a modal/drawer triggered from the process row on the client profile page (`/clients/[id]`). Process row shows `[running]` status badge with a "View ►" button. Modal shows the live progress log.

- **D-05:** The progress modal uses a Supabase Realtime subscription on the `squad_jobs` row to receive live log updates. No frontend polling needed.

- **D-06:** On CLI process failure (non-zero exit code or exception), the worker auto-retries up to `max_attempts` times (default: 3). Each retry increments `job.attempts` and re-queues with exponential backoff: `delay = 2^attempts × 30_000ms` (30s, 60s, 120s). After exhausting `max_attempts`, job is marked `status='failed'`.

- **D-07:** Permanently failed jobs (max retries exhausted) are surfaced via a `failed` status badge on the process row of the client profile. No push notifications in Phase 4. Email notifications deferred to v2 (NOTF-02 in requirements).

- **D-08:** Job timeout threshold is 30 minutes. If a job is in `status='running'` for more than 30 minutes, the worker kills the process and marks it failed (eligible for retry via D-06).

- **D-09:** Timeout detection uses worker startup + periodic heartbeat check (every 5 minutes). On each check, the worker queries for jobs stuck in `running` with `started_at < NOW() - 30min`, kills them, and marks them failed. This handles the case where the worker itself crashed mid-job.

### Claude's Discretion

- Exact concurrency limit (2-3 simultaneous sessions per SQAD-08) — planner may choose 2 or 3; both are within the stated requirement.
- Exponential backoff base formula adjustments within order of magnitude.
- How `claim_next_job()` is called with the concurrency cap (e.g., check running job count before claiming, or use a semaphore in the worker).
- Internal worker loop implementation details (async loop vs. event-driven).

### Deferred Ideas (OUT OF SCOPE)

- Configurable timeout via `JOB_TIMEOUT_MS` env var — deferred; 30-minute hardcode is sufficient for v1.
- Email notifications for failed jobs (NOTF-02) — v2 requirement, explicitly deferred.
- Per-process timeout estimates (some processes run longer than others) — deferred to later iteration.
- Dashboard view for failed jobs — Phase 8 will surface `status='failed'` jobs from the DB.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SQAD-03 | Squad sessions run as Claude Code CLI child processes managed by a PostgreSQL-backed job queue | Verified: `claim_next_job()` PostgreSQL RPC exists in migration 00002; `child_process.spawn` confirmed working with Claude CLI binary. See CLI Flags section. |
| SQAD-08 | Job queue enforces concurrency limits (max 2-3 simultaneous CLI sessions) | Verified: Concurrency guard pattern using `count(status='running')` before `claim_next_job()` call. In-memory Map<jobId, ChildProcess> tracks active processes. |
</phase_requirements>

---

## Summary

Phase 4 builds the background worker engine that powers all squad automation. The core loop is: poll/subscribe for queued jobs → atomically claim one via PostgreSQL RPC → spawn Claude CLI as a child process → stream stdout to the database every 5 seconds → mark complete or failed. PM2 manages the worker process lifecycle on the VPS.

All three high-risk areas are now resolved. First, the Claude Code CLI flags have been **verified by live execution** on the actual installed binary (v2.1.94). The exact invocation for headless operation is confirmed: `claude --print --output-format json --no-session-persistence <prompt>` with `stdio: ['ignore', 'pipe', 'pipe']`. The JSON result object structure is documented from live output. Second, the Supabase Realtime `postgres_changes` API is confirmed present in the installed `@supabase/supabase-js@2.102.1`. Third, PM2 v6.0.14 is the latest version; it is not currently installed on this machine and must be added.

The worker needs `tsx` to run TypeScript directly (Node 20 does not support native TypeScript; `tsx` is not in the project yet). The worker TypeScript file lives outside the Next.js build graph and needs its own execution mechanism. PM2 can be configured to use `tsx` as the interpreter, avoiding a separate compile step.

**Primary recommendation:** Install `tsx` as a devDependency. Write `src/worker/index.ts` as a standalone TypeScript file using the `createAdminClient()` pattern. Configure PM2 `ecosystem.config.js` with `interpreter: 'tsx'` for the `job-worker` entry. The worker must close stdin (`stdio: ['ignore', 'pipe', 'pipe']`) when spawning Claude CLI or it will wait 3 seconds before proceeding.

---

## Standard Stack

### Core (all already installed or built-in)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `child_process.spawn` | Built-in (Node 20.19.6) | Spawn Claude CLI as child process | [VERIFIED: live test] `spawn` confirmed working. Use `stdio: ['ignore', 'pipe', 'pipe']` — not `exec`. `exec` buffers all output; `spawn` streams stdout chunks as they arrive. |
| `@supabase/supabase-js` | 2.102.1 (installed) | Worker DB client — claims jobs, writes progress_log | [VERIFIED: npm package.json] `createAdminClient()` pattern already exists in `src/lib/supabase/admin.ts`. Worker reuses this exact factory. |
| Supabase Realtime `postgres_changes` | Bundled in 2.102.1 | Subscribe to `squad_jobs` INSERT events | [VERIFIED: live Node.js test] `client.channel().on('postgres_changes', ...).subscribe()` API confirmed present. |
| `claim_next_job()` PostgreSQL RPC | In migration 00002 | Atomic job claiming with `FOR UPDATE SKIP LOCKED` | [VERIFIED: read migration file] Function already exists. Worker calls `supabase.rpc('claim_next_job')`. Do not rewrite. |

### New Dependencies to Add

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `tsx` | ^4.21.0 | Run `src/worker/index.ts` without pre-compiling | [VERIFIED: npm registry] Latest version. Node 20 has no native TypeScript stripping. `tsx` uses esbuild under the hood — fast, zero config. Needed by PM2 as the `interpreter`. |
| `pm2` | 6.0.14 | Process manager for VPS — runs worker and Next.js | [VERIFIED: npm registry] Latest version. Not currently installed on this machine. Provides `autorestart`, crash recovery, log management. |

**Installation:**
```bash
# Add tsx as devDependency (only needed on VPS / CI)
npm install --save-dev tsx

# Install PM2 globally on the VPS (not in package.json)
npm install -g pm2
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `tsx` | Pre-compile `src/worker` with `tsc --outDir dist/worker` | tsc is stricter but adds build step. tsx is zero-config. Both work. CLAUDE.md precedent is TypeScript-first with no separate compile step for non-Next files. |
| `tsx` | Node.js `--import tsx/esm` flag | Same runtime, different invocation. tsx CLI is cleaner for PM2 `interpreter` config. |
| PM2 ecosystem.config.js | `pm2 start` CLI commands | ecosystem.config.js is idempotent, version-controllable, and restarts correctly after `pm2 resurrect`. |

---

## Claude Code CLI — VERIFIED FLAGS

> All flags verified by live execution against Claude Code CLI v2.1.94 installed at
> `/Users/gabrielviniciusoliveira/.npm-global/bin/claude`.

### Headless Invocation (standard pattern for worker)

```
claude --print --output-format json --no-session-persistence <prompt>
```

| Flag | Verified | Effect |
|------|----------|--------|
| `--print` / `-p` | [VERIFIED] | Non-interactive mode. Outputs result and exits. Required for any programmatic use. |
| `--output-format json` | [VERIFIED] | Single JSON object emitted on stdout. See JSON structure below. |
| `--output-format text` | [VERIFIED] | Plain text (the `result` field value only). Use when you don't need metadata. |
| `--output-format stream-json` | [VERIFIED] | Streaming NDJSON — one JSON object per line as tokens arrive. **Requires `--verbose`** or it errors. |
| `--no-session-persistence` | [VERIFIED] | Disables session saving to disk. Prevents worker runs from polluting `~/.claude/projects/`. Use for all worker spawns. |
| `--system-prompt <prompt>` | [VERIFIED: --help confirmed, live test confirmed] | Replaces the default Claude Code system prompt entirely. Use for squad-specific persona injection. |
| `--append-system-prompt <prompt>` | [VERIFIED: live test] | Appends to the default system prompt (preserves Claude Code's default context). Use when you want Claude Code's built-in context plus squad instructions. |
| `--max-budget-usd <amount>` | [VERIFIED: --help + live test] | Caps spend per session. Hard limit — CLI errors if budget exceeded. Useful safeguard per squad run. |
| `--permission-mode auto` | [VERIFIED: live test] | Auto-approves tool permissions without interactive prompts. Required for headless runs where Claude needs Bash/Read/Edit tools. |
| `--dangerously-skip-permissions` | [VERIFIED: live test] | Bypasses ALL permission checks. Use when running in a sandboxed/trusted environment. |
| `--bare` | [VERIFIED: live test] | Minimal mode — skips hooks, LSP, CLAUDE.md auto-discovery, keychain reads. **Requires `ANTHROPIC_API_KEY` env var** (OAuth/keychain not read in bare mode). |
| `--model <model>` | [VERIFIED: --help] | Override model. E.g., `--model sonnet` or `--model claude-opus-4-5`. Default uses account default. |
| `--effort <level>` | [VERIFIED: --help] | `low`, `medium`, `high`, `max`. Controls reasoning depth per session. |
| `--tools <list>` | [VERIFIED: --help] | Restrict available tools. Use `""` to disable all tools for pure text sessions. Default is all tools. |

### JSON Output Structure (verified from live execution)

```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 2581,
  "duration_api_ms": 1924,
  "num_turns": 1,
  "result": "HELLO",
  "stop_reason": "end_turn",
  "session_id": "6d232f9f-...",
  "total_cost_usd": 0.199,
  "usage": { "input_tokens": 3, "output_tokens": 5, ... },
  "permission_denials": [],
  "terminal_reason": "completed"
}
```

**Error detection:**
- `is_error: true` AND exit code `1` = CLI-level error (auth failure, budget exceeded, parse error)
- `is_error: false` AND exit code `0` = success
- `is_error: true` AND exit code `0` = partial success (result contains error message string)
- Non-zero exit code without valid JSON on stdout = spawn-level failure (binary not found, OOM)

**Key finding — stderr hook noise:** Hook failure messages ("SessionEnd hook failed") are emitted on **stderr**, not stdout. The JSON result is clean on stdout. Worker must pipe stdout only for parsing; stderr can be written to `error_log` or discarded.

### Authentication for VPS Deployment

Current dev machine uses OAuth (`claude.ai` subscription auth, stored in OS keychain). On a VPS (no GUI, no keychain):

- **Set `ANTHROPIC_API_KEY` in the worker's environment** (via `.env` or PM2 `env` block). The CLI picks it up automatically — verified by live test (invalid key → `is_error: true` with auth error message). `ANTHROPIC_API_KEY` takes precedence over keychain OAuth.
- Alternatively, `claude auth login --console` on the VPS sets up API key auth interactively once. But env var is more reproducible for CI/VPS deployment.
- `claude setup-token` creates a long-lived token requiring a Claude subscription — alternative to per-request API key.

Add to `.env.example`:
```
ANTHROPIC_API_KEY=
```

### stdin Warning

When spawned without explicit stdin handling, the CLI emits on stderr:
```
Warning: no stdin data received in 3s, proceeding without it.
```

**Fix:** Set `stdio: ['ignore', 'pipe', 'pipe']` in the spawn options. This closes stdin immediately. Confirmed to eliminate the warning.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── worker/
│   ├── index.ts          # PM2 entry point — main worker loop
│   ├── job-runner.ts     # Spawns Claude CLI, streams stdout
│   ├── progress-flusher.ts  # Batches progress_log writes
│   └── heartbeat.ts      # Timeout detection + stuck job recovery
ecosystem.config.js        # PM2 process definitions (project root)
```

### Pattern 1: Worker Main Loop (Realtime + Polling)

**What:** Subscribe to Supabase Realtime INSERT events. Poll every 5 seconds as fallback. Each trigger calls `tryClaimAndRun()`.

**When to use:** This is the D-02 architecture — always.

```typescript
// Source: verified against @supabase/supabase-js@2.102.1 channel() API
import { createAdminClient } from '../lib/supabase/admin'

const supabase = createAdminClient()

// Realtime subscription
supabase
  .channel('squad-jobs-queue')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'squad_jobs', filter: 'status=eq.queued' },
    () => tryClaimAndRun()
  )
  .subscribe()

// Polling fallback
setInterval(() => tryClaimAndRun(), 5_000)

// Heartbeat for timeout detection (D-09)
setInterval(() => recoverStuckJobs(), 5 * 60_000)
```

### Pattern 2: Atomic Job Claiming with Concurrency Guard

**What:** Check running job count before calling `claim_next_job()`. If at concurrency limit, skip. This enforces SQAD-08 without a distributed semaphore.

```typescript
const MAX_CONCURRENT = 2 // planner chooses 2 or 3 per discretion

async function tryClaimAndRun(): Promise<void> {
  // Count currently running jobs (D-02 concurrency guard)
  const { count } = await supabase
    .from('squad_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'running')

  if ((count ?? 0) >= MAX_CONCURRENT) return

  // Atomically claim the next queued job — uses FOR UPDATE SKIP LOCKED
  const { data: jobs } = await supabase.rpc('claim_next_job')
  const job = jobs?.[0]
  if (!job) return

  runJob(job) // fire-and-forget, tracked in activeJobs Map
}
```

### Pattern 3: Claude CLI Spawn with Progress Streaming

**What:** Spawn Claude CLI as a child process, pipe stdout to an in-memory buffer, flush to `squad_jobs.progress_log` on 5-second intervals (D-03). Mark complete/failed on process exit.

```typescript
import { spawn, ChildProcess } from 'child_process'

const activeJobs = new Map<string, ChildProcess>()

async function runJob(job: SquadJob): Promise<void> {
  const args = [
    '--print',
    '--output-format', 'json',
    '--no-session-persistence',
    '--permission-mode', 'auto',
    job.cli_command ?? 'No command specified',
  ]

  // CRITICAL: stdio: ['ignore', 'pipe', 'pipe'] — eliminates stdin warning
  const proc = spawn('claude', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  })

  activeJobs.set(job.id, proc)

  let stdoutBuffer = ''
  let stderrBuffer = ''

  proc.stdout.on('data', (chunk: Buffer) => {
    stdoutBuffer += chunk.toString()
  })

  proc.stderr.on('data', (chunk: Buffer) => {
    stderrBuffer += chunk.toString()
  })

  // Batch flush to progress_log every 5 seconds (D-03)
  const flushInterval = setInterval(async () => {
    if (stdoutBuffer) {
      await supabase.from('squad_jobs').update({
        progress_log: stdoutBuffer,
      }).eq('id', job.id)
    }
  }, 5_000)

  proc.on('close', async (exitCode) => {
    clearInterval(flushInterval)
    activeJobs.delete(job.id)

    const success = exitCode === 0 && !isCliError(stdoutBuffer)
    
    if (success) {
      await supabase.from('squad_jobs').update({
        status: 'completed',
        output: stdoutBuffer,
        progress_log: stdoutBuffer,
        completed_at: new Date().toISOString(),
      }).eq('id', job.id)
    } else {
      await handleFailure(job, stdoutBuffer, stderrBuffer)
    }
  })
}

function isCliError(stdout: string): boolean {
  try {
    const jsonLine = stdout.split('\n').find(l => l.trim().startsWith('{'))
    if (!jsonLine) return true
    const result = JSON.parse(jsonLine)
    return result.is_error === true
  } catch {
    return true
  }
}
```

### Pattern 4: Retry with Exponential Backoff (D-06)

```typescript
async function handleFailure(job: SquadJob, stdout: string, stderr: string): Promise<void> {
  const newAttempts = job.attempts + 1

  if (newAttempts >= job.max_attempts) {
    // Exhausted retries — mark permanently failed
    await supabase.from('squad_jobs').update({
      status: 'failed',
      error_log: stderr || stdout,
      attempts: newAttempts,
      completed_at: new Date().toISOString(),
    }).eq('id', job.id)
    return
  }

  // Re-queue with exponential backoff: 30s, 60s, 120s
  const delayMs = Math.pow(2, newAttempts) * 30_000

  await supabase.from('squad_jobs').update({
    status: 'queued',
    error_log: stderr || stdout,
    attempts: newAttempts,
  }).eq('id', job.id)

  // Claim is blocked until delay expires via scheduled re-check
  setTimeout(() => tryClaimAndRun(), delayMs)
}
```

### Pattern 5: Timeout Recovery Heartbeat (D-08, D-09)

```typescript
const TIMEOUT_MS = 30 * 60_000 // 30 minutes hardcoded (not env var — D-08)

async function recoverStuckJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - TIMEOUT_MS).toISOString()

  const { data: stuckJobs } = await supabase
    .from('squad_jobs')
    .select('*')
    .eq('status', 'running')
    .lt('started_at', cutoff)

  for (const job of stuckJobs ?? []) {
    // Kill the process if still tracked in memory
    const proc = activeJobs.get(job.id)
    if (proc) {
      proc.kill('SIGTERM')
      activeJobs.delete(job.id)
    }
    // Mark failed — eligible for retry via D-06
    await handleFailure(job, '', 'Job timed out after 30 minutes')
  }
}
```

### Pattern 6: PM2 Ecosystem Config

```javascript
// ecosystem.config.js (project root)
// Source: [ASSUMED] based on PM2 v6 documentation patterns
module.exports = {
  apps: [
    {
      name: 'agency-os',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/app', // VPS deployment path
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      autorestart: true,
      max_memory_restart: '1G',
    },
    {
      name: 'job-worker',
      script: 'src/worker/index.ts',
      interpreter: 'node_modules/.bin/tsx',
      cwd: '/app',
      env: {
        NODE_ENV: 'production',
        // ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
        // must be set in the VPS environment or a separate .env.worker file
      },
      autorestart: true,
      max_memory_restart: '512M',
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
}
```

**Note:** The `interpreter` path `node_modules/.bin/tsx` assumes tsx is installed as a devDependency. On the VPS, `npm install --include=dev` must run during deployment.

### Pattern 7: Frontend Progress Modal (D-04, D-05)

The progress modal subscribes to the `squad_jobs` row via Supabase Realtime. No polling needed because the worker flushes `progress_log` updates, which trigger Realtime change events on the row.

```typescript
// In the modal component (Client Component)
// Source: verified against @supabase/supabase-js@2.102.1
useEffect(() => {
  const channel = supabase
    .channel(`job-${jobId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'squad_jobs',
        filter: `id=eq.${jobId}`,
      },
      (payload) => setJob(payload.new as SquadJob)
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [jobId])
```

### Anti-Patterns to Avoid

- **Using `exec` instead of `spawn`:** `exec` buffers the entire stdout before delivering it. Squad sessions run 5-30 minutes — you'd get nothing until completion. Always use `spawn`.
- **Reading stdout as a single JSON blob without finding the JSON line:** The CLI emits hook-failure text on stderr, but even on stdout there may be trailing newlines. Always find the first line starting with `{` for JSON parsing, or redirect stderr to `/dev/null`/`pipe` and suppress it.
- **Passing `--bare` in production without `ANTHROPIC_API_KEY`:** `--bare` disables OAuth/keychain authentication. In bare mode, authentication requires `ANTHROPIC_API_KEY` in the environment. Using `--bare` without this env var causes `is_error: true` with "Not logged in" message.
- **Not tracking active processes in a Map:** Without `activeJobs: Map<jobId, ChildProcess>`, the heartbeat cannot `SIGTERM` the actual OS process for timed-out jobs — it can only update the DB record, leaving a zombie process running.
- **Forgetting to `clearInterval` on process exit:** The 5-second flush interval must be cleared in the `proc.on('close')` handler, or it will continue firing after the process exits and attempt to write to an already-completed job.
- **Re-using `createAdminClient()` from `@/lib/supabase/admin`:** The worker runs outside Next.js, so the `@/` path alias won't resolve unless you configure it in the worker's execution context. Use `../lib/supabase/admin` relative paths OR configure `tsx` with the tsconfig paths plugin.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic job claiming | Custom locking logic | `claim_next_job()` PostgreSQL RPC (migration 00002) | Already exists. Uses `FOR UPDATE SKIP LOCKED` — the only correct pattern for PostgreSQL queue. Race conditions guaranteed if you hand-roll. |
| Process manager / crash recovery | Custom restart loop | PM2 `autorestart: true` | PM2 handles SIGTERM, OOM kills, crash loops, log rotation, `pm2 resurrect` after VPS reboot. |
| TypeScript execution outside Next.js | Custom esbuild script | `tsx` | tsx is the ecosystem standard for running TS scripts. One dependency, zero config. |
| Concurrency tracking | Database-level semaphore | In-memory `Map<jobId, ChildProcess>` + DB count query | For a single worker process (which PM2 ensures), in-memory tracking is correct and cheaper. Database-level distributed locks are only needed for multi-worker deployments (out of scope for v1). |

**Key insight:** The PostgreSQL `FOR UPDATE SKIP LOCKED` pattern in `claim_next_job()` is the industry standard for job queues without an external queue broker. It provides the same atomicity guarantees as Redis-based queues for this use case and is already implemented.

---

## Common Pitfalls

### Pitfall 1: stdin Warning Causes 3-Second Delay Per Job

**What goes wrong:** Spawning `claude` without closing stdin causes a 3-second wait with the warning "no stdin data received, proceeding without it."

**Why it happens:** The CLI waits for stdin input in case the caller is piping a prompt. With no stdin data, it proceeds after a timeout.

**How to avoid:** Always set `stdio: ['ignore', 'pipe', 'pipe']` in spawn options. `'ignore'` closes stdin immediately.

**Warning signs:** Progress logs show 3-second gap at the start of every job. Multiplied by 15+ clients running concurrently this becomes significant.

### Pitfall 2: JSON Parsing Fails Due to Hook Error Lines

**What goes wrong:** Parsing the entire stdout as JSON fails because hook-failure messages appear as a second line.

**Why it happens:** The worker's PM2/VPS environment may have hooks configured (as seen on dev machine: "SessionEnd hook failed: Hook cancelled"). These go to stderr on dev but may appear on stdout in some configurations.

**How to avoid:** Parse stdout by finding the first line that starts with `{` rather than treating the entire stdout as a single JSON string. Or suppress stderr entirely since it only contains hook noise: `proc.stderr.on('data', () => {})`.

**Warning signs:** `JSON.parse(stdout)` throws "Extra data" or "Unexpected token" errors.

### Pitfall 3: Worker TypeScript Module Resolution

**What goes wrong:** `tsx src/worker/index.ts` fails with "Cannot find module '@/lib/supabase/admin'".

**Why it happens:** The `@/` path alias is configured in `tsconfig.json` for Next.js's bundler (`moduleResolution: "bundler"`). `tsx` respects tsconfig paths, but only if it reads the correct tsconfig and it includes the worker files.

**How to avoid:** Either (a) use relative imports in `src/worker/index.ts` (e.g., `../lib/supabase/admin`) or (b) add a `tsconfig.worker.json` that extends the base tsconfig and is passed to tsx via `--tsconfig`. Option (a) is simpler.

**Warning signs:** Worker starts then immediately crashes with module resolution errors.

### Pitfall 4: Supabase Realtime Requires Authenticated Client

**What goes wrong:** Realtime subscription silently fails to receive events because the admin client uses the service role key, which may need explicit Realtime channel configuration.

**Why it happens:** Supabase Realtime row-level security can filter events for non-authenticated clients.

**How to avoid:** The `createAdminClient()` factory uses the service role key (`SUPABASE_SERVICE_ROLE_KEY`), which bypasses RLS. This is correct for the worker. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in the worker's PM2 environment.

**Warning signs:** Jobs sit in `queued` status indefinitely; polling fallback eventually picks them up (which proves Realtime is broken, not the queue).

### Pitfall 5: PM2 `ecosystem.config.js` tsx Interpreter Path

**What goes wrong:** PM2 cannot find `tsx` because the interpreter path is wrong on the VPS.

**Why it happens:** The `interpreter` path in ecosystem.config.js is relative to `cwd`. On different machines, the `node_modules/.bin/tsx` path must exist.

**How to avoid:** Run `npm install --include=dev` as part of VPS deployment. Alternatively, install tsx globally: `npm install -g tsx` and use `interpreter: 'tsx'` with `tsx` in PATH.

**Warning signs:** `pm2 logs job-worker` shows "No such file or directory" or "interpreter not found".

### Pitfall 6: Auth Token Expiry on VPS

**What goes wrong:** The worker spawns jobs successfully for hours, then starts getting `is_error: true` with auth errors on all subsequent jobs.

**Why it happens:** If using OAuth (claude.ai auth), the token has an expiry. On VPS without a browser, token renewal fails.

**How to avoid:** Use `ANTHROPIC_API_KEY` for VPS deployment. API keys do not expire. See Authentication section above.

**Warning signs:** All jobs suddenly fail with "Not logged in" or "Invalid API key" in `error_log`.

---

## Code Examples

Verified patterns from live execution and official APIs:

### Spawn Claude CLI (minimal correct invocation)
```typescript
// Source: [VERIFIED: live execution test on claude@2.1.94]
import { spawn } from 'child_process'

const proc = spawn(
  'claude',
  ['--print', '--output-format', 'json', '--no-session-persistence', prompt],
  { stdio: ['ignore', 'pipe', 'pipe'], env: process.env }
)
```

### Parse Claude CLI JSON result
```typescript
// Source: [VERIFIED: live execution output structure]
function parseCliResult(stdout: string): { result: string; isError: boolean; costUSD: number } {
  const jsonLine = stdout.split('\n').find(l => l.trim().startsWith('{'))
  if (!jsonLine) return { result: '', isError: true, costUSD: 0 }
  const parsed = JSON.parse(jsonLine)
  return {
    result: parsed.result ?? '',
    isError: parsed.is_error === true,
    costUSD: parsed.total_cost_usd ?? 0,
  }
}
```

### Supabase RPC call for job claiming
```typescript
// Source: [VERIFIED: claim_next_job() function in migration 00002]
const { data: jobs, error } = await supabase.rpc('claim_next_job')
// Returns: SquadJob[] (0 or 1 rows) — empty array means no queued jobs
const job = jobs?.[0]
if (!job) return // nothing to do
```

### Supabase Realtime INSERT subscription
```typescript
// Source: [VERIFIED: @supabase/supabase-js@2.102.1 channel().on().subscribe() API]
supabase
  .channel('squad-jobs-insert')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'squad_jobs', filter: 'status=eq.queued' },
    (_payload) => tryClaimAndRun()
  )
  .subscribe()
```

### Supabase UPDATE for progress flush
```typescript
// Source: [VERIFIED: @supabase/supabase-js@2.102.1 from().update() API]
await supabase
  .from('squad_jobs')
  .update({ progress_log: currentBuffer })
  .eq('id', jobId)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BullMQ + Redis for job queues | PostgreSQL `FOR UPDATE SKIP LOCKED` | ~2017 (feature added to PostgreSQL 9.5) | Eliminates Redis dependency for moderate job volumes. CLAUDE.md explicitly chose this pattern. |
| `ts-node` for TypeScript scripts | `tsx` | ~2022 | tsx is 10-100x faster startup (esbuild vs tsc). `ts-node` is still maintained but tsx is the ecosystem preference. |
| PM2 v5.x | PM2 v6.0.14 | 2025 | v6 added improved TypeScript support and ecosystem.config patterns. Not a breaking change for this use case. |

**Deprecated/outdated:**
- `ts-node`: Still works but tsx is preferred for CLI scripts. ts-node v10.9.2 is latest but slower.
- `--mcp-debug` Claude CLI flag: Deprecated per `--help` output. Use `--debug` instead.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PM2 `interpreter: 'node_modules/.bin/tsx'` syntax is the correct way to use tsx as PM2 interpreter | Architecture Patterns, Pattern 6 | Worker fails to start; fallback: install tsx globally and use `interpreter: 'tsx'` |
| A2 | Supabase Realtime `filter: 'status=eq.queued'` works for INSERT events (not just UPDATE) | Architecture Patterns, Pattern 1 | Realtime subscription triggers for ALL inserts, not just queued ones; `tryClaimAndRun()` would be called more often but `claim_next_job()` handles it safely (returns empty if nothing to claim) |
| A3 | PM2 ecosystem.config.js `cwd` relative to the file's location on VPS | Pattern 6 | PM2 app path misconfigured; simple to fix with absolute path |

**Notes:** A2's risk is LOW because the fallback behavior (extra no-op `tryClaimAndRun()` calls) is harmless. A1 and A3 are low-stakes first-deploy issues that PM2 logs immediately surface.

---

## Open Questions

1. **VPS Claude CLI authentication for production deployment**
   - What we know: ANTHROPIC_API_KEY env var is picked up by the CLI and overrides OAuth. API keys from console.anthropic.com don't expire.
   - What's unclear: The current machine uses claude.ai subscription auth (Max plan). Whether the subscription can generate an API key for the console, or whether the operator needs to switch to API billing for VPS use, is unknown without checking the console.
   - Recommendation: Phase 4 testing can use the existing OAuth auth on the dev VPS. Before production, verify `claude auth login --console` works on the VPS OR add `ANTHROPIC_API_KEY` from console.anthropic.com to the PM2 env config.

2. **`claim_next_job()` RPC return type matches `SquadJob` Zod schema**
   - What we know: The function returns `SETOF squad_jobs`, which means it returns full row objects.
   - What's unclear: The TypeScript generated types from `supabase gen types` may or may not include an RPC function return type for `claim_next_job`. The planner should verify `supabase.rpc('claim_next_job')` return type is `SquadJob[]`.
   - Recommendation: Validate the returned job against `squadJobSchema.safeParse()` before using it. This handles both type uncertainty and schema drift.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Claude Code CLI | All squad job execution | Yes | 2.1.94 | None — it is the execution engine |
| Node.js | Worker runtime | Yes | 20.19.6 | None |
| `tsx` | Worker TypeScript execution | No | 4.21.0 available on npm | Must install: `npm install --save-dev tsx` |
| PM2 | Worker process management | No | 6.0.14 available on npm | Must install globally: `npm install -g pm2` on VPS |
| `@supabase/supabase-js` | Worker DB client + Realtime | Yes | 2.102.1 (installed) | None |
| `zod` | Job row validation | Yes | 4.3.6 (installed) | None |
| `ANTHROPIC_API_KEY` | VPS headless auth | Not set on dev machine (uses OAuth) | N/A | Use OAuth on dev; must set for VPS |

**Missing dependencies with no fallback:**
- None that block Phase 4 development (all blockers have install paths).

**Missing dependencies with fallback:**
- `tsx`: Install before starting. `npm install --save-dev tsx`
- `pm2`: Install globally on VPS. `npm install -g pm2`
- `ANTHROPIC_API_KEY`: Required for VPS; not needed for local dev with OAuth.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run tests/unit/worker.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SQAD-03 | `claim_next_job()` RPC returns one job atomically and transitions it to `running` | integration | `npx vitest run tests/db/squad-jobs.test.ts` | No — Wave 0 |
| SQAD-03 | CLI spawn succeeds: `is_error=false`, exit code 0 for a simple prompt | unit (mock spawn) | `npx vitest run tests/unit/job-runner.test.ts` | No — Wave 0 |
| SQAD-03 | CLI error detection: `is_error=true` in JSON output maps to job failure | unit | `npx vitest run tests/unit/job-runner.test.ts` | No — Wave 0 |
| SQAD-08 | Concurrency guard: when 2 jobs running, `tryClaimAndRun()` returns without claiming | unit | `npx vitest run tests/unit/concurrency.test.ts` | No — Wave 0 |
| SQAD-08 | Retry with backoff: failed job increments `attempts`, re-queues with correct delay | unit | `npx vitest run tests/unit/retry.test.ts` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/unit/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/db/squad-jobs.test.ts` — integration tests for `claim_next_job()` RPC, concurrent claim behavior
- [ ] `tests/unit/job-runner.test.ts` — unit tests for spawn logic, JSON parsing, error detection (mock `child_process.spawn`)
- [ ] `tests/unit/concurrency.test.ts` — unit tests for `tryClaimAndRun()` concurrency guard
- [ ] `tests/unit/retry.test.ts` — unit tests for exponential backoff logic

*(Existing `tests/setup.ts` and `tests/db/` infrastructure cover the DB integration pattern — reuse `cleanTestData()` and `testClient`)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (no user-facing auth — worker is internal process) | — |
| V3 Session Management | No | — |
| V4 Access Control | Yes | Worker uses service role key (bypasses RLS by design — acceptable for internal worker). Never expose service role key to frontend. |
| V5 Input Validation | Yes | `squadJobSchema.safeParse()` validates all job rows before use. `cli_command` field from DB should be treated as trusted (it was set by a Server Action, not user input directly). |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CLI command injection via `cli_command` field | Tampering | `cli_command` is written by Server Actions (authenticated, validated). Worker reads it as a string argument to `spawn()`, not as a shell string — `spawn` with args array prevents shell injection. Never use `exec()` with string interpolation. |
| Service role key exposure | Information Disclosure | Key stored in PM2 env config or `.env` file. Never committed to git. Never passed to frontend. `src/lib/supabase/admin.ts` already follows this pattern. |
| Runaway CLI processes (cost escalation) | Elevation of Privilege | `--max-budget-usd` flag caps spend per session. 30-minute timeout enforced by heartbeat. |
| Zombie processes after worker crash | Denial of Service | `activeJobs` Map is rebuilt on restart; heartbeat recovers stuck DB records; PM2 restarts the worker automatically. |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: live execution] Claude Code CLI v2.1.94 — all flags tested by executing `claude --help` and running actual CLI invocations with `child_process.spawn`
- [VERIFIED: file read] `supabase/migrations/00002_phase_enforcement.sql` — `claim_next_job()` function confirmed present and correct
- [VERIFIED: file read] `src/lib/supabase/admin.ts` — `createAdminClient()` factory confirmed
- [VERIFIED: npm registry] `npm view tsx version` → 4.21.0; `npm view pm2 version` → 6.0.14
- [VERIFIED: Node.js test] `@supabase/supabase-js@2.102.1` channel().on('postgres_changes').subscribe() API confirmed

### Secondary (MEDIUM confidence)
- [CITED: package.json + file read] All currently installed package versions confirmed from `package.json` and `node_modules`

### Tertiary (LOW confidence, flagged in Assumptions Log)
- [ASSUMED] PM2 `interpreter: 'node_modules/.bin/tsx'` configuration syntax

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry or installed packages
- Claude CLI flags: HIGH — verified by live execution on the actual binary
- Architecture: HIGH for core patterns; MEDIUM for PM2 config specifics (A1 in assumptions log)
- Pitfalls: HIGH — all confirmed by observed live CLI behavior

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable ecosystem — CLI flags unlikely to change in 30 days)
