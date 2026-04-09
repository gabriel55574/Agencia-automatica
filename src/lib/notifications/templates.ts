/**
 * Agency OS: Email HTML templates
 *
 * Pure functions that return complete HTML strings for each notification type.
 * All styling is inline CSS for email client compatibility.
 * These functions have NO side effects and NO external dependencies beyond types.
 */

import type { SquadCompletionData, GateFailureData, DigestData } from './types'

const STYLES = {
  container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;',
  header: 'font-size: 18px; font-weight: 600; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;',
  badge_success: 'display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; background: #dcfce7; color: #166534;',
  badge_failure: 'display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; background: #fef2f2; color: #991b1b;',
  badge_partial: 'display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; background: #fefce8; color: #854d0e;',
  row: 'padding: 8px 0; border-bottom: 1px solid #f3f4f6;',
  label: 'font-size: 13px; color: #6b7280; min-width: 120px; display: inline-block;',
  value: 'font-size: 14px; font-weight: 500;',
  error_box: 'margin-top: 16px; padding: 12px; background: #fef2f2; border-left: 3px solid #ef4444; font-family: monospace; font-size: 13px; white-space: pre-wrap; color: #991b1b;',
  table: 'width: 100%; border-collapse: collapse; margin: 12px 0;',
  th: 'text-align: left; padding: 8px 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 13px; color: #6b7280;',
  td: 'padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px;',
  footer: 'margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;',
} as const

/**
 * Escape HTML entities to prevent XSS in email content.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin: 0; padding: 20px; background: #f9fafb;">
<div style="${STYLES.container}">
${body}
<div style="${STYLES.footer}">Agency OS — Automated notification</div>
</div>
</body>
</html>`
}

/**
 * Squad run completion/failure email template (NOTF-01).
 */
export function squadCompletionTemplate(data: SquadCompletionData): string {
  const statusBadge = data.status === 'completed'
    ? `<span style="${STYLES.badge_success}">COMPLETED</span>`
    : `<span style="${STYLES.badge_failure}">FAILED</span>`

  const errorSection = data.status === 'failed' && data.error_excerpt
    ? `<div style="${STYLES.error_box}">${escapeHtml(data.error_excerpt)}</div>`
    : ''

  const body = `
<div style="${STYLES.header}">Squad Run ${data.status === 'completed' ? 'Completed' : 'Failed'}</div>
<div style="${STYLES.row}">
  <span style="${STYLES.label}">Client</span>
  <span style="${STYLES.value}">${escapeHtml(data.client_name)} (${escapeHtml(data.client_company)})</span>
</div>
<div style="${STYLES.row}">
  <span style="${STYLES.label}">Process</span>
  <span style="${STYLES.value}">${escapeHtml(data.process_name)}</span>
</div>
<div style="${STYLES.row}">
  <span style="${STYLES.label}">Squad</span>
  <span style="${STYLES.value}">${escapeHtml(data.squad_type)}</span>
</div>
<div style="${STYLES.row}">
  <span style="${STYLES.label}">Status</span>
  ${statusBadge}
</div>
<div style="${STYLES.row}">
  <span style="${STYLES.label}">Completed</span>
  <span style="${STYLES.value}">${escapeHtml(data.completed_at)}</span>
</div>
${errorSection}`

  const subject = data.status === 'completed'
    ? `[Agency OS] Squad run completed — ${data.client_name}`
    : `[Agency OS] Squad run FAILED — ${data.client_name}`

  return wrapHtml(subject, body)
}

/**
 * Gate review failure/partial email template (NOTF-02).
 */
