import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PipelineAccordion } from '@/components/clients/pipeline-accordion'
import { ArchiveDialog } from '@/components/clients/archive-dialog'
import { ProcessJobsSection } from '@/components/clients/process-jobs-section'
import type { Json } from '@/lib/database/types'
import type { PhaseRow, ProcessRow, GateRow } from '@/lib/types/pipeline'

interface ClientProfilePageProps {
  params: Promise<{ id: string }>
}

// Type guard for briefing JSON shape
function parseBriefing(raw: Json | null) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const b = raw as Record<string, unknown>
  return {
    niche: typeof b.niche === 'string' ? b.niche : null,
    target_audience: typeof b.target_audience === 'string' ? b.target_audience : null,
    additional_context: typeof b.additional_context === 'string' ? b.additional_context : null,
  }
}

export default async function ClientProfilePage({ params }: ClientProfilePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: phases }, { data: processes }, { data: gates }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, company, briefing, current_phase_number, status, created_at, updated_at')
      .eq('id', id)
      .single(),
    supabase
      .from('phases')
      .select('id, phase_number, name, status, started_at, completed_at')
      .eq('client_id', id)
      .order('phase_number', { ascending: true }),
    supabase
      .from('processes')
      .select('id, phase_id, process_number, name, squad, status')
      .eq('client_id', id)
      .order('process_number', { ascending: true }),
    supabase
      .from('quality_gates')
      .select('id, phase_id, gate_number, status, operator_decision, operator_notes')
      .eq('client_id', id)
      .order('gate_number', { ascending: true }),
  ])

  if (!client) notFound()

  // Fetch most recent squad_job per process for job status badges (D-04, D-07)
  const processIds = (processes ?? []).map((p) => p.id)
  const { data: activeJobs } = processIds.length > 0
    ? await supabase
        .from('squad_jobs')
        .select('id, status, process_id')
        .in('process_id', processIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Build a Map<processId, { id, status }> of the most recent job per process
  const jobsByProcessId = new Map<string, { id: string; status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' }>()
  for (const job of activeJobs ?? []) {
    if (job.process_id && !jobsByProcessId.has(job.process_id)) {
      jobsByProcessId.set(job.process_id, {
        id: job.id,
        status: job.status as 'queued' | 'running' | 'completed' | 'failed' | 'cancelled',
      })
    }
  }

  // Serialize Map to plain object for client component prop
  const jobsByProcessIdObj: Record<string, { id: string; status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' }> = {}
  for (const [key, value] of jobsByProcessId.entries()) {
    jobsByProcessIdObj[key] = value
  }

  const briefing = parseBriefing(client.briefing)
  const isArchived = client.status === 'archived'

  return (
    <div className="max-w-3xl space-y-8">

      {/* ---- Header ---- */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-zinc-900 truncate">{client.name}</h1>
            <Badge variant={isArchived ? 'secondary' : 'default'}>
              {isArchived ? 'Archived' : 'Active'}
            </Badge>
          </div>
          {/* Text node only — never dangerouslySetInnerHTML (T-2-02-05) */}
          <p className="text-zinc-500">{client.company}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/clients/${client.id}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <ArchiveDialog
            clientId={client.id}
            clientName={client.name}
            isArchived={isArchived}
          />
        </div>
      </div>

      <Separator />

      {/* ---- Briefing section ---- */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Briefing</h2>
        {briefing ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Niche</dt>
              {/* Text node only — never dangerouslySetInnerHTML (T-2-02-05) */}
              <dd className="text-sm text-zinc-800">{briefing.niche ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Target Audience</dt>
              <dd className="text-sm text-zinc-800">{briefing.target_audience ?? '—'}</dd>
            </div>
            {briefing.additional_context && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Additional Context</dt>
                <dd className="text-sm text-zinc-800 whitespace-pre-wrap">{briefing.additional_context}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-zinc-400">No briefing information recorded yet.</p>
        )}
      </div>

      <Separator />

      {/* ---- Pipeline accordion (replaces PipelineTimeline) ---- */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Pipeline</h2>
        {phases && phases.length > 0 ? (
          <PipelineAccordion
            phases={phases as PhaseRow[]}
            processes={(processes ?? []) as ProcessRow[]}
            gates={(gates ?? []) as GateRow[]}
            clientId={client.id}
            clientName={client.name}
          />
        ) : (
          <p className="text-sm text-zinc-400">Pipeline phases not initialized.</p>
        )}
      </div>

      <Separator />

      {/* ---- Squad Job Status section (Phase 4 — real-time process job badges) ---- */}
      {processes && processes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Squad Jobs</h2>
          <ProcessJobsSection
            processes={(processes ?? []) as ProcessRow[]}
            initialJobsByProcessId={jobsByProcessIdObj}
          />
        </div>
      )}

      <Separator />

      {/* ---- Outputs section (placeholder — Phase 7) ---- */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">Outputs</h2>
        <p className="text-sm text-zinc-400">
          Outputs will appear here as squads complete processes.
        </p>
      </div>

    </div>
  )
}
