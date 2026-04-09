import { describe, it, expect } from 'vitest'
import { squadCompletionTemplate, gateFailureTemplate, dailyDigestTemplate } from '../../src/lib/notifications/templates'
import type { SquadCompletionData, GateFailureData, DigestData } from '../../src/lib/notifications/types'

describe('squadCompletionTemplate', () => {
  const baseData: SquadCompletionData = {
    client_name: 'Acme Corp',
    client_company: 'Acme Inc',
    process_name: 'Market Research',
    squad_type: 'estrategia',
    status: 'completed',
    error_excerpt: null,
    completed_at: '2026-04-09T15:30:00Z',
  }

  it('returns valid HTML with DOCTYPE', () => {
    const html = squadCompletionTemplate(baseData)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })

  it('includes client name and company', () => {
    const html = squadCompletionTemplate(baseData)
    expect(html).toContain('Acme Corp')
    expect(html).toContain('Acme Inc')
  })

  it('shows COMPLETED badge for successful runs', () => {
    const html = squadCompletionTemplate(baseData)
    expect(html).toContain('COMPLETED')
    expect(html).toContain('#dcfce7')
  })

  it('shows FAILED badge for failed runs', () => {
    const data: SquadCompletionData = { ...baseData, status: 'failed', error_excerpt: 'Rate limit exceeded' }
    const html = squadCompletionTemplate(data)
    expect(html).toContain('FAILED')
    expect(html).toContain('#fef2f2')
  })

  it('includes error excerpt for failed runs', () => {
    const data: SquadCompletionData = { ...baseData, status: 'failed', error_excerpt: 'Connection timeout after 30s' }
    const html = squadCompletionTemplate(data)
    expect(html).toContain('Connection timeout after 30s')
  })

  it('does not include error box for successful runs', () => {
    const html = squadCompletionTemplate(baseData)
    // The error_box style is only used for failed runs with error_excerpt
    expect(html).not.toContain('border-left: 3px solid #ef4444')
  })

  it('escapes HTML in client name', () => {
    const data: SquadCompletionData = { ...baseData, client_name: '<script>alert("xss")</script>' }
    const html = squadCompletionTemplate(data)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('includes process name and squad type', () => {
    const html = squadCompletionTemplate(baseData)
    expect(html).toContain('Market Research')
    expect(html).toContain('estrategia')
  })

  it('includes completion timestamp', () => {
    const html = squadCompletionTemplate(baseData)
    expect(html).toContain('2026-04-09T15:30:00Z')
  })
})

describe('gateFailureTemplate', () => {
  const baseData: GateFailureData = {
    client_name: 'Beta LLC',
    client_company: 'Beta Group',
    phase_name: 'Diagnostico',
    gate_number: 1,
    overall_verdict: 'fail',
    failed_items_count: 3,
    total_items_count: 5,
    summary: 'Missing market research outputs',
  }

  it('returns valid HTML with DOCTYPE', () => {
    const html = gateFailureTemplate(baseData)
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('shows FAIL badge for fail verdict', () => {
    const html = gateFailureTemplate(baseData)
    expect(html).toContain('FAIL')
    expect(html).toContain('#fef2f2')
  })

  it('shows PARTIAL badge for partial verdict', () => {
    const data: GateFailureData = { ...baseData, overall_verdict: 'partial' }
    const html = gateFailureTemplate(data)
    expect(html).toContain('PARTIAL')
    expect(html).toContain('#fefce8')
  })

  it('includes failed items count', () => {
    const html = gateFailureTemplate(baseData)
    expect(html).toContain('3 of 5')
  })

  it('includes summary', () => {
    const html = gateFailureTemplate(baseData)
    expect(html).toContain('Missing market research outputs')
  })

  it('includes gate number', () => {
    const html = gateFailureTemplate(baseData)
    expect(html).toContain('Gate 1')
  })

  it('includes client name and company', () => {
    const html = gateFailureTemplate(baseData)
    expect(html).toContain('Beta LLC')
    expect(html).toContain('Beta Group')
  })

  it('includes phase name', () => {
    const html = gateFailureTemplate(baseData)
    expect(html).toContain('Diagnostico')
  })
})

describe('dailyDigestTemplate', () => {
  const baseData: DigestData = {
    date: '2026-04-09',
    clients_by_phase: [
      { phase_number: 1, phase_name: 'Diagnostico', count: 3 },
      { phase_number: 2, phase_name: 'Engenharia de Valor', count: 2 },
      { phase_number: 3, phase_name: 'Go-to-Market', count: 1 },
    ],
    pending_approvals: 2,
    failed_gates: 1,
    stuck_clients: [
      { name: 'Slow Co', company: 'Slow Inc', phase: 'Diagnostico', days_stuck: 14 },
    ],
    yesterday_completed_runs: 5,
    total_active_clients: 6,
  }

  it('returns valid HTML with DOCTYPE', () => {
    const html = dailyDigestTemplate(baseData)
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('includes date in content', () => {
    const html = dailyDigestTemplate(baseData)
    expect(html).toContain('2026-04-09')
  })

  it('includes total active clients count', () => {
    const html = dailyDigestTemplate(baseData)
    expect(html).toContain('>6<')
  })

  it('includes completed runs count', () => {
    const html = dailyDigestTemplate(baseData)
    expect(html).toContain('>5<')
  })

  it('includes pending approvals count', () => {
    const html = dailyDigestTemplate(baseData)
    expect(html).toContain('>2<')
  })

  it('includes phase names in table', () => {
    const html = dailyDigestTemplate(baseData)
    expect(html).toContain('Diagnostico')
    expect(html).toContain('Engenharia de Valor')
    expect(html).toContain('Go-to-Market')
  })

  it('includes stuck client info', () => {
    const html = dailyDigestTemplate(baseData)
    expect(html).toContain('Slow Co')
    expect(html).toContain('14d')
  })

  it('shows "No stuck clients" when list is empty', () => {
    const data: DigestData = { ...baseData, stuck_clients: [] }
    const html = dailyDigestTemplate(data)
    expect(html).toContain('No stuck clients')
  })

  it('highlights pending approvals when count > 0', () => {
    const html = dailyDigestTemplate(baseData)
    expect(html).toContain('#854d0e') // warning color for pending > 0
  })

  it('highlights failed gates when count > 0', () => {
    const html = dailyDigestTemplate(baseData)
    expect(html).toContain('#991b1b') // danger color for failed > 0
  })
})
