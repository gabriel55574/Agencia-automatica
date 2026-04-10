'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cloneClientAction } from '@/lib/actions/clients'

interface CloneClientDialogProps {
  sourceClientId: string
  sourceClientName: string
}

/**
 * CloneClientDialog: Clone a client's briefing to create a new client (TMPL-02).
 *
 * The new client starts fresh at Phase 1 with the source client's briefing.
 * Pipeline state, squad runs, and gate reviews are NOT copied.
 */
export function CloneClientDialog({ sourceClientId, sourceClientName }: CloneClientDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [cloning, setCloning] = useState(false)

  async function handleClone() {
    if (!name.trim() || !company.trim()) {
      toast.error('Nome e empresa sao obrigatorios')
      return
    }

    setCloning(true)
    try {
      const result = await cloneClientAction(sourceClientId, name.trim(), company.trim())
      if (result && 'error' in result) {
        toast.error(result.error)
      } else if (result && 'success' in result) {
        toast.success('Cliente clonado com sucesso')
        setOpen(false)
        if (result.redirectTo) router.push(result.redirectTo)
      }
    } catch {
      toast.error('Falha ao clonar cliente')
    } finally {
      setCloning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="h-3.5 w-3.5" />
          Clonar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Clonar Cliente</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-500">
          Criar um novo cliente com o mesmo briefing de {sourceClientName}. O novo cliente comecara na Fase 1.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="clone-name">Nome do Cliente</Label>
            <Input
              id="clone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do novo cliente"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="clone-company">Empresa</Label>
            <Input
              id="clone-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={cloning}>
            Cancelar
          </Button>
          <Button onClick={handleClone} disabled={cloning || !name.trim() || !company.trim()}>
            {cloning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Clonando...
              </>
            ) : (
              'Clonar Cliente'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
