'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { PhaseDuration } from '@/lib/analytics/types'

interface PhasePerformanceChartProps {
  data: PhaseDuration[]
}

export function PhasePerformanceChart({ data }: PhasePerformanceChartProps) {
  const hasData = data.some((d) => d.completed_count > 0)

  // Find the slowest phase (highest avg_days) among those with data
  const maxAvgDays = Math.max(
    ...data.filter((d) => d.completed_count > 0).map((d) => d.avg_days),
    0
  )

  const ariaLabel = hasData
    ? `Bar chart showing average days per phase: ${data
        .map((d) => `${d.phase_name} ${d.avg_days.toFixed(1)} days`)
        .join(', ')}`
    : 'No phase data available'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Desempenho por Fase</CardTitle>
        <CardDescription>Media de dias por fase</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-zinc-700">Nenhum dado de fase ainda</p>
            <p className="text-xs text-zinc-500 mt-1">
              O desempenho por fase aparece apos clientes completarem pelo menos uma fase.
            </p>
          </div>
        ) : (
          <div role="img" aria-label={ariaLabel}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={data} margin={{ left: 0, right: 40 }}>
                <YAxis
                  dataKey="phase_name"
                  type="category"
                  width={140}
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <XAxis type="number" hide />
                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(1)} dias`, 'Media']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e4e4e7',
                    borderRadius: '6px',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                    padding: '8px',
                    fontSize: '14px',
                  }}
                />
                <Bar dataKey="avg_days" barSize={24} radius={[0, 4, 4, 0]}>
                  {data.map((entry) => (
                    <Cell
                      key={entry.phase_number}
                      fill={
                        entry.completed_count > 0 && entry.avg_days === maxAvgDays
                          ? '#ef4444'
                          : '#3b82f6'
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="avg_days"
                    position="right"
                    formatter={(value) => `${Number(value).toFixed(1)}d`}
                    style={{ fontSize: '12px', fontFamily: 'monospace', fill: '#52525b' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
