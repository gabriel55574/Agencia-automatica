import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ClientForm } from '@/components/clients/client-form'
import type { Json } from '@/lib/database/types'

interface EditClientPageProps {
  params: Promise<{ id: string }>
}

function parseBriefing(raw: Json | null) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const b = raw as Record<string, unknown>
  return {
    niche: typeof b.niche === 'string' ? b.niche : '',
    target_audience: typeof b.target_audience === 'string' ? b.target_audience : '',
    additional_context: typeof b.additional_context === 'string' ? b.additional_context : '',
  }
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, company, briefing')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const briefing = parseBriefing(client.briefing)

  const defaultValues = {
    name: client.name,
    company: client.company,
    niche: briefing.niche,
    target_audience: briefing.target_audience,
    additional_context: briefing.additional_context,
  }

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb — Clientes > {client name} > Editar */}
      <Breadcrumb items={[
        { label: 'Clientes', href: '/clients' },
        { label: client.name, href: `/clients/${client.id}` },
        { label: 'Editar' },
      ]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Editar Cliente</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {client.name} · {client.company}
        </p>
      </div>
      <ClientForm mode="edit" defaultValues={defaultValues} clientId={id} />
    </div>
  )
}
