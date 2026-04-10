import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/MobileHeader'

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
    <div className="min-h-screen flex bg-velocity-white">
      {/* Desktop sidebar — D-06: fixed, always visible >= 1024px */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar signOutAction={signOut} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header — D-12: only visible < 1024px */}
        <MobileHeader signOutAction={signOut} />

        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  )
}
