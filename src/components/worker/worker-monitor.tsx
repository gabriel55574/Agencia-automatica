'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, differenceInSeconds } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type JobRow = {
  id: string
  client_id: string
  squad_type: string
  status: string
  progress_log: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  token_count: number | null
  estimated_cost_usd: number | null
  clients: { name: string } | null
  processes: { process_number: number; name: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  running:   'text-amber-400 bg-amber-400/10 border-amber-400/30',
  queued:    'text-blue-400 bg-blue-400/10 border-blue-400/30',
  completed: 'text-green-400 bg-green-400/10 border-green-400/30',
  failed:    'text-red-400 bg-red-400/10 border-red-400/30',
  cancelled: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30',
}

const STATUS_DOT: Record<string, string> = {
  running:   'bg-amber-400 animate-pulse',
  queued:    'bg-blue-400',
  completed: 'bg-green-400',
  failed:    'bg-red-400',
  cancelled: 'bg-zinc-500',
}

function duration(job: JobRow): string {
  if (!job.started_at) return '—'
  const end = job.completed_at ? new Date(job.completed_at) : new Date()
  const secs = differenceInSeconds(end, new Date(job.started_at))
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

function parseLog(raw: string | null): string {
  if (!raw) return ''
  const lines: string[] = []
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    try {
      const ev = JSON.parse(line)
      if (ev.type === 'assistant' && ev.message?.content) {
        for (const block of ev.message.content) {
          if (block.type === 'text' && block.text) {
            lines.push(`[claude] ${block.text}`)
          } else if (block.type === 'tool_use') {
            lines.push(`[tool]   ${block.name}(${JSON.stringify(block.input, null, 2)})`)
          }
        }
      } else if (ev.type === 'result' && ev.result) {
        lines.push(`[result] ${ev.result}`)
      }
    } catch {
      lines.push(line)
    }
  }
  return lines.join('\n')
}

interface WorkerMonitorProps {
  initialJobs: JobRow[]
}

export function WorkerMonitor({ initialJobs }: WorkerMonitorProps) {
  const [jobs, setJobs] = useState<JobRow[]>(initialJobs)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialJobs.find(j => j.status === 'running')?.id ?? initialJobs[0]?.id ?? null
  )
  const logRef = useRef<HTMLPreElement>(null)
  const supabase = createClient()

  const selectedJob = jobs.find(j => j.id === selectedId) ?? null

  // Auto-scroll log to bottom when content changes
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [selectedJob?.progress_log])

  const updateJob = useCallback((updated: Partial<JobRow> & { id: string }) => {
    setJobs(prev =>
      prev.map(j => j.id === updated.id ? { ...j, ...updated } : j)
    )
  }, [])

  // Subscribe to all squad_job changes
  useEffect(() => {
    const channel = supabase
      .channel('worker-monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'squad_jobs' },
        (payload) => {
          const row = payload.new as JobRow
          if (!row?.id) return

          if (payload.eventType === 'INSERT') {
            // New job — add to list (without client/process join data initially)
            setJobs(prev => [row, ...prev])
            // Auto-select if it's the first running job
            if (row.status === 'running') setSelectedId(row.id)
          } else if (payload.eventType === 'UPDATE') {
            updateJob(row)
            // Auto-select new running jobs
            if (row.status === 'running') setSelectedId(row.id)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, updateJob])

  const logContent = parseLog(selectedJob?.progress_log ?? null)

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Left panel — job list */}
      <div className="w-80 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h1 className="text-sm font-semibold text-zinc-100">Worker Monitor</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Últimas 24h</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {jobs.length === 0 ? (
            <div className="px-4 py-8 text-xs text-zinc-500 text-center">
              Nenhum job nas últimas 24h
            </div>
          ) : (
            jobs.map(job => (
              <button
                key={job.id}
                onClick={() => setSelectedId(job.id)}
                className={`w-full text-left px-4 py-3 border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${
                  selectedId === job.id ? 'bg-zinc-800/60 border-l-2 border-l-velocity-lime' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[job.status] ?? 'bg-zinc-500'}`} />
                  <span className="text-xs font-medium truncate text-zinc-200">
                    {(job.clients as { name: string } | null)?.name ?? job.client_id.slice(0, 8)}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 truncate pl-4">
                  {job.processes
                    ? `P${job.processes.process_number} — ${job.processes.name}`
                    : job.squad_type}
                </div>
                <div className="flex items-center gap-2 mt-1 pl-4">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[job.status] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                    {job.status}
                  </span>
                  <span className="text-[10px] text-zinc-600">{duration(job)}</span>
                  {job.estimated_cost_usd != null && (
                    <span className="text-[10px] text-zinc-600 ml-auto">
                      ${job.estimated_cost_usd.toFixed(3)}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-600 pl-4 mt-0.5">
                  {formatDistanceToNow(new Date(job.created_at ?? Date.now()), { addSuffix: true, locale: ptBR })}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel — log terminal */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedJob ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3 shrink-0">
              <span className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[selectedJob.status] ?? 'bg-zinc-500'}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-100 truncate">
                  {(selectedJob.clients as { name: string } | null)?.name ?? selectedJob.client_id.slice(0, 8)}
                  {selectedJob.processes && (
                    <span className="text-zinc-400 font-normal ml-2">
                      — P{selectedJob.processes.process_number}: {selectedJob.processes.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                  <span>{selectedJob.squad_type}</span>
                  <span>·</span>
                  <span>{duration(selectedJob)}</span>
                  {selectedJob.token_count && (
                    <>
                      <span>·</span>
                      <span>{selectedJob.token_count.toLocaleString()} tokens</span>
                    </>
                  )}
                  {selectedJob.estimated_cost_usd != null && (
                    <>
                      <span>·</span>
                      <span>${selectedJob.estimated_cost_usd.toFixed(4)}</span>
                    </>
                  )}
                </div>
              </div>
              {selectedJob.status === 'running' && (
                <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  ao vivo
                </div>
              )}
            </div>

            {/* Terminal */}
            <pre
              ref={logRef}
              className="flex-1 p-4 text-xs font-mono text-green-300 overflow-auto leading-relaxed whitespace-pre-wrap break-words"
            >
              {logContent || (
                <span className="text-zinc-600">
                  {selectedJob.status === 'queued'
                    ? 'Aguardando worker processar...'
                    : 'Sem output ainda.'}
                </span>
              )}
            </pre>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
            Selecione um job para ver o log
          </div>
        )}
      </div>
    </div>
  )
}
