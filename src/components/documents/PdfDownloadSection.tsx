// Client-side only -- imported via dynamic import from OutputViewer. Do NOT import in Server Components.
'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { OutputPdfTemplate } from './OutputPdfTemplate'
import { Button } from '@/components/ui/button'

export interface PdfDownloadSectionProps {
  clientName: string
  processName: string
  phaseName: string
  date: string
  structuredOutput: Record<string, unknown> | null
  rawOutput: string | null
  fileName: string
}

export function PdfDownloadSection({
  clientName,
  processName,
  phaseName,
  date,
  structuredOutput,
  rawOutput,
  fileName,
}: PdfDownloadSectionProps) {
  return (
    <PDFDownloadLink
      document={
        <OutputPdfTemplate
          clientName={clientName}
          processName={processName}
          phaseName={phaseName}
          date={date}
          structuredOutput={structuredOutput}
          rawOutput={rawOutput}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? 'Gerando PDF...' : 'Baixar PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}

export default PdfDownloadSection
