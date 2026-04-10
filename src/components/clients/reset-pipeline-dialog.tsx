'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { resetPipelineAction } from '@/lib/actions/pipeline-reset'

interface ResetPipelineDialogProps {
  clientId: string
  clientName: string
  canReset: boolean
}

/**
 * ResetPipelineDialog: Confirmation dialog for starting a new pipeline cycle.
 *
 * Only enabled when the client has completed Phase 5 (canReset prop).
 * Calls resetPipelineAction Server Action on confirmation (D-08).
 *
 * When canReset is false, renders the button as disabled with a title
 * explaining the requirement (no tooltip component available).
 */
export function ResetPipelineDialog({ clientId, clientName, canReset }: ResetPipelineDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!canReset) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="O cliente deve completar a Fase 5 antes de iniciar um novo ciclo"
      >
        Reiniciar Pipeline (Novo Ciclo)
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
          Reiniciar Pipeline (Novo Ciclo)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Iniciar Novo Ciclo para {clientName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso iniciara um novo ciclo de pipeline para {clientName}. Todos os outputs de squad
            existentes serao preservados. O cliente voltara para a Fase 1 (Diagnostico).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isPending}
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const result = await resetPipelineAction(clientId)
                if ('error' in result) {
                  setError(result.error)
                  toast.error(result.error)
                } else {
                  toast.success('Pipeline reiniciado — novo ciclo iniciado')
                  router.refresh()
                }
              })
            }}
          >
            {isPending ? 'Reiniciando...' : 'Confirmar Reinicio'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      {error && <p className="text-xs text-red-600 px-1 pb-2">{error}</p>}
    </AlertDialog>
  )
}
