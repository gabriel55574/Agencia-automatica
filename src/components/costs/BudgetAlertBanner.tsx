import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export interface BudgetAlert {
  clientName: string
  clientId: string
  processName: string
  percentage: number
  used: number
  budget: number
}

interface BudgetAlertBannerProps {
  alerts: BudgetAlert[]
}

export function BudgetAlertBanner({ alerts }: BudgetAlertBannerProps) {
  if (alerts.length === 0) return null

  const exceeded = alerts.filter(a => a.percentage >= 100)
  const approaching = alerts.filter(a => a.percentage >= 80 && a.percentage < 100)

  return (
    <div className="space-y-3">
      {exceeded.length > 0 && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {exceeded.length} processo(s) excederam o orcamento de tokens
              </p>
              <ul className="mt-1 space-y-0.5">
                {exceeded.map((alert, i) => (
                  <li key={i} className="text-sm text-red-700">
                    <Link
                      href={`/clients/${alert.clientId}`}
                      className="hover:underline"
                    >
                      {alert.clientName}
                    </Link>
                    {' > '}{alert.processName}: {alert.percentage}% ({alert.used.toLocaleString('en-US')}/{alert.budget.toLocaleString('en-US')})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {approaching.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {approaching.length} processo(s) proximo(s) do limite de tokens
              </p>
              <ul className="mt-1 space-y-0.5">
                {approaching.map((alert, i) => (
                  <li key={i} className="text-sm text-amber-700">
                    <Link
                      href={`/clients/${alert.clientId}`}
                      className="hover:underline"
                    >
                      {alert.clientName}
                    </Link>
                    {' > '}{alert.processName}: {alert.percentage}% ({alert.used.toLocaleString('en-US')}/{alert.budget.toLocaleString('en-US')})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
