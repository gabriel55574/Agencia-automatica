import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PHASE_NAMES } from '@/lib/database/enums'
import type { PhaseNumber } from '@/lib/database/enums'
import type { Tables } from '@/lib/database/types'

type ClientRow = Pick<
  Tables<'clients'>,
  'id' | 'name' | 'company' | 'current_phase_number' | 'status' | 'updated_at'
>

export function ClientCard({ client }: { client: ClientRow }) {
  const phaseNum = client.current_phase_number as PhaseNumber
  const phaseName = PHASE_NAMES[phaseNum]
  const lastActivity = formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })
  const isArchived = client.status === 'archived'

  return (
    <Link href={`/clients/${client.id}`} className="block group">
      <Card className={`transition-shadow hover:shadow-md ${isArchived ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900 truncate group-hover:text-zinc-700">
                {client.name}
              </p>
              <p className="text-sm text-zinc-500 truncate">{client.company}</p>
            </div>
            <Badge variant={isArchived ? 'secondary' : 'default'} className="shrink-0">
              {isArchived ? 'Archived' : 'Active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-zinc-600">
            Phase {phaseNum} — {phaseName}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{lastActivity}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
