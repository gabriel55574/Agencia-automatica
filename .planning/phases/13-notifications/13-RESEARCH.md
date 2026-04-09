# Phase 13: Notifications - Research

**Researched:** 2026-04-09
**Phase Goal:** Operator receives timely email alerts for critical pipeline events so they can respond without constantly checking the dashboard

## Research Question

What do I need to know to PLAN this phase well?

## 1. Architecture Approach: Worker-Side Notifications vs Edge Functions

### Context Decision (from 13-CONTEXT.md)
The context proposes using Supabase Edge Functions triggered by database triggers via pg_net. However, based on codebase analysis, there is a simpler and more maintainable approach.

### Recommended: Worker-Side Email Sending (NOTF-01, NOTF-02)

**Rationale:** The worker process (`src/worker/job-runner.ts`) already handles the exact events that trigger notifications:

1. **Squad run completion** (NOTF-01): The `runJob()` function in `job-runner.ts` (lines 165-273) already has the completion/failure code path. After updating `squad_jobs.status` to `completed` or `failed`, we can call a notification function directly.

2. **Gate review verdicts** (NOTF-02): The same `runJob()` function (lines 199-245) already parses gate review verdicts and stores them. When `verdictResult.data.overall` is `'fail'` or `'partial'`, we can trigger a notification right there.

**Advantages over Edge Functions:**
- No new infrastructure (pg_net extension, database triggers, Edge Function runtime)
- No network hop (worker already has the data in memory)
- Easier to test and debug (same Node.js process)
- No Supabase Cloud Edge Function deployment needed
- Access to full Node.js ecosystem (email SDKs work natively)

**Architecture:**
```
Worker Process
  └── job-runner.ts (existing)
        ├── runJob() success path → send completion email
        ├── runJob() gate_review path → send gate alert email
        └── handleFailure() exhausted retries → send failure email
```

### Daily Digest (NOTF-03): node-cron in Worker

For the daily digest, use `node-cron` in the worker process instead of pg_cron:
- Worker already runs as a long-lived PM2 process
- `node-cron` is lightweight (~10KB) and well-maintained
- Avoids requiring pg_cron extension on Supabase Cloud (which requires Pro plan)
- Digest logic can reuse the same Supabase admin client already initialized in `src/worker/index.ts`

## 2. Email Provider: Resend

**Context decision confirmed.** Resend is the right choice:
- Simple REST API — single `fetch()` call per email
- 100 emails/day free tier (more than sufficient for solo operator)
- No SMTP configuration needed
- `resend` npm package is 15KB, zero dependencies
- Good TypeScript support

**Integration pattern:**
```typescript
// src/lib/notifications/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string) {
  return resend.emails.send({
    from: 'Agency OS <noreply@yourdomain.com>',
    to,
    subject,
    html,
  })
}
```

**Environment variables needed:**
- `RESEND_API_KEY` — Resend API key
- `NOTIFICATION_EMAIL` — Operator email address (or read from Supabase Auth user profile)
- `NOTIFICATION_FROM_EMAIL` — Verified sender domain in Resend

## 3. Database Schema Additions

### notification_preferences table
Store operator notification settings so they can be toggled without code changes:

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  squad_completion_enabled BOOLEAN NOT NULL DEFAULT true,
  gate_failure_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT true,
  digest_hour_utc SMALLINT NOT NULL DEFAULT 8 CHECK (digest_hour_utc BETWEEN 0 AND 23),
  email_override TEXT, -- optional override, otherwise uses auth.users.email
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### notification_log table
Track sent notifications for debugging and preventing duplicates:

