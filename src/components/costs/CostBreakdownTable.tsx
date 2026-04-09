'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCost, formatTokensCompact, formatTrend } from '@/lib/costs/format'
import type { CostBreakdownRow } from '@/lib/costs/types'

type SortField = 'client_name' | 'run_count' | 'total_tokens' | 'total_cost'
type SortDir = 'asc' | 'desc'

interface CostBreakdownTableProps {
  rows: CostBreakdownRow[]
}

export function CostBreakdownTable({ rows }: CostBreakdownTableProps) {
  const [sortField, setSortField] = useState<SortField>('total_cost')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortField === 'client_name') return mul * a.client_name.localeCompare(b.client_name)
    return mul * ((a[sortField] as number) - (b[sortField] as number))
  })

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-zinc-400" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />
  }

  function getAriaSortValue(field: SortField): 'ascending' | 'descending' | 'none' {
    if (sortField !== field) return 'none'
    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">No cost data yet</h3>
        <p className="text-sm text-zinc-500">
          Cost tracking begins after your first squad run completes.
          Run a squad for any client to start seeing cost data here.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <button
              onClick={() => handleSort('client_name')}
              className="flex items-center font-semibold text-zinc-900 hover:text-zinc-700"
              aria-sort={getAriaSortValue('client_name')}
            >
              Client <SortIcon field="client_name" />
            </button>
          </TableHead>
          <TableHead className="text-right">
            <button
              onClick={() => handleSort('run_count')}
              className="flex items-center justify-end font-semibold text-zinc-900 hover:text-zinc-700 w-full"
              aria-sort={getAriaSortValue('run_count')}
            >
              Runs <SortIcon field="run_count" />
            </button>
          </TableHead>
          <TableHead className="text-right">
            <button
              onClick={() => handleSort('total_tokens')}
              className="flex items-center justify-end font-semibold text-zinc-900 hover:text-zinc-700 w-full"
              aria-sort={getAriaSortValue('total_tokens')}
            >
              Tokens <SortIcon field="total_tokens" />
            </button>
          </TableHead>
          <TableHead className="text-right">
            <button
              onClick={() => handleSort('total_cost')}
              className="flex items-center justify-end font-semibold text-zinc-900 hover:text-zinc-700 w-full"
              aria-sort={getAriaSortValue('total_cost')}
            >
              Cost <SortIcon field="total_cost" />
            </button>
          </TableHead>
          <TableHead className="text-right hidden md:table-cell">Trend</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => {
          const trend = formatTrend(row.total_cost, row.previous_month_cost)
          const trendColor =
            row.previous_month_cost === null
              ? 'text-zinc-500'
              : row.total_cost > row.previous_month_cost
                ? 'text-red-600'
                : row.total_cost < row.previous_month_cost
                  ? 'text-emerald-600'
                  : 'text-zinc-500'

          return (
            <TableRow key={row.client_id} className="hover:bg-zinc-50">
              <TableCell>
                <Link
                  href={`/clients/${row.client_id}`}
                  className="text-sm text-zinc-700 hover:text-zinc-900 hover:underline"
                >
                  {row.client_name}
                </Link>
              </TableCell>
              <TableCell className="text-right text-sm font-mono text-zinc-700">
                {row.run_count}
              </TableCell>
              <TableCell
                className="text-right text-sm font-mono text-zinc-700"
                aria-label={`${row.total_tokens.toLocaleString('en-US')} tokens`}
              >
                {formatTokensCompact(row.total_tokens)}
              </TableCell>
              <TableCell className="text-right text-sm font-mono font-semibold text-zinc-900">
                {formatCost(row.total_cost)}
              </TableCell>
              <TableCell
                className={`text-right text-sm font-mono hidden md:table-cell ${trendColor}`}
              >
                {trend}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
