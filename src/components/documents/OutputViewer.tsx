'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StructuredOutputView } from '@/components/squad/StructuredOutputView'
import { X } from 'lucide-react'
import { format } from 'date-fns'

const PdfDownloadSection = dynamic(() => import('./PdfDownloadSection'), {
  ssr: false,
  loading: () => <span className="text-xs text-zinc-400">Loading PDF...</span>,
})

export type OutputViewerRun = {
  id: string
  squadType: string
  structuredOutput: Record<string, unknown> | null
  output: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

interface OutputViewerProps {
  run: OutputViewerRun
  processName: string
  phaseName: string
  clientName: string
  onClose: () => void
  processNumber?: number  // for Save as Template
  clientId?: string       // for Save as Template
}

function computeDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return 'N/A'
  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  const diffMs = end - start
  if (diffMs < 0) return 'N/A'
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}m ${remaining}s`
}

/**
 * Sanitize a string for use in a filename:
 * - Replace non-alphanumeric characters (except hyphens) with hyphens
 * - Lowercase
 * - Truncate to 100 chars
 * T-07-02 mitigation
 */
function sanitizeForFilename(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

export function OutputViewer({ run, processName, phaseName, clientName, onClose, processNumber, clientId }: OutputViewerProps) {
  const [showPdf, setShowPdf] = useState(false)

  const handleDownloadRaw = useCallback(() => {
    if (!run.output) return
    const blob = new Blob([run.output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const dateStr = format(new Date(run.createdAt), 'yyyy-MM-dd')
    const filename = `${sanitizeForFilename(clientName)}_${sanitizeForFilename(processName)}_${dateStr}.txt`
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [run.output, run.createdAt, clientName, processName])

  return (
    <div className="bg-white border-l h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 truncate">{processName}</h3>
          <p className="text-xs text-zinc-500">{phaseName}</p>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Close viewer">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-3 px-4 py-2 border-b text-xs">
        <Badge variant="outline">{run.squadType}</Badge>
        <span className="text-zinc-500">
          {format(new Date(run.createdAt), 'MMM d, yyyy HH:mm')}
        </span>
        <span className="text-zinc-400">
          Duration: {computeDuration(run.startedAt, run.completedAt)}
        </span>
      </div>

      {/* Content area with Tabs */}
      <Tabs defaultValue="structured" className="px-4 py-3">
        <TabsList>
          <TabsTrigger value="structured">Structured</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>

        <TabsContent value="structured" className="mt-3">
          <StructuredOutputView
            structuredOutput={run.structuredOutput}
            rawOutput={run.output}
            processNumber={processNumber}
            clientId={clientId}
            jobId={run.id}
          />
        </TabsContent>

        <TabsContent value="raw" className="mt-3">
          {run.output ? (
            <pre className="max-h-[70vh] overflow-y-auto bg-zinc-50 p-4 rounded-md text-xs font-mono whitespace-pre-wrap">
              {run.output}
            </pre>
          ) : (
            <p className="text-sm text-zinc-400 py-4">No raw output available.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-4 py-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadRaw}
          disabled={!run.output}
        >
          Download Raw (.txt)
        </Button>
        {showPdf ? (
          <PdfDownloadSection
            clientName={clientName}
            processName={processName}
            phaseName={phaseName}
            date={format(new Date(run.createdAt), 'yyyy-MM-dd')}
            structuredOutput={run.structuredOutput}
            rawOutput={run.output}
            fileName={`${sanitizeForFilename(clientName)}_${sanitizeForFilename(processName)}_${format(new Date(run.createdAt), 'yyyy-MM-dd')}.pdf`}
          />
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowPdf(true)}>
            Export PDF
          </Button>
        )}
      </div>
    </div>
  )
}
