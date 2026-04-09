import { ClientForm } from '@/components/clients/client-form'

export default function NewClientPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">New Client</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Fill in the client details. All 5 pipeline phases will be initialized automatically.
        </p>
      </div>
      <ClientForm mode="create" />
    </div>
  )
}
