'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { archiveClientAction, restoreClientAction } from '@/lib/actions/clients'

interface ArchiveDialogProps {
  clientId: string
  clientName: string
  isArchived: boolean
}

export function ArchiveDialog({ clientId, clientName, isArchived }: ArchiveDialogProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (isArchived) {
    return (
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() => {
            setError(null)
            startTransition(async () => {
              const result = await restoreClientAction(clientId)
              if (result && 'error' in result) {
                setError(result.error)
                toast.error(result.error)
              } else if (result && 'success' in result) {
                toast.success('Cliente restaurado')
                if (result.redirectTo) router.push(result.redirectTo)
              }
            })
          }}
        >
          {isPending ? 'Restaurando...' : 'Restaurar cliente'}
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:border-red-300">
          Arquivar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar {clientName}?</AlertDialogTitle>
          <AlertDialogDescription>
            O cliente sera ocultado das visualizacoes ativas. Voce pode restaura-lo depois pelo perfil.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const result = await archiveClientAction(clientId)
                if (result && 'error' in result) {
                  setError(result.error)
                  toast.error(result.error)
                } else if (result && 'success' in result) {
                  toast.success('Cliente arquivado')
                  if (result.redirectTo) router.push(result.redirectTo)
                }
              })
            }}
          >
            {isPending ? 'Arquivando...' : 'Arquivar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      {error && <p className="text-xs text-red-600 px-1 pb-2">{error}</p>}
    </AlertDialog>
  )
}
