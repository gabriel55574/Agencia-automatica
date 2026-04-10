'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, BookmarkPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createTemplateAction } from '@/lib/actions/templates'

interface StructuredOutputViewProps {
  structuredOutput: Record<string, unknown> | null
  rawOutput: string | null
  processNumber?: number    // TMPL-01: needed for template's process_number
  clientId?: string         // TMPL-01: needed for template's source_client_id
  jobId?: string            // TMPL-01: needed for template's source_job_id
}

/**
 * StructuredOutputView: Renders structured_output fields or falls back to raw output.
 *
 * D-15: Shows structured fields as description list.
 * D-16: "View Raw" toggle always available.
 * TMPL-01: "Save as Template" button when structuredOutput exists and processNumber provided.
 *
 * T-05-11: All values rendered as React text nodes only (no dangerouslySetInnerHTML).
 */
export function StructuredOutputView({ structuredOutput, rawOutput, processNumber, clientId, jobId }: StructuredOutputViewProps) {
  const [showRaw, setShowRaw] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const hasStructured = structuredOutput !== null && typeof structuredOutput === 'object'

  async function handleSaveTemplate() {
    if (!templateName.trim()) {
      toast.error('Nome do template e obrigatorio')
      return
    }
    if (!structuredOutput || !processNumber) return

    setSaving(true)
    try {
      const result = await createTemplateAction(
        templateName.trim(),
        templateDesc.trim() || null,
        processNumber,
        structuredOutput,
        clientId ?? null,
        jobId ?? null
      )
      if ('error' in result && result.error) {
        toast.error(result.error)
      } else {
        toast.success('Template salvo')
        setSaveDialogOpen(false)
        setTemplateName('')
        setTemplateDesc('')
      }
    } catch {
      toast.error('Falha ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {hasStructured && !showRaw ? (
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
          <div className="flex gap-2">
            {processNumber && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSaveDialogOpen(true)}
                className="text-xs"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                Salvar como Template
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw(true)}
              className="text-xs"
            >
              Ver Bruto
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <pre className="max-h-64 overflow-y-auto bg-zinc-50 p-3 rounded-md text-xs font-mono whitespace-pre-wrap">
            {rawOutput ?? 'Nenhum output disponivel'}
          </pre>
          {hasStructured && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw(false)}
              className="text-xs"
            >
              Ver Estruturado
            </Button>
          )}
        </div>
      )}

      {/* Save as Template dialog (TMPL-01) */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar como Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Nome</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. SaaS Market Research Template"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="template-desc">Descricao (opcional)</Label>
              <Textarea
                id="template-desc"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Quando usar este template..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} disabled={saving || !templateName.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Template'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
    return <span>{value ? 'Sim' : 'Nao'}</span>
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
                  ? nestedVal ? 'Sim' : 'Nao'
                  : JSON.stringify(nestedVal)}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return <span>{String(value)}</span>
}
