'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatMonth, getLastMonths } from '@/lib/costs/format'

interface MonthSelectorProps {
  currentMonth: string
}

export function MonthSelector({ currentMonth }: MonthSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const months = getLastMonths(12)

  function handleMonthChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', value)
    router.push(`/costs?${params.toString()}`)
  }

  return (
    <Select value={currentMonth} onValueChange={handleMonthChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem key={month} value={month}>
            {formatMonth(month)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
