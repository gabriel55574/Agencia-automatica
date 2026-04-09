import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { PHASE_NAMES } from '@/lib/database/enums'
import type { DashboardClient } from '@/lib/dashboard/types'

interface BottleneckAlertProps {
  stuckClients: DashboardClient[]
}

export function BottleneckAlert({ stuckClients }: BottleneckAlertProps) {
  if (stuckClients.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <h2 className="text-sm font-semibold text-amber-900">
          {stuckClients.length} client(s) need attention
        </h2>
      </div>
      <ul className="space-y-1 ml-7">
        {stuckClients.map((client) => (
          <li key={client.id}>
            <Link
              href={`/clients/${client.id}`}
              className="text-sm text-amber-800 hover:underline"
            >
              {client.name} ({client.company}) &mdash; stuck in{' '}
              {PHASE_NAMES[client.current_phase_number]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
