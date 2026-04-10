import { createClient } from '@/lib/supabase/server'
import { ClientGrid } from '@/components/clients/client-grid'

interface ClientsPageProps {
  searchParams: Promise<{ show_archived?: string }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams
  const showArchived = params.show_archived === '1'

  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select('id, name, company, current_phase_number, status, updated_at')
    .order('updated_at', { ascending: false })

  if (!showArchived) {
    query = query.eq('status', 'active')
  }

  const { data: clients, error } = await query

  if (error) {
    console.error('[ClientsPage] fetch error:', error)
    return <p className="text-red-600">Falha ao carregar clientes.</p>
  }

  return <ClientGrid clients={clients ?? []} showArchived={showArchived} />
}
