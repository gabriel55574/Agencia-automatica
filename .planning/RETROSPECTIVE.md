# Retrospective

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-09
**Phases:** 9 | **Plans:** 21 | **Commits:** 126

### What Was Built

- Next.js 16 + Supabase foundation with auth, 6-table schema, and DB-level phase enforcement
- Full client CRUD with profile pages, intake onboarding, and archive/restore
- 5-phase sequential pipeline with 16 process definitions, gate-controlled transitions, and race condition protection
- PostgreSQL-backed job queue with Claude CLI worker, concurrency guard, retry, and heartbeat recovery
- Squad trigger UI with context assembly, prompt preview, and structured output parsing (16 Zod schemas)
- AI quality gate reviews with adversarial prompting, structured verdicts, and operator approve/reject workflow
- Document management with outputs browsing, inline viewer, and PDF export
- 5-column Kanban dashboard with bottleneck alerts, action panel, and Supabase Realtime updates
- Feedback loop: Phase 5 NPS/CLV/churn insights feed back into Phase 1 for returning clients

### What Worked

- **Autonomous execution**: Phases 5-9 were executed in a single autonomous run with parallel worktree agents — 5 phases, 12 plans completed without human intervention
- **GSD workflow discipline**: Plan → Execute → Verify pipeline caught real issues (tsx removal in Phase 4, merge conflicts in Phase 6)
- **Parallel worktrees**: Multiple executor agents working simultaneously via git worktrees dramatically reduced wall-clock time
- **TDD approach**: 170+ unit tests caught regressions and validated schema parsing before integration
- **DB-first architecture**: PostgreSQL constraints and triggers enforced invariants that app code alone couldn't guarantee

### What Was Inefficient

- **SUMMARY frontmatter gaps**: Early phases (1-3) didn't populate `requirements_completed` in SUMMARY.md frontmatter, creating audit friction later
- **Worktree merge conflicts**: Phase 6 parallel executors (06-01 and 06-02) conflicted — one overwrote the other's work, requiring manual resolution
- **ROADMAP/STATE drift**: The autonomous run completed phases 3-9 but didn't update the ROADMAP progress table or STATE.md position, leaving stale metadata
- **tsx dependency removal**: A worktree soft-reset in Phase 4 Plan 02 accidentally removed tsx from package.json — the restore commit missed it

### Patterns Established

- **Server Action pattern**: Auth check → Zod validation → admin client operation → revalidatePath
- **RSC boundary pattern**: Server Component page fetches data, passes to client boundary component for interactivity
- **Worker handler pattern**: Check squad_type → parse with type-specific schema → store structured + raw output
- **Supabase Realtime pattern**: Single channel with multi-table subscriptions, debounced router.refresh()
- **Gate review pattern**: Adversarial auditor persona distinct from generation squads, structured verdict with per-item evidence

### Key Lessons

1. **Always verify package.json after worktree merges** — dependencies can be silently dropped during soft-reset/restore operations
2. **Populate SUMMARY frontmatter consistently** — requirements_completed field is critical for milestone audits
3. **Update ROADMAP progress table in the orchestrator** — don't rely on individual executors to maintain global state
4. **One integration checker per milestone** — the cross-phase wiring check caught potential issues before they became bugs

### Cost Observations

- Model mix: predominantly Opus for planning/verification, Sonnet for execution agents
- Sessions: ~15 autonomous agent sessions across phases 5-9
- Notable: Parallel execution via worktrees cut ~50% wall-clock time vs sequential

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 9 |
| Plans | 21 |
| Commits | 126 |
| LOC (TypeScript) | ~9,000 |
| Timeline | 2 days |
| Tests | 170+ |
| Requirements | 38/38 satisfied |
| Integration | 10/10 pass |
| E2E Flows | 5/5 pass |
| Tech Debt Items | 6 |
