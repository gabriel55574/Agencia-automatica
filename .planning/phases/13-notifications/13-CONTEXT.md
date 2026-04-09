# Phase 13: Notifications - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Operator receives timely email alerts for critical pipeline events so they can respond without constantly checking the dashboard.

Requirements: NOTF-01, NOTF-02, NOTF-03
- NOTF-01: Operator receives email when a squad run completes (success or failure)
- NOTF-02: Operator receives email when a quality gate review produces FAIL or PARTIAL verdict
- NOTF-03: Operator receives daily digest email summarizing pipeline status across all clients

</domain>

<decisions>
## Implementation Decisions

### Email Infrastructure
- Use Supabase Edge Functions for sending emails (no additional service needed)
- Email provider: Resend (simple API, generous free tier, good for transactional email)
- Operator email stored in Supabase Auth user profile (already exists from login)
- Edge Function triggered by database webhooks (Supabase pg_net or database triggers)

### Squad Run Completion Email (NOTF-01)
- Triggered when squad_jobs.status changes to 'completed' or 'failed'
- Database trigger calls Edge Function via pg_net HTTP extension
- Email contains: client name, process name, squad type, status (success/failure), timestamp
- For failures: include error message excerpt from progress_log

### Gate Review Alert (NOTF-02)
- Triggered when gate_reviews row is inserted with verdict.overall = 'fail' or 'partial'
- Database trigger calls Edge Function
- Email contains: client name, phase name, gate number, overall verdict, count of failed items, link to client profile

### Daily Digest (NOTF-03)
- Supabase pg_cron extension schedules a daily Edge Function at 08:00 UTC
- Digest includes: clients by phase (summary counts), pending approvals, failed gates, stuck clients, yesterday's completed runs
- HTML email template with clean formatting

### Claude's Discretion
- Email HTML template styling and layout
- Exact timing of daily digest (suggest 08:00 UTC)
- Whether to batch multiple events into a single email (suggest: don't batch for NOTF-01/02, send immediately)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/dashboard/queries.ts` — fetchDashboardData already builds the data the digest needs
- `supabase/migrations/` — add new migration for triggers
- Supabase Edge Functions runtime (Deno) already available

### Integration Points
- squad_jobs table — trigger on status change
- gate_reviews table — trigger on INSERT
- pg_cron for daily digest scheduling
- Supabase Edge Functions for email sending

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond ROADMAP success criteria.

</specifics>

<deferred>
## Deferred Ideas

- SMS notifications
- Slack/webhook integration
- Per-client notification preferences

</deferred>
