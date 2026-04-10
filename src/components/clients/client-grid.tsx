'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ClientCard } from './client-card'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/lib/database/types'
import Link from 'next/link'

type ClientRow = Pick<
  Tables<'clients'>,
  'id' | 'name' | 'company' | 'current_phase_number' | 'status' | 'updated_at'
>

interface ClientGridProps {
  clients: ClientRow[]
  showArchived: boolean
}

export function ClientGrid({ clients, showArchived }: ClientGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  function toggleArchived() {
    const params = new URLSearchParams(searchParams.toString())
    if (showArchived) {
      params.delete('show_archived')
    } else {
      params.set('show_archived', '1')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Clientes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {clients.length} {showArchived ? 'cliente(s) no total' : 'cliente(s) ativo(s)'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={toggleArchived}>
            {showArchived ? 'Ocultar arquivados' : 'Mostrar arquivados'}
          </Button>
          <Link href="/clients/new">
            <Button size="sm">Novo Cliente</Button>
          </Link>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-lg">Nenhum cliente ainda.</p>
          <p className="text-sm mt-1">
            <Link href="/clients/new" className="text-zinc-600 underline hover:text-zinc-900">
              Adicione seu primeiro cliente
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}