```sql
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('squad_completion', 'gate_failure', 'daily_digest')),
  reference_id UUID, -- squad_job.id or gate_review.id
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 4. Existing Code Integration Points

### Worker: job-runner.ts modifications
- **Line 171-172** (success path): After `squad_jobs.update({ status: 'completed' })`, call `notifySquadCompletion(job)`
- **Line 258-272** (failure with exhausted retries): After `handleFailure()` marks as permanently failed, call `notifySquadFailure(job)`
- **Lines 199-245** (gate_review path): After storing verdict with `overall: 'fail'|'partial'`, call `notifyGateFailure(job, verdict)`

### Worker: index.ts modifications
- Add `node-cron` schedule for daily digest
- Digest function queries same data as `fetchDashboardData()` but using admin client

### Data needed for emails
All data is already available in the worker context at notification time:
- `job.client_id` → query `clients.name, clients.company`
- `job.squad_type` → already on the job object
- `job.process_id` → already on the job object
- Gate verdict → already parsed in the gate_review code path

### Dashboard queries reuse
`src/lib/dashboard/queries.ts` `fetchDashboardData()` fetches:
- Clients by phase (columns)
- Pending approvals (gates with status 'pending'/'evaluating')
- Failed gates (status 'rejected')
- Running jobs

The daily digest needs the same data. Create a `fetchDigestData()` function using the admin client (not the SSR client) that returns the same shape.

## 5. Email Templates

### Template approach
Use inline HTML strings (no template engine needed for 3 email types):

1. **Squad completion email**: Client name, process name, squad type, status badge, timestamp
2. **Gate failure email**: Client name, phase name, gate number, overall verdict, failed items count
3. **Daily digest email**: Styled HTML table with clients by phase, pending approvals count, stuck clients list

### Template location
`src/lib/notifications/templates.ts` — pure functions returning HTML strings. No React dependency in the worker process.

## 6. Error Handling

Email sending should NEVER fail the main operation:
- Wrap all `sendEmail()` calls in try/catch
- Log failures to `notification_log` table
- Log to stdout for PM2 visibility
- Never throw — email failure must not affect squad job status

## 7. Testing Strategy

### Unit tests
- Template rendering (snapshot tests)
- Notification preference lookup
- Digest data assembly

### Integration tests
- Email sending with Resend (mock in test, verify API call shape)
- Database trigger → notification flow (test notification_log entries)

## 8. Dependencies to Add

| Package | Version | Purpose |
|---------|---------|---------|
| `resend` | `^4.x` | Email sending API |
| `node-cron` | `^3.x` | Cron scheduling for daily digest |
| `@types/node-cron` | `^3.x` | TypeScript types (devDependency) |

## 9. File Structure

```
src/lib/notifications/
  ├── email.ts          — Resend client wrapper, sendEmail()
  ├── templates.ts      — HTML template functions for each email type
  ├── digest.ts         — fetchDigestData() and assembleDigest()
  ├── notify.ts         — notifySquadCompletion(), notifyGateFailure(), notifyDailyDigest()
  └── preferences.ts    — getNotificationPreferences()

supabase/migrations/
  └── 00010_notification_tables.sql  — notification_preferences + notification_log tables

src/worker/
  ├── job-runner.ts     — Modified: call notification functions after completion/failure
  └── index.ts          — Modified: add node-cron daily digest schedule
```

## 10. Security Considerations

- RESEND_API_KEY must be in environment variables only (never committed)
- Operator email comes from auth.users or notification_preferences — not from request input
- Email content is server-generated — no user input in templates (XSS-safe)
- Rate limiting: Resend handles rate limits; we log failures and don't retry emails

## 11. Validation Architecture

### What must be validated
1. Email sending actually works with Resend API key
2. Worker process correctly triggers notifications on job completion
3. Worker process correctly triggers notifications on gate failure
4. Daily digest cron fires and sends email
5. Notification preferences are respected (disabled = no email)
6. Notification log entries are created for all sent emails

### Validation approach
- Integration test: Mock Resend API, run worker job completion flow, verify notification_log entry
- Unit test: Template functions produce valid HTML with expected content
- Manual validation: Trigger a squad job, verify email received

## RESEARCH COMPLETE
