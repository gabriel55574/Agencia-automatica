import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateList } from '@/components/templates/template-list'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: templates } = await supabase
    .from('templates')
    .select('id, name, description, process_number, source_client_id, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Templates</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Saved squad outputs that can be used as reference context for future runs.
        </p>
      </div>

      {templates && templates.length > 0 ? (
        <TemplateList templates={templates as Array<{
          id: string
          name: string
          description: string | null
          process_number: number
          source_client_id: string | null
          created_at: string
        }>} />
      ) : (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-lg font-medium">No templates yet</p>
          <p className="text-sm mt-1">
            Save a squad output as a template from any completed run.
          </p>
        </div>
      )}
    </div>
  )
}
