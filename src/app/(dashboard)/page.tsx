import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Dashboard</h1>
      <p className="text-zinc-500">
        Bem-vindo ao Agency OS{user?.email ? `, ${user.email}` : ''}.
      </p>
      <p className="text-sm text-zinc-400 mt-4">
        Este é um placeholder — o dashboard completo será implementado na Fase 8.
      </p>
    </div>
  )
}
