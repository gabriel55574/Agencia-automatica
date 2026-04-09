'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DashboardData } from '@/lib/dashboard/types'

/**
 * Supabase Realtime hook for the dashboard.
 *
 * Subscribes to a single channel monitoring three tables (clients, squad_jobs,
 * quality_gates). On any change, triggers a debounced router.refresh() to
 * re-fetch server data via RSC — no complex client-side state reconciliation.
 *
 * The initialData prop changes on each RSC re-render (after router.refresh()),
 * which the useEffect syncs into local state.
 */
export function useRealtimeDashboard(initialData: DashboardData): DashboardData {
  const [data, setData] = useState<DashboardData>(initialData)
  const router = useRouter()

  // Sync initialData into state when RSC re-renders with new data
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    let refreshTimer: NodeJS.Timeout | null = null

    const debouncedRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => {
        router.refresh()
      }, 500)
    }

    const handleClientChange = () => debouncedRefresh()
    const handleJobChange = () => debouncedRefresh()
    const handleGateChange = () => debouncedRefresh()

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        handleClientChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'squad_jobs' },
        handleJobChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quality_gates' },
        handleGateChange
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [router])

  return data
}
