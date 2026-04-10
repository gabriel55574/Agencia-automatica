export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PHASE_NAMES, type PhaseNumber } from '@/lib/database/enums'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArchiveDialog } from '@/components/clients/archive-dialog'
import { CycleBadge } from '@/components/clients/cycle-badge'
import { ResetPipelineDialog } from '@/components/clients/reset-pipeline-dialog'
import { CloneClientDialog } from '@/components/clients/clone-client-dialog'
import { ClientProfileTabs } from '@/components/clients/client-profile-tabs'
import { fetchProcessBudgetUsage } from '@/lib/costs/queries'
import type { Json } from '@/lib/database/types'
import type { PhaseRow, ProcessRow, GateRow, GateReviewRow, LatestJobData } from '@/lib/types/pipeline'
import type { CompletedJob, ProcessWithRuns, GateReviewOutput } from '@/lib/types/outputs'

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
      .select('id, name, company, briefing, current_phase_number, status, cycle_number, created_at, updated_at')
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

  // Fetch most recent squad_job per process for job status badges + output display (D-04, D-07, D-15)
  const processIds = (processes ?? []).map((p) => p.id)
  const { data: activeJobs } = processIds.length > 0
    ? await supabase
        .from('squad_jobs')
        .select('id, status, process_id, structured_output, output, token_count, estimated_cost_usd')
        .in('process_id', processIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Build a Map<processId, LatestJobData> of the most recent job per process
  const jobsByProcessId = new Map<string, LatestJobData>()
  for (const job of activeJobs ?? []) {
    if (job.process_id && !jobsByProcessId.has(job.process_id)) {
      jobsByProcessId.set(job.process_id, {
        id: job.id,
        status: job.status as LatestJobData['status'],
        structured_output: (job.structured_output as Record<string, unknown>) ?? null,
        output: (job.output as string) ?? null,
        token_count: (job.token_count as number) ?? null,
        estimated_cost_usd: (job.estimated_cost_usd as number) ?? null,
      })
    }
  }

  // Serialize Map to plain object for client component prop
  const jobsByProcessIdObj: Record<string, LatestJobData> = {}
  for (const [key, value] of jobsByProcessId.entries()) {
    jobsByProcessIdObj[key] = value
  }

  // Fetch most recent gate review per gate for AI verdict display (Phase 6)
  const gateIds = (gates ?? []).map((g) => g.id)
  const { data: gateReviewsRaw } = gateIds.length > 0
    ? await supabase
        .from('gate_reviews')
        .select('id, gate_id, client_id, squad_job_id, verdict, raw_output, status, created_at')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Build a Map<gate_id, GateReviewRow> of the most recent review per gate
  const latestReviewsByGateId: Record<string, GateReviewRow> = {}
  for (const review of gateReviewsRaw ?? []) {
    const gateId = review.gate_id as string
    if (!latestReviewsByGateId[gateId]) {
      latestReviewsByGateId[gateId] = {
        id: review.id as string,
        gate_id: gateId,
        client_id: review.client_id as string,
        squad_job_id: (review.squad_job_id as string) ?? null,
        verdict: (review.verdict as Record<string, unknown>) ?? {},
        raw_output: (review.raw_output as string) ?? '',
        status: review.status as 'running' | 'completed' | 'failed',
        created_at: review.created_at as string,
      }
    }
  }

  // Fetch budget usage for processes with token budgets (Phase 12, COST-03)
  const budgetUsage = await fetchProcessBudgetUsage(id)

  // Fetch completed squad jobs for outputs tab (Phase 19, UX-03)
  const { data: completedJobs } = await supabase
    .from('squad_jobs')
    .select('id, process_id, squad_type, status, structured_output, output, created_at, started_at, completed_at')
    .eq('client_id', id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  // Build Map<processId, CompletedJob[]> for outputs tab
  const completedJobsByProcessId = new Map<string, CompletedJob[]>()
  for (const job of completedJobs ?? []) {
    if (!job.process_id) continue
    const processId = job.process_id as string
    if (!completedJobsByProcessId.has(processId)) {
      completedJobsByProcessId.set(processId, [])
    }
    completedJobsByProcessId.get(processId)!.push({
      id: job.id,
      processId,
      squadType: job.squad_type,
      structuredOutput: (job.structured_output as Record<string, unknown>) ?? null,
      output: (job.output as string) ?? null,
      createdAt: job.created_at,
      startedAt: (job.started_at as string) ?? null,
      completedAt: (job.completed_at as string) ?? null,
    })
  }

  // Build phase_id -> phase_number map for outputs grouping
  const phaseNumberById = new Map<string, number>()
  for (const phase of phases ?? []) {
    phaseNumberById.set(phase.id, phase.phase_number)
  }

  // Build processes with runs grouped by phase for outputs tab
  const processesWithRuns: ProcessWithRuns[] = []
  for (const proc of processes ?? []) {
    const runs = completedJobsByProcessId.get(proc.id) ?? []
    if (runs.length === 0) continue
    const phaseNum = phaseNumberById.get(proc.phase_id) ?? 1
    processesWithRuns.push({
      processId: proc.id,
      processName: proc.name,
      processNumber: proc.process_number,
      squad: proc.squad,
      phaseNumber: phaseNum,
      phaseName: PHASE_NAMES[phaseNum as PhaseNumber] ?? `Phase ${phaseNum}`,
      runs,
    })
  }

  // Group by phase number
  const outputsByPhase = new Map<number, ProcessWithRuns[]>()
  for (const p of processesWithRuns) {
    if (!outputsByPhase.has(p.phaseNumber)) {
      outputsByPhase.set(p.phaseNumber, [])
    }
    outputsByPhase.get(p.phaseNumber)!.push(p)
  }
  const outputPhaseNumbers = Array.from(outputsByPhase.keys()).sort((a, b) => a - b)
  const hasAnyRuns = processesWithRuns.length > 0

  // Build gate review outputs list for the outputs tab
  // gates is already fetched above (quality_gates with gate_number + phase_id)
  const gateById = new Map<string, { gate_number: number; phase_id: string }>()
  for (const gate of gates ?? []) {
    gateById.set(gate.id as string, {
      gate_number: gate.gate_number as number,
      phase_id: gate.phase_id as string,
    })
  }

  const gateReviewOutputs: GateReviewOutput[] = []
  for (const review of gateReviewsRaw ?? []) {
    const gateId = review.gate_id as string
    const gate = gateById.get(gateId)
    if (!gate) continue
    const phaseNum = phaseNumberById.get(gate.phase_id) ?? 1
    gateReviewOutputs.push({
      id: review.id as string,
      gateId,
      gateNumber: gate.gate_number,
      phaseNumber: phaseNum,
      phaseName: PHASE_NAMES[phaseNum as PhaseNumber] ?? `Fase ${phaseNum}`,
      verdict: (review.verdict as Record<string, unknown>) ?? {},
      rawOutput: (review.raw_output as string) ?? '',
      status: review.status as 'running' | 'completed' | 'failed',
      createdAt: review.created_at as string,
    })
  }

  const briefing = parseBriefing(client.briefing)
  const isArchived = client.status === 'archived'

  // Determine if pipeline can be reset: Phase 5 must be completed
  const phase5Completed = (phases ?? []).some(
    (p) => p.phase_number === 5 && p.status === 'completed'
  )

  return (
    <div className="max-w-3xl space-y-8">

      {/* Breadcrumb — Clientes > {client name} */}
      <Breadcrumb items={[
        { label: 'Clientes', href: '/clients' },
        { label: client.name },
      ]} />

      {/* ---- Header ---- */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-zinc-900 truncate">{client.name}</h1>
            <Badge variant={isArchived ? 'secondary' : 'default'}>
              {isArchived ? 'Arquivado' : 'Ativo'}
            </Badge>
            <CycleBadge cycleNumber={client.cycle_number as number} />
          </div>
          {/* Text node only — never dangerouslySetInnerHTML (T-2-02-05) */}
          <p className="text-zinc-500">{client.company}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/clients/${client.id}/edit`}>
            <Button variant="outline" size="sm">Editar</Button>
          </Link>
          <CloneClientDialog
            sourceClientId={client.id}
            sourceClientName={client.name}
          />
          <ResetPipelineDialog
            clientId={client.id}
            clientName={client.name}
            canReset={phase5Completed}
          />
          <ArchiveDialog
            clientId={client.id}
            clientName={client.name}
            isArchived={isArchived}
          />
        </div>
      </div>

      {/* ---- Tabbed content (Pipeline, Outputs, Briefing) ---- */}
      <ClientProfileTabs
        clientId={client.id}
        clientName={client.name}
        phases={(phases ?? []) as PhaseRow[]}
        processes={(processes ?? []) as ProcessRow[]}
        gates={(gates ?? []) as GateRow[]}
        latestJobs={jobsByProcessIdObj}
        latestReviews={latestReviewsByGateId}
        budgetUsage={budgetUsage}
        outputsData={{
          phaseNumbers: outputPhaseNumbers,
          byPhase: Object.fromEntries(
            Array.from(outputsByPhase.entries()).map(([k, v]) => [String(k), v])
          ),
          hasAnyRuns,
          gateReviews: gateReviewOutputs,
        }}
        briefing={briefing}
      />

    </div>
  )
}
