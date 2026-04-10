'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { assembleSquadContext, confirmSquadRun } from '@/lib/actions/squad'
import { getTemplatesByProcess } from '@/lib/actions/templates'
import type { AssembledContext } from '@/lib/squads/assembler'

export interface PreviewData {
  context: AssembledContext
  prompt: string
  squadType: string
  processId: string
  processNumber: number
  clientId: string
  phaseId: string
}

interface PromptPreviewModalProps {
  open: boolean
  onClose: () => void
  data: PreviewData | null
}

/**
 * PromptPreviewModal: Read-only preview of the assembled prompt before confirming execution.
 *
 * D-10: Shows squad name, context summary, and full prompt.
 * D-11: "Confirm & Run" calls confirmSquadRun Server Action.
 * TMPL-03: "Reference Template" dropdown to include template content in squad prompt.
 *
 * T-05-11: All text rendered as React text nodes (no dangerouslySetInnerHTML).
 */
export function PromptPreviewModal({ open, onClose, data }: PromptPreviewModalProps) {
  const [confirming, setConfirming] = useState(false)
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string | null }>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // TMPL-03: Load templates when modal opens
  useEffect(() => {
    if (!open || !data) return
    setSelectedTemplateId(null)
    setLoadingTemplates(true)

    getTemplatesByProcess(data.processNumber).then((result) => {
      if ('templates' in result) {
        setTemplates(result.templates)
      } else {
        setTemplates([])
      }
      setLoadingTemplates(false)
    })
  }, [open, data])

  if (!data) return null

  const squadLabel = data.squadType.charAt(0).toUpperCase() + data.squadType.slice(1)
  const truncatedBriefing =
    data.context.briefing.length > 300
      ? data.context.briefing.slice(0, 300) + '...'
      : data.context.briefing

  async function handleConfirm() {
    if (!data) return
    setConfirming(true)
    try {
      // TMPL-03: Re-assemble context with selected template (if any)
      const assembled = await assembleSquadContext(
        data.clientId,
        data.processId,
        data.processNumber,
        selectedTemplateId
      )
      if ('error' in assembled) {
        toast.error(assembled.error)
        setConfirming(false)
        return
      }

      const result = await confirmSquadRun(
        data.processId,
        data.clientId,
        data.phaseId,
        assembled.squadType,
        assembled.prompt
      )
      if ('error' in result && result.error) {
        toast.error(result.error)
      } else {
        toast.success('Execucao do squad na fila')
        onClose()
      }
    } catch {
      toast.error('Falha ao enfileirar execucao do squad')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Executar Squad {squadLabel}</DialogTitle>
        </DialogHeader>

        {/* Truncation warning (D-10) */}
        {data.context.truncated && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm">
            Contexto foi truncado. Exibindo {data.context.outputsIncluded} de{' '}
            {data.context.totalOutputsAvailable} outputs anteriores (mais antigos removidos).
          </div>
        )}

        {/* Context summary */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">
              Briefing
            </h4>
            <p className="text-sm text-zinc-700">{truncatedBriefing || 'Nenhum briefing disponivel'}</p>
          </div>

          {data.context.priorOutputs.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">
                Outputs Anteriores
              </h4>
              <ul className="list-disc list-inside text-sm text-zinc-600 space-y-0.5">
                {data.context.priorOutputs.map((output, i) => (
                  <li key={i}>
                    Processo {output.processNumber}: {output.processName}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Feedback from Previous Cycle (D-10, T-09-08) — shown only for cycle 2+ clients */}
        {data.context.feedbackContext && (
          <div>
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">
              Feedback do Ciclo Anterior
            </h4>
            <pre className="max-h-48 overflow-y-auto bg-blue-50 border border-blue-100 p-3 rounded-md text-xs font-mono whitespace-pre-wrap break-words text-blue-900">
              {data.context.feedbackContext}
            </pre>
          </div>
        )}

        {/* Reference Template selector (TMPL-03) */}
        <div>
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">
            Template de Referencia
          </h4>
          {loadingTemplates ? (
            <p className="text-sm text-zinc-400">Carregando templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum template disponivel para este processo</p>
          ) : (
            <select
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              value={selectedTemplateId ?? ''}
              onChange={(e) => setSelectedTemplateId(e.target.value || null)}
            >
              <option value="">Nenhum (sem template)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.description ? ` — ${t.description}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Full prompt display */}
        <div>
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">
            Prompt Completo
          </h4>
          <pre className="max-h-96 overflow-y-auto bg-zinc-50 p-4 rounded-md text-xs font-mono whitespace-pre-wrap break-words">
            {data.prompt}
          </pre>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={confirming}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={confirming}>
            {confirming ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Confirmando...
              </>
            ) : (
              'Confirmar e Executar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
