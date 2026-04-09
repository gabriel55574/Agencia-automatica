'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GateReviewRow } from '@/lib/types/pipeline'

interface GateReviewDisplayProps {
  review: GateReviewRow
  gateNumber: number
}

/** Safely extract verdict fields with optional chaining — malformed JSONB never crashes (T-06-09) */
function parseVerdict(verdict: Record<string, unknown>) {
  const overall = typeof verdict?.overall === 'string' &&
    ['pass', 'fail', 'partial'].includes(verdict.overall)
    ? (verdict.overall as 'pass' | 'fail' | 'partial')
    : null

  const summary = typeof verdict?.summary === 'string' ? verdict.summary : null

  const items = Array.isArray(verdict?.items)
    ? (verdict.items as Record<string, unknown>[]).map(item => ({
        checklist_id: typeof item?.checklist_id === 'string' ? item.checklist_id : '',
        label: typeof item?.label === 'string' ? item.label : 'Unknown item',
        verdict: item?.verdict === 'pass' || item?.verdict === 'fail'
          ? (item.verdict as 'pass' | 'fail')
          : ('fail' as const),
        evidence: typeof item?.evidence === 'string' ? item.evidence : '',
        notes: typeof item?.notes === 'string' ? item.notes : '',
      }))
    : null

  return { overall, summary, items }
}

function OverallVerdictBadge({ overall }: { overall: 'pass' | 'fail' | 'partial' | null }) {
  if (overall === 'pass') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-sm px-3 py-1">
        <CheckCircle2 className="size-4 mr-1" />
        PASS
      </Badge>
    )
  }
  if (overall === 'fail') {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-sm px-3 py-1">
        <XCircle className="size-4 mr-1" />
        FAIL
      </Badge>
    )
  }
  if (overall === 'partial') {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-sm px-3 py-1">
        <AlertTriangle className="size-4 mr-1" />
        PARTIAL
      </Badge>
    )
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-sm px-3 py-1">
      <AlertTriangle className="size-4 mr-1" />
      Review Failed
    </Badge>
  )
}

function VerdictItem({ item }: { item: { checklist_id: string; label: string; verdict: 'pass' | 'fail'; evidence: string; notes: string } }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-zinc-100 last:border-b-0 py-2">
      <div className="flex items-center gap-2">
        {item.verdict === 'pass' ? (
          <CheckCircle2 className="size-4 text-green-600 shrink-0" />
        ) : (
          <XCircle className="size-4 text-red-600 shrink-0" />
        )}
        <span className="text-sm text-zinc-800 flex-1">{item.label}</span>
        {(item.evidence || item.notes) && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-0.5 shrink-0"
          >
            {expanded ? (
              <>
                <ChevronDown className="size-3" />
                Hide evidence
              </>
            ) : (
              <>
                <ChevronRight className="size-3" />
                Show evidence
              </>
            )}
          </button>
        )}
      </div>
      {expanded && (
        <div className="ml-6 mt-2 space-y-1">
          {item.evidence && (
            <div className="border-l-2 border-zinc-300 pl-3 text-sm text-zinc-600 italic">
              {item.evidence}
            </div>
          )}
          {item.notes && (
            <p className="text-sm text-zinc-600">{item.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function GateReviewDisplay({ review, gateNumber }: GateReviewDisplayProps) {
  const [showRaw, setShowRaw] = useState(false)

  // Running state: show loading spinner
  if (review.status === 'running') {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="size-4 animate-spin text-zinc-500" />
        <span className="text-sm text-zinc-600">AI review in progress...</span>
      </div>
    )
  }

  // Failed state: show error message and raw output for debugging
  if (review.status === 'failed') {
    return (
      <div className="space-y-3 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-yellow-600" />
          <span className="text-sm text-yellow-700 font-medium">
            AI review failed to produce a valid verdict. Raw output shown below.
          </span>
        </div>
        {review.raw_output && (
          <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
            {review.raw_output}
          </pre>
        )}
      </div>
    )
  }

  // Completed state: parse and display verdict
  const parsed = parseVerdict(review.verdict)

  // If verdict doesn't have expected shape, fall back to raw output
  if (!parsed.overall && !parsed.items) {
    return (
      <div className="space-y-3 py-3">
        <OverallVerdictBadge overall={null} />
        <p className="text-sm text-zinc-600">
          Verdict data could not be parsed. Showing raw output.
        </p>
        {review.raw_output && (
          <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
            {review.raw_output}
          </pre>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 py-3">
      {/* Overall Verdict Badge */}
      <div className="flex items-center gap-2">
        <OverallVerdictBadge overall={parsed.overall} />
        <span className="text-xs text-zinc-500">Gate {gateNumber} AI Review</span>
      </div>

      {/* Summary Text */}
      <p className="text-sm text-zinc-700">
        {parsed.summary ?? 'No summary available'}
      </p>

      {/* Checklist Items List */}
      {parsed.items && parsed.items.length > 0 && (
        <div className="rounded-md border border-zinc-200 bg-white divide-y divide-zinc-100 px-3">
          {parsed.items.map((item, index) => (
            <VerdictItem key={item.checklist_id || index} item={item} />
          ))}
        </div>
      )}

      {/* View Raw Toggle */}
      {review.raw_output && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs text-zinc-500"
          >
            {showRaw ? 'Hide Raw Output' : 'View Raw Output'}
          </Button>
          {showRaw && (
            <pre className="mt-2 bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
              {review.raw_output}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
