import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavLinks } from '@/components/layout/NavLinks'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold text-zinc-900">Agency OS</Link>
          <NavLinks />
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Sair
          </button>
        </form>
      </header>
      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  )
}
