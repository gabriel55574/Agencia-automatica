# Requirements: Agency OS v1.1

**Defined:** 2026-04-09
**Core Value:** One person manages 15+ clients at agency quality by combining a standardized marketing process with AI-powered squad automation

## v1.1 Requirements

### Tech Debt & Production

- [ ] **DEBT-01**: Fix tsx missing from package.json devDependencies so worker process can start via PM2
- [ ] **DEBT-02**: Regenerate TypeScript types from live database schema via supabase gen types
- [ ] **DEBT-03**: Execute integration tests against live Supabase instance and fix any failures
- [ ] **DEBT-04**: Remove orphaned ProcessRow export and (admin as any) type casts
- [ ] **PROD-01**: Deploy Next.js application to a self-hosted VPS with PM2 process management
- [ ] **PROD-02**: Configure production environment variables, SSL/TLS, and domain for the application
- [ ] **PROD-03**: Worker process runs in production alongside the Next.js app with health monitoring

### Cost Tracking

- [ ] **COST-01**: Operator can see estimated AI token usage and cost per squad run after it completes
- [ ] **COST-02**: Operator can view a monthly cost breakdown by client showing total spend per client
- [ ] **COST-03**: Operator can set per-process token budgets with visual alerts when a run approaches or exceeds the limit
- [ ] **COST-04**: Dashboard shows a monthly cost summary widget with total spend and top-spending clients

### Notifications

- [ ] **NOTF-01**: Operator receives an email when a squad run completes (success or failure)
- [ ] **NOTF-02**: Operator receives an email when a quality gate review produces a FAIL or PARTIAL verdict
- [ ] **NOTF-03**: Operator receives a daily digest email summarizing pipeline status across all clients (phase progress, pending approvals, stuck clients)

### Analytics

- [ ] **ANLY-01**: Operator can view average time per phase across all clients on an analytics page
- [ ] **ANLY-02**: Operator can view process success rate (first-pass gate approval rate) per phase
- [ ] **ANLY-03**: Operator can view client lifecycle metrics (average time from intake to Phase 5 completion)
- [ ] **ANLY-04**: Analytics page shows trend charts (line/bar) for key metrics over configurable time periods

### Templates

- [ ] **TMPL-01**: Operator can save a successful squad output as a named template for reuse with similar clients
- [ ] **TMPL-02**: Operator can clone a client configuration (briefing, process settings) to quickly onboard similar clients
- [ ] **TMPL-03**: When triggering a squad run, operator can optionally select a template to include as reference context in the prompt

## v2 Requirements (Deferred)

- **TEAM-01**: Multi-user support with roles and permissions
- **PORT-01**: Client-facing portal for deliverable access
- **INTG-01**: Integration with external tools (CRM, project management)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Team collaboration / multi-user | Solo operator only — no roles, permissions, or team features for v1.x |
| Client-facing portal | Clients don't log in; operator shares exports manually |
| Custom process builder | The 5-phase/16-process framework is fixed — it IS the product |
| Real-time chat/messaging | Communication happens outside the system |
| Payment/billing | Invoicing handled externally |
| Mobile app | Web-first, responsive design is sufficient |
| Claude API integration | Using Claude Code CLI exclusively |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEBT-01 | TBD | Pending |
| DEBT-02 | TBD | Pending |
| DEBT-03 | TBD | Pending |
| DEBT-04 | TBD | Pending |
| PROD-01 | TBD | Pending |
| PROD-02 | TBD | Pending |
| PROD-03 | TBD | Pending |
| COST-01 | TBD | Pending |
| COST-02 | TBD | Pending |
| COST-03 | TBD | Pending |
| COST-04 | TBD | Pending |
| NOTF-01 | TBD | Pending |
| NOTF-02 | TBD | Pending |
| NOTF-03 | TBD | Pending |
| ANLY-01 | TBD | Pending |
| ANLY-02 | TBD | Pending |
| ANLY-03 | TBD | Pending |
| ANLY-04 | TBD | Pending |
| TMPL-01 | TBD | Pending |
| TMPL-02 | TBD | Pending |
| TMPL-03 | TBD | Pending |

**Coverage:**
- v1.1 requirements: 21 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 21

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09*
