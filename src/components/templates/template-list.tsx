'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteTemplateAction } from '@/lib/actions/templates'
import { PROCESS_DEFINITIONS } from '@/lib/pipeline/processes'

interface TemplateListProps {
  templates: Array<{
    id: string
    name: string
    description: string | null
    process_number: number
    source_client_id: string | null
    created_at: string
  }>
}

export function TemplateList({ templates: initialTemplates }: TemplateListProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const result = await deleteTemplateAction(deleteId)
      if ('error' in result && result.error) {
        toast.error(result.error)
      } else {
        toast.success('Template excluido')
        setTemplates((prev) => prev.filter((t) => t.id !== deleteId))
        setDeleteId(null)
      }
    } catch {
      toast.error('Falha ao excluir template')
    } finally {
      setDeleting(false)
    }
  }

  function getProcessName(processNumber: number): string {
    const def = PROCESS_DEFINITIONS[processNumber]
    return def ? def.name : `Processo ${processNumber}`
  }

  return (
    <>
      <div className="space-y-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex items-start justify-between gap-4 p-4 bg-white border border-zinc-200 rounded-lg"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-zinc-900 truncate">{template.name}</span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {getProcessName(template.process_number)}
                </Badge>
              </div>
              {template.description && (
                <p className="text-sm text-zinc-500 line-clamp-2">{template.description}</p>
              )}
              <p className="text-xs text-zinc-400 mt-1">
                Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(template.id)}
              className="text-zinc-400 hover:text-red-600 shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(isOpen) => { if (!isOpen) setDeleteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            Tem certeza que deseja excluir este template? Esta acao nao pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
