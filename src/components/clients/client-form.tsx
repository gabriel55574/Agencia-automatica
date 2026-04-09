'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useTransition } from 'react'
import { briefingSchema } from '@/lib/database/schema'
import { createClientAction } from '@/lib/actions/clients'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

// Merged form schema: client top-level + briefing fields flattened
const clientFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  company: z.string().min(1, 'Company is required').max(255),
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

export function ClientForm({ mode, defaultValues, clientId: _clientId }: ClientFormProps) {
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

      let result: { error: string } | { success: true } | undefined
      if (mode === 'create') {
        result = await createClientAction(fd)
      }
      // edit mode handled in Plan 02-02

      if (result && 'error' in result) {
        setServerError(result.error)
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
                <FormLabel>Client Name</FormLabel>
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
                <FormLabel>Company</FormLabel>
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
              <FormLabel>Niche</FormLabel>
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
              <FormLabel>Target Audience</FormLabel>
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
              <FormLabel>Additional Context <span className="text-zinc-400 text-xs">(optional)</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any other context that will help the squads..."
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
            {isPending ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Client' : 'Save Changes')}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
