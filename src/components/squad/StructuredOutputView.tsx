'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface StructuredOutputViewProps {
  structuredOutput: Record<string, unknown> | null
  rawOutput: string | null
}

/**
 * StructuredOutputView: Renders structured_output fields or falls back to raw output.
 *
 * D-15: Shows structured fields as description list.
 * D-16: "View Raw" toggle always available.
 *
 * T-05-11: All values rendered as React text nodes only (no dangerouslySetInnerHTML).
 */
export function StructuredOutputView({ structuredOutput, rawOutput }: StructuredOutputViewProps) {
  const [showRaw, setShowRaw] = useState(false)

  const hasStructured = structuredOutput !== null && typeof structuredOutput === 'object'

  // If structured output exists and we are not showing raw, render structured view
  if (hasStructured && !showRaw) {
    return (
      <div className="space-y-2">
        <dl className="space-y-3">
          {Object.entries(structuredOutput).map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs font-medium text-zinc-500 capitalize">
                {key.replace(/_/g, ' ')}
              </dt>
              <dd className="text-sm text-zinc-800 mt-0.5">
                <FieldValue value={value} />
              </dd>
            </div>
          ))}
        </dl>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRaw(true)}
          className="text-xs"
        >
          View Raw
        </Button>
      </div>
    )
  }

  // Raw output view (fallback or toggled)
  return (
    <div className="space-y-2">
      <pre className="max-h-64 overflow-y-auto bg-zinc-50 p-3 rounded-md text-xs font-mono whitespace-pre-wrap">
        {rawOutput ?? 'No output available'}
      </pre>
      {hasStructured && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRaw(false)}
          className="text-xs"
        >
          View Structured
        </Button>
      )}
    </div>
  )
}

/**
 * Renders a single field value based on its type.
 * - string: text
 * - boolean: "Yes" / "No"
 * - array of strings: bulleted list
 * - object: nested key-value pairs (one level deep)
 * - other: JSON stringified
 */
function FieldValue({ value }: { value: unknown }) {
  if (typeof value === 'string') {
    return <span>{value}</span>
  }

  if (typeof value === 'boolean') {
    return <span>{value ? 'Yes' : 'No'}</span>
  }

  if (typeof value === 'number') {
    return <span>{String(value)}</span>
  }

  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-0.5 text-zinc-700">
        {value.map((item, i) => (
          <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    )
  }

  if (value !== null && typeof value === 'object') {
    return (
      <dl className="pl-3 border-l-2 border-zinc-200 space-y-1 mt-1">
        {Object.entries(value as Record<string, unknown>).map(([nestedKey, nestedVal]) => (
          <div key={nestedKey} className="flex gap-2">
            <dt className="text-xs font-medium text-zinc-500 capitalize shrink-0">
              {nestedKey.replace(/_/g, ' ')}:
            </dt>
            <dd className="text-xs text-zinc-700">
              {typeof nestedVal === 'string'
                ? nestedVal
                : typeof nestedVal === 'boolean'
                  ? nestedVal ? 'Yes' : 'No'
                  : JSON.stringify(nestedVal)}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return <span>{String(value)}</span>
}
