'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { briefingSchema } from '@/lib/database/schema'
import { createClientAction, updateClientAction, type ActionResult } from '@/lib/actions/clients'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

// Merged form schema: client top-level + briefing fields flattened
const clientFormSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(255),
  company: z.string().min(1, 'Empresa e obrigatoria').max(255),
  niche: briefingSchema.shape.niche,
  target_audience: briefingSchema.shape.target_audience,
  additional_context: z.string().optional(),
})
type ClientFormValues = z.infer<typeof clientFormSchema>

interface ClientFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<ClientFormValues>
  clientId?: string  // required for edit mode
}

export function ClientForm({ mode, defaultValues, clientId }: ClientFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultValues ?? {
      name: '', company: '', niche: '', target_audience: '', additional_context: '',
    },
  })

  const onSubmit = (values: ClientFormValues) => {
    setServerError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('name', values.name)
      fd.set('company', values.company)
      fd.set('niche', values.niche)
      fd.set('target_audience', values.target_audience)
      if (values.additional_context) fd.set('additional_context', values.additional_context)

      let result: ActionResult | undefined
      if (mode === 'create') {
        result = await createClientAction(fd)
      } else if (mode === 'edit' && clientId) {
        result = await updateClientAction(clientId, fd)
      }

      if (result && 'error' in result) {
        setServerError(result.error)
        toast.error('Erro ao salvar: verifique os campos obrigatorios')
      } else if (result && 'success' in result) {
        toast.success(mode === 'create' ? 'Cliente criado com sucesso' : 'Cliente atualizado')
        if (result.redirectTo) {
          router.push(result.redirectTo)
        }
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Cliente</FormLabel>
                <FormControl><Input placeholder="e.g. João Silva" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <FormControl><Input placeholder="e.g. Acme Ltda" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="niche"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nicho</FormLabel>
              <FormControl><Input placeholder="e.g. SaaS B2B para empresas de logistica" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Publico-Alvo</FormLabel>
              <FormControl><Input placeholder="e.g. CTOs de empresas com 50-200 funcionarios" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additional_context"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contexto Adicional <span className="text-zinc-400 text-xs">(opcional)</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Qualquer contexto adicional que ajude os squads..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-sm text-red-600">{serverError}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? (mode === 'create' ? 'Criando...' : 'Salvando...') : (mode === 'create' ? 'Criar Cliente' : 'Salvar Alteracoes')}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
