<!-- GSD:project-start source:PROJECT.md -->
## Project

**Agency OS**

A web application (Next.js + Supabase) that serves as the operating system for a solo-operated marketing agency. It manages 15+ clients through a standardized 5-phase marketing pipeline (Diagnostico, Engenharia de Valor, Go-to-Market, Tracao e Vendas, Retencao e Escala) with Claude Code CLI-powered squad automations executing the 16 processes. The operator triggers phases via the app, AI pre-reviews quality gate checklists, and the operator makes the final approval decisions.

**Core Value:** One person manages 15+ clients at agency quality by combining a standardized marketing process with AI-powered squad automation — the system enforces consistency, Claude does the heavy lifting, the operator makes the judgment calls.

### Constraints

- **Tech Stack**: Next.js + Supabase + Claude Code CLI — already decided
- **Scale**: Must handle 15+ concurrent clients from launch
- **Solo Operator**: All UX optimized for one person managing everything
- **Process Fidelity**: The 5-phase/16-process/4-gate structure is non-negotiable — it IS the product
- **Claude Code CLI**: Squad automations run via CLI triggers, not API calls
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.2 | Full-stack framework (App Router) | Verified latest stable (March 2026). Turbopack stable as default bundler. Server Components reduce client JS for dashboard-heavy app. API Routes handle Claude CLI triggers. Cache Components + PPR for fast dashboard loads. | HIGH |
| React | 19.x | UI library | Ships with Next.js 16. Server Components for data-heavy pipeline views. View Transitions for smooth phase navigation. React Compiler eliminates manual memoization. | HIGH |
| TypeScript | 5.x | Type safety | Non-negotiable for a system with 16 processes, 5 phases, 4 squads, and complex state transitions. Types become living documentation of the domain model. | HIGH |
### Database & Backend-as-a-Service
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase | Latest (cloud) | Database, Auth, Storage, Realtime, Edge Functions | Already decided per constraints. Postgres underneath gives full SQL power for complex pipeline queries. Row-Level Security for future multi-user. Realtime subscriptions for live dashboard updates when Claude CLI jobs complete. Storage for deliverables (PDFs, docs). | HIGH |
| @supabase/supabase-js | ^2.x | Supabase client SDK | The official JS client. Handles auth, realtime subscriptions, storage uploads, and typed database queries. Use `supabase gen types` to auto-generate TypeScript types from your schema. | MEDIUM |
| @supabase/ssr | ^0.5.x | Server-side Supabase for Next.js | Required for App Router server components and route handlers. Handles cookie-based auth properly in RSC context. Do NOT use the plain supabase-js client in server components -- use this package. | MEDIUM |
### State Machine (Pipeline Engine)
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| XState | ^5.x | State machine for client pipeline phases | The 5-phase pipeline with quality gates is a textbook state machine: defined states, guarded transitions, no skipping. XState v5 is actor-based, supports persistence (critical for long-running client journeys), and has first-class TypeScript support. Alternatives like Zustand or Redux cannot enforce "no skipping phases" at the type level. | MEDIUM |
- The pipeline has strict sequential enforcement (Phase 1 -> Gate 1 -> Phase 2 -> ... -> Phase 5 -> Feedback Loop)
- Quality gates are guarded transitions -- the machine literally cannot advance without gate approval
- Client states persist across sessions (days/weeks per phase) -- XState supports serialization/deserialization
- Each client is an independent actor with its own state -- XState's actor model maps perfectly
- The state machine definition becomes executable documentation of your Agency OS methodology
### UI Components & Styling
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.x | Utility-first CSS | Tailwind v4 has zero-config setup with Next.js, CSS-first configuration, faster builds. Perfect for solo developer -- no context-switching between CSS files and components. | MEDIUM |
| shadcn/ui | Latest | Component library (copy-paste, not dependency) | Not an npm package -- components are copied into your codebase. Full control, no version lock-in. Provides Dialog, DataTable, Kanban-ready Card components, Form with validation. Built on Radix UI primitives for accessibility. | HIGH |
| @hello-pangea/dnd | ^17.x | Drag-and-drop for Kanban board | Maintained fork of react-beautiful-dnd (which Atlassian abandoned). Needed for the multi-client Kanban pipeline dashboard. Lightweight, accessible, works with RSC when used in client components. | MEDIUM |
| Lucide React | ^0.4x | Icons | Tree-shakeable, consistent design, works perfectly with shadcn/ui. | MEDIUM |
### Data Fetching & Server State
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js Server Actions | Built-in | Mutations (create client, approve gate, trigger squad) | Native to Next.js 16. Type-safe server mutations without building API endpoints. Progressive enhancement. Perfect for form submissions (client intake, gate approvals). | HIGH |
| Next.js App Router + RSC | Built-in | Data fetching for dashboard views | Server Components fetch data directly in the component tree. No client-side loading spinners for initial page loads. Use `loading.tsx` for streaming UI. | HIGH |
| @tanstack/react-query | ^5.x | Client-side async state (polling Claude CLI job status) | For scenarios where you need client-side polling/refetching: monitoring active Claude CLI job progress, real-time squad execution status. Not needed for most reads (RSC handles those). | MEDIUM |
### Claude Code CLI Integration
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Node.js child_process (spawn) | Built-in | Trigger Claude Code CLI from API routes | `spawn` (not `exec`) because squad sessions produce streaming output. Use `spawn('claude', [args])` from Next.js API Route Handlers. Capture stdout/stderr for progress tracking. | HIGH |
| Claude Code CLI | Latest | AI squad execution engine | Per project constraints. Run with `--print` flag for non-interactive mode (outputs result to stdout). Pass `--system-prompt` for squad-specific prompts. Use `--output-format json` for structured parsing. | MEDIUM |
### Background Job Processing
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Edge Functions | Built-in | Lightweight async tasks (notifications, webhook processing) | For tasks that do NOT need Claude CLI: sending alerts, processing webhooks, scheduled checks for stuck clients. Runs on Deno. | MEDIUM |
| BullMQ + Redis | ^5.x / ^7.x | Job queue for Claude CLI executions | Claude CLI sessions can take minutes. Need a proper job queue: retry on failure, concurrency limits (avoid spawning 15 CLI sessions simultaneously), job progress tracking, dead letter queue for failed runs. BullMQ is the standard Node.js job queue. | MEDIUM |
| ioredis | ^5.x | Redis client for BullMQ | Required by BullMQ. Also useful for caching frequently-accessed pipeline state. | MEDIUM |
- Claude CLI sessions take 1-10+ minutes -- cannot block API route handlers
- Need concurrency control (max 2-3 simultaneous CLI sessions to avoid resource exhaustion)
- Need retry logic (CLI sessions can fail due to rate limits, network issues)
- Need job progress tracking (update UI with "Processing step 3 of 6...")
- Need job history (which squad ran when, what was the output, how long did it take)
### Real-time Updates
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Realtime | Built-in | Live dashboard updates | Subscribe to pipeline state changes across all clients. When a Claude CLI job completes and writes results to Supabase, the dashboard updates instantly via Postgres Changes. No polling needed for the main Kanban view. | HIGH |
| Server-Sent Events (SSE) | Native | Stream Claude CLI progress to frontend | For real-time progress of active squad sessions. API route streams stdout from the child process to the browser. Simpler than WebSockets for this unidirectional use case. | HIGH |
### Document Generation & Export
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @react-pdf/renderer | ^4.x | PDF generation for deliverables | React-based PDF generation. Define PDF templates as React components. Export market research reports, offer stacks, G-STIC plans as branded PDFs for client delivery. | MEDIUM |
| Supabase Storage | Built-in | File storage for deliverables | Store generated PDFs, Claude output files, uploaded briefings. Organized by client/phase/process. Signed URLs for secure sharing. | HIGH |
### Form Handling & Validation
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | ^3.x | Schema validation | Validate at every boundary: client intake forms, quality gate checklists, Claude CLI output parsing. Same schema validates frontend forms AND API inputs AND database writes. Single source of truth for data shape. | HIGH |
| React Hook Form | ^7.x | Form state management | Complex forms: client briefing (10+ fields), quality gate checklists (5-6 checkboxes with conditions), process configuration. Pairs with Zod via @hookform/resolvers. shadcn/ui Form component wraps this. | MEDIUM |
### Date & Time
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| date-fns | ^4.x | Date manipulation | Calculate "days in phase", "time since last gate", deadline tracking. Tree-shakeable (only import what you use). Lighter than dayjs for the operations this app needs. | MEDIUM |
### Monitoring & Error Tracking
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Sentry | ^8.x (@sentry/nextjs) | Error tracking + performance monitoring | Critical for a solo operator. If a Claude CLI squad fails silently at 2am, you need to know. Sentry catches unhandled errors in server components, API routes, and client-side. Performance monitoring shows slow dashboard loads. | MEDIUM |
### Testing
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | ^2.x | Unit + integration testing | Fast, TypeScript-native, compatible with Next.js. Test state machine transitions (XState), Zod schemas, CLI output parsing. | MEDIUM |
| Playwright | ^1.4x | E2E testing | Test critical flows: client intake -> phase progression -> gate approval. Verify Kanban board interactions. | MEDIUM |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| State Machine | XState v5 | Zustand + custom guards | Zustand has no concept of guarded transitions or state persistence. You would reimplement XState poorly. |
| State Machine | XState v5 | Simple enum + switch | Cannot enforce sequential phase order at the type level. No serialization. No visualization. Scales terribly as process complexity grows. |
| Job Queue | BullMQ + Redis | Supabase Edge Functions | Edge Functions cannot spawn local CLI processes. Different runtime (Deno). |
| Job Queue | BullMQ + Redis | Trigger.dev | Over-engineered for this use case. Adds another managed service. BullMQ is self-hosted and simpler. |
| Job Queue | BullMQ + Redis | Simple setTimeout / in-memory queue | No persistence across server restarts. No retry logic. No concurrency control. Production-unsuitable. |
| UI Components | shadcn/ui | Chakra UI / MUI | shadcn gives you the source code. No fighting component library opinions. Better for custom Kanban board styling. |
| Drag & Drop | @hello-pangea/dnd | dnd-kit | Both are viable. hello-pangea has simpler API for Kanban-style vertical lists. dnd-kit is more flexible but more boilerplate. |
| PDF Generation | @react-pdf/renderer | Puppeteer / html-pdf | React-pdf is declarative (React components). No headless browser dependency. Lighter, faster. |
| Data Fetching | RSC + React Query | SWR | React Query has better mutation support, better devtools, and better integration with Server Actions. |
| CSS | Tailwind CSS v4 | CSS Modules | Solo developer context: Tailwind is faster to iterate. No naming overhead. Built-in responsive/dark mode. |
| Database | Supabase (Postgres) | PlanetScale / Neon | Supabase is the project constraint. Also provides auth, storage, realtime, and edge functions -- not just database. |
## Architecture-Critical Decisions
### 1. Server Deployment: NOT Fully Serverless
- **Option A (Simpler):** Deploy everything to a VPS (Railway, Render, DigitalOcean App Platform). Next.js runs as a long-running Node.js process. BullMQ workers run alongside or as a separate process.
- **Option B (Split):** Deploy Next.js frontend to Vercel. Deploy a separate "worker service" (Express + BullMQ) on a VPS that handles CLI execution. Frontend communicates with worker via API.
### 2. Database Schema Strategy
### 3. XState Persistence Pattern
## Installation
# Initialize Next.js 16 project
# Core dependencies
# UI
# Data fetching & real-time
# Background jobs
# Document export
# Utilities
# Monitoring
# Dev dependencies
## What NOT to Use
| Technology | Why Not |
|------------|---------|
| Prisma | Supabase already gives you a typed client via `supabase gen types`. Adding Prisma adds complexity, a shadow schema, and conflicts with Supabase migrations. Use raw Supabase client with generated types. |
| NextAuth / Auth.js | Supabase Auth handles authentication. Adding NextAuth creates two auth systems fighting each other. |
| tRPC | With Server Actions in Next.js 16 and Zod validation, tRPC adds unnecessary complexity. Server Actions give you the same type safety with less boilerplate. |
| Redux / Zustand (for pipeline state) | Use XState for pipeline state. Zustand/Redux are for UI state, not domain state machines. You CAN use Zustand for simple UI state (sidebar open, filter selections) if needed, but the pipeline MUST be XState. |
| Agenda / node-cron (for job scheduling) | BullMQ handles scheduling, queuing, and retries. Agenda is Mongo-based (wrong database). node-cron has no persistence or retry logic. |
| Socket.io | Supabase Realtime + SSE covers all real-time needs. Socket.io adds a dependency for no benefit. |
| Electron / Tauri | Web-first per project constraints. Responsive web is sufficient. |
| GraphQL / Apollo | Supabase client already provides typed queries. GraphQL adds schema management overhead with no benefit for a single-consumer app. |
| Pages Router (Next.js) | App Router is the standard in Next.js 16. Pages Router is legacy. All new patterns (Server Components, Server Actions, PPR) require App Router. |
## Environment Variables
# Supabase
# Redis (for BullMQ)
# Sentry
# Claude CLI (verify these flags exist at integration time)
## Version Verification Notes
| Technology | Version Source | Confidence |
|------------|---------------|------------|
| Next.js 16.2 | Verified via nextjs.org/blog (March 2026 release) | HIGH |
| React 19.x | Ships with Next.js 16 (verified same source) | HIGH |
| Tailwind CSS v4 | Training data (released late 2024/early 2025) | MEDIUM -- verify at install |
| XState v5 | Training data (v5 stable released mid-2024) | MEDIUM -- verify at install |
| @supabase/supabase-js v2 | Training data (v2 stable since 2023) | MEDIUM -- may be v3 by now, verify |
| BullMQ v5 | Training data (v5 released 2024) | MEDIUM -- verify at install |
| @tanstack/react-query v5 | Training data (v5 released late 2023) | MEDIUM -- verify at install |
| shadcn/ui | Not versioned (copy-paste components) | HIGH -- always latest |
| Zod v3 | Training data (v3 since 2022, v4 may be out) | MEDIUM -- check if v4 released |
## Sources
- Next.js 16.2 release: https://nextjs.org/blog (verified via WebFetch, March 2026)
- Supabase docs: https://supabase.com/docs (could not verify current version -- access denied)
- XState docs: https://stately.ai/docs (could not verify -- access denied)
- Claude Code CLI docs: https://docs.anthropic.com/en/docs/claude-code (could not verify CLI flags -- access denied)
- All other versions: Based on training data with May 2025 cutoff. Flagged MEDIUM confidence accordingly.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| notebooklm | Use this skill to query your Google NotebookLM notebooks directly from Claude Code for source-grounded, citation-backed answers from Gemini. Browser automation, library management, persistent auth. Drastically reduced hallucinations through document-only responses. | `.claude/skills/notebooklm-skill/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
