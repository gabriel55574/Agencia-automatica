'use client'

import Link from 'next/link'
import { Clock, XCircle, Loader2 } from 'lucide-react'
import type { ActionPanelData } from '@/lib/dashboard/types'

interface ActionPanelProps {
  actions: ActionPanelData
}

export function ActionPanel({ actions }: ActionPanelProps) {
  const { pendingApprovals, failedGates, runningJobs } = actions
  const hasAny =
    pendingApprovals.length > 0 ||
    failedGates.length > 0 ||
    runningJobs.length > 0

  if (!hasAny) {
    return (
      <p className="text-sm text-zinc-400 py-2">
        All clear — no actions needed
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {pendingApprovals.length > 0 && (
        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 mb-2">
            <Clock className="h-4 w-4" />
            Pending Approvals
          </h3>
          <ul className="space-y-1">
            {pendingApprovals.map((item) => (
              <li key={item.gate_id}>
                <Link
                  href={`/clients/${item.client_id}`}
                  className="text-sm text-zinc-700 hover:text-zinc-900 hover:underline"
                >
                  Gate {item.gate_number} — {item.client_name} ({item.phase_name})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {failedGates.length > 0 && (
        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-2">
            <XCircle className="h-4 w-4" />
            Failed Gates
          </h3>
          <ul className="space-y-1">
            {failedGates.map((item) => (
              <li key={item.gate_id}>
                <Link
                  href={`/clients/${item.client_id}`}
                  className="text-sm text-red-600 hover:text-red-800 hover:underline"
                >
                  Gate {item.gate_number} — {item.client_name} ({item.phase_name})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {runningJobs.length > 0 && (
        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Running Jobs
          </h3>
          <ul className="space-y-1">
            {runningJobs.map((item) => (
              <li key={item.job_id}>
                <Link
                  href={`/clients/${item.client_id}`}
                  className="text-sm text-zinc-700 hover:text-zinc-900 hover:underline"
                >
                  {item.squad_type} — {item.client_name}
                  {item.status === 'queued' ? ' (queued)' : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