export function gateFailureTemplate(data: GateFailureData): string {
  const verdictBadge = data.overall_verdict === 'fail'
    ? `<span style="${STYLES.badge_failure}">FAIL</span>`
    : `<span style="${STYLES.badge_partial}">PARTIAL</span>`

  const body = `
<div style="${STYLES.header}">Quality Gate ${data.overall_verdict === 'fail' ? 'Failed' : 'Partial Pass'}</div>
<div style="${STYLES.row}">
  <span style="${STYLES.label}">Client</span>
  <span style="${STYLES.value}">${escapeHtml(data.client_name)} (${escapeHtml(data.client_company)})</span>
</div>
<div style="${STYLES.row}">
  <span style="${STYLES.label}">Phase</span>
  <span style="${STYLES.value}">${escapeHtml(data.phase_name)}</span>
</div>
<div style="${STYLES.row}">
  <span style="${STYLES.label}">Gate</span>
  <span style="${STYLES.value}">Gate ${data.gate_number}</span>
</div>
<div style="${STYLES.row}">
  <span style="${STYLES.label}">Verdict</span>
  ${verdictBadge}
</div>
<div style="${STYLES.row}">
  <span style="${STYLES.label}">Failed Items</span>
  <span style="${STYLES.value}">${data.failed_items_count} of ${data.total_items_count}</span>
</div>
<div style="margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 4px;">
  <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Summary</div>
  <div style="font-size: 14px;">${escapeHtml(data.summary)}</div>
</div>`

  return wrapHtml(
    `[Agency OS] Gate ${data.gate_number} ${data.overall_verdict} — ${data.client_name}`,
    body
  )
}

/**
 * Daily digest email template (NOTF-03).
 */
export function dailyDigestTemplate(data: DigestData): string {
  const phaseRows = data.clients_by_phase
    .map(p => `<tr><td style="${STYLES.td}">${escapeHtml(p.phase_name)}</td><td style="${STYLES.td}">${p.count}</td></tr>`)
    .join('')

  const stuckRows = data.stuck_clients.length > 0
    ? data.stuck_clients
        .map(c => `<tr><td style="${STYLES.td}">${escapeHtml(c.name)}</td><td style="${STYLES.td}">${escapeHtml(c.phase)}</td><td style="${STYLES.td}">${c.days_stuck}d</td></tr>`)
        .join('')
    : `<tr><td style="${STYLES.td}" colspan="3">No stuck clients</td></tr>`

  const body = `
<div style="${STYLES.header}">Daily Digest — ${escapeHtml(data.date)}</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td style="padding: 12px; background: #f0fdf4; border-radius: 6px; text-align: center; width: 25%;">
      <div style="font-size: 24px; font-weight: 700; color: #166534;">${data.total_active_clients}</div>
      <div style="font-size: 12px; color: #6b7280;">Active Clients</div>
    </td>
    <td style="padding: 12px; background: #eff6ff; border-radius: 6px; text-align: center; width: 25%;">
      <div style="font-size: 24px; font-weight: 700; color: #1e40af;">${data.yesterday_completed_runs}</div>
      <div style="font-size: 12px; color: #6b7280;">Runs Yesterday</div>
    </td>
    <td style="padding: 12px; background: ${data.pending_approvals > 0 ? '#fefce8' : '#f9fafb'}; border-radius: 6px; text-align: center; width: 25%;">
      <div style="font-size: 24px; font-weight: 700; color: ${data.pending_approvals > 0 ? '#854d0e' : '#6b7280'};">${data.pending_approvals}</div>
      <div style="font-size: 12px; color: #6b7280;">Pending Approvals</div>
    </td>
    <td style="padding: 12px; background: ${data.failed_gates > 0 ? '#fef2f2' : '#f9fafb'}; border-radius: 6px; text-align: center; width: 25%;">
      <div style="font-size: 24px; font-weight: 700; color: ${data.failed_gates > 0 ? '#991b1b' : '#6b7280'};">${data.failed_gates}</div>
      <div style="font-size: 12px; color: #6b7280;">Failed Gates</div>
    </td>
  </tr>
</table>

<div style="margin-bottom: 20px;">
  <div style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">Clients by Phase</div>
  <table style="${STYLES.table}">
    <thead><tr><th style="${STYLES.th}">Phase</th><th style="${STYLES.th}">Clients</th></tr></thead>
    <tbody>${phaseRows}</tbody>
  </table>
</div>

<div style="margin-bottom: 20px;">
  <div style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">Stuck Clients</div>
  <table style="${STYLES.table}">
    <thead><tr><th style="${STYLES.th}">Client</th><th style="${STYLES.th}">Phase</th><th style="${STYLES.th}">Days</th></tr></thead>
    <tbody>${stuckRows}</tbody>
  </table>
</div>`

  return wrapHtml(`[Agency OS] Daily Digest — ${data.date}`, body)
}
