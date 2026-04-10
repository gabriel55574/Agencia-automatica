import { ClientForm } from '@/components/clients/client-form'

export default function NewClientPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Novo Cliente</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Preencha os dados do cliente. As 5 fases do pipeline serao inicializadas automaticamente.
        </p>
      </div>
      <ClientForm mode="create" />
    </div>
  )
}
