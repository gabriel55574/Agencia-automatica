'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { TrendPoint } from '@/lib/analytics/types'

interface TrendChartProps {
  data: TrendPoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  const hasEnoughData = data.length >= 2

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trends</CardTitle>
        <CardDescription>Monthly performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasEnoughData ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-zinc-700">Not enough data for trends</p>
            <p className="text-xs text-zinc-500 mt-1">
              Trends appear after 2+ months of operation.
            </p>
          </div>
        ) : (
          <div
            role="img"
            aria-label="Trend chart showing monthly averages for phase duration and gate approval rate"
          >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={{ stroke: '#e4e4e7' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: 'Days',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 11, fill: '#a1a1aa' },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  label={{
                    value: '%',
                    angle: 90,
                    position: 'insideRight',
                    style: { fontSize: 11, fill: '#a1a1aa' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e4e4e7',
                    borderRadius: '6px',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                    padding: '8px',
                    fontSize: '14px',
                  }}
                  formatter={(value, name) => {
                    if (value == null) return ['N/A', name]
                    const num = Number(value)
                    if (name === 'Avg Phase Duration') return [`${num.toFixed(1)} days`, name]
                    return [`${num.toFixed(1)}%`, name]
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avg_phase_duration"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Avg Phase Duration"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="gate_approval_rate"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Gate Approval Rate"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
