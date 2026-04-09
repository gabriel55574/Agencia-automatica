import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DashboardClient } from '@/lib/dashboard/types'

function gateStatusBadge(status: DashboardClient['gate_status']) {
  switch (status) {
    case 'approved':
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
          Approved
        </Badge>
      )
    case 'rejected':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Rejected
        </Badge>
      )
    case 'evaluating':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Evaluating
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200">
          Pending
        </Badge>
      )
    default:
      return null
  }
}

interface KanbanClientCardProps {
  client: DashboardClient
  isStuck: boolean
}

export function KanbanClientCard({ client, isStuck }: KanbanClientCardProps) {
  return (
    <Link href={`/clients/${client.id}`} className="block group">
      <Card className="transition-shadow hover:shadow-md py-3">
        <CardContent className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm text-zinc-900 truncate group-hover:text-zinc-700">
                {client.name}
              </p>
              <p className="text-xs text-zinc-500 truncate">{client.company}</p>
            </div>
            {client.has_running_job && (
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {client.current_process_number !== null && (
              <Badge variant="outline" className="text-xs">
                P{client.current_process_number}
              </Badge>
            )}
            {gateStatusBadge(client.gate_status)}
            {isStuck && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                Stuck
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
