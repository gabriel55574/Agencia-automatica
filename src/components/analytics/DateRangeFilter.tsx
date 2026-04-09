'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { DateRange } from '@/lib/analytics/types'

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All Time' },
]

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(val) => {
        // Prevent deselection: if val is empty string, keep current value
        if (val) onChange(val as DateRange)
      }}
      aria-label="Date range filter"
    >
      {RANGE_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-8 px-3 text-xs font-medium"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
