import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PHASE_NAMES, type PhaseNumber } from '@/lib/database/enums'
import { PROCESS_DEFINITIONS } from '@/lib/pipeline/processes'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { format } from 'date-fns'
import { OutputsBrowser } from './outputs-browser'
import type { CompletedJob, ProcessWithRuns } from '@/lib/types/outputs'

// Re-export for backward compatibility
export type { CompletedJob, ProcessWithRuns } from '@/lib/types/outputs'

interface OutputsPageProps {
  params: Promise<{ id: string }>
}

export default async function OutputsPage({ params }: OutputsPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch client
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, company, status')
    .eq('id', id)
    .single()

  if (!client) notFound()

  // Fetch phases for this client
  const { data: phases } = await supabase
    .from('phases')
    .select('id, phase_number, name, status')
    .eq('client_id', id)
    .order('phase_number', { ascending: true })

  // Fetch processes for this client
  const { data: processes } = await supabase
    .from('processes')
    .select('id, phase_id, process_number, name, squad, status')
    .eq('client_id', id)
    .order('process_number', { ascending: true })

  // Fetch completed squad jobs
  const { data: completedJobs } = await supabase
    .from('squad_jobs')
    .select('id, process_id, squad_type, status, structured_output, output, created_at, started_at, completed_at')
    .eq('client_id', id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  // Build a Map<processId, CompletedJob[]>
  const jobsByProcessId = new Map<string, CompletedJob[]>()
  for (const job of completedJobs ?? []) {
    if (!job.process_id) continue
    const processId = job.process_id as string
    if (!jobsByProcessId.has(processId)) {
      jobsByProcessId.set(processId, [])
    }
    jobsByProcessId.get(processId)!.push({
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

  // Build a map of phase_id -> phase_number
  const phaseNumberById = new Map<string, number>()
  for (const phase of phases ?? []) {
    phaseNumberById.set(phase.id, phase.phase_number)
  }

  // Build processes with runs, grouped by phase
  const processesWithRuns: ProcessWithRuns[] = []
  for (const proc of processes ?? []) {
    const runs = jobsByProcessId.get(proc.id) ?? []
    if (runs.length === 0) continue // Skip processes with no completed runs
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
  const byPhase = new Map<number, ProcessWithRuns[]>()
  for (const p of processesWithRuns) {
    if (!byPhase.has(p.phaseNumber)) {
      byPhase.set(p.phaseNumber, [])
    }
    byPhase.get(p.phaseNumber)!.push(p)
  }

  // Sort phase keys
  const phaseNumbers = Array.from(byPhase.keys()).sort((a, b) => a - b)

  const hasAnyRuns = processesWithRuns.length > 0

  return (
    <div className="max-w-5xl space-y-6">
      {/* Breadcrumb — Clientes > {client name} > Outputs */}
      <Breadcrumb items={[
        { label: 'Clientes', href: '/clients' },
        { label: client.name, href: `/clients/${client.id}` },
        { label: 'Outputs' },
      ]} />

      {/* Header — simplified since breadcrumb handles navigation context */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900 truncate">Outputs</h1>
          <p className="text-sm text-zinc-500">{client.name} · {client.company}</p>
        </div>
        <Link href={`/clients/${client.id}`}>
          <Button variant="outline" size="sm">Voltar ao Perfil</Button>
        </Link>
      </div>

      {!hasAnyRuns ? (
        <div className="py-12 text-center">
          <p className="text-sm text-zinc-400">Nenhum output concluido ainda.</p>
          <p className="text-xs text-zinc-300 mt-1">Os outputs aparecerao aqui conforme os squads concluirem os processos.</p>
        </div>
      ) : (
        <OutputsBrowser
          clientName={client.name}
          clientId={client.id}
          phaseNumbers={phaseNumbers}
          byPhase={Object.fromEntries(
            Array.from(byPhase.entries()).map(([k, v]) => [String(k), v])
          )}
        />
      )}
    </div>
  )
}
