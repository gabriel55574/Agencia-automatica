'use server'

/**
 * Agency OS: Server Actions for template management (Phase 15).
 *
 * TMPL-01: createTemplateAction — save squad structured_output as reusable template
 * TMPL-03: getTemplatesByProcess — fetch templates for PromptPreviewModal selector
 * Management: deleteTemplateAction, updateTemplateAction
 *
 * Security:
 * - Auth check via createClient().auth.getUser() at top of every action
 * - All inputs validated with Zod (UUID format, string length, number range)
 * - Admin client used only for DB writes, not for auth decisions
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { templateInsertSchema } from '@/lib/database/schema'
import type { ActionResult } from './clients'

/**
 * Create a template from a squad job's structured output (TMPL-01).
 * Called from StructuredOutputView "Save as Template" dialog.
 */
export async function createTemplateAction(
  name: string,
  description: string | null,
  processNumber: number,
  content: Record<string, unknown>,
  sourceClientId: string | null,
  sourceJobId: string | null
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const input = templateInsertSchema.safeParse({
    name,
    description,
    process_number: processNumber,
    content,
    source_client_id: sourceClientId,
    source_job_id: sourceJobId,
  })
  if (!input.success) return { error: input.error.issues[0]?.message ?? 'Invalid input' }

  const admin = createAdminClient()
  const { error } = await admin.from('templates').insert({
    name: input.data.name,
    description: input.data.description ?? null,
    process_number: input.data.process_number,
    content: input.data.content as unknown as import('@/lib/database/types').Json,
    source_client_id: input.data.source_client_id ?? null,
    source_job_id: input.data.source_job_id ?? null,
  })

  if (error) {
    console.error('[createTemplateAction] Insert error:', error)
    return { error: 'Failed to create template. Please try again.' }
  }

  revalidatePath('/templates')
  return { success: true }
}

/**
 * Delete a template by ID.
 * Called from the /templates management page.
 */
export async function deleteTemplateAction(templateId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const idResult = z.string().uuid().safeParse(templateId)
  if (!idResult.success) return { error: 'Invalid template ID' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('templates')
    .delete()
    .eq('id', idResult.data)

  if (error) {
    console.error('[deleteTemplateAction] Delete error:', error)
    return { error: 'Failed to delete template. Please try again.' }
  }

  revalidatePath('/templates')
  return { success: true }
}

/**
 * Update a template's name and description.
 * Called from the /templates management page.
 */
export async function updateTemplateAction(
  templateId: string,
  name: string,
  description: string | null
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const idResult = z.string().uuid().safeParse(templateId)
  if (!idResult.success) return { error: 'Invalid template ID' }

  const nameResult = z.string().min(1).max(255).safeParse(name)
  if (!nameResult.success) return { error: 'Name is required (max 255 characters)' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('templates')
    .update({
      name: nameResult.data,
      description: description ?? null,
    })
    .eq('id', idResult.data)

  if (error) {
    console.error('[updateTemplateAction] Update error:', error)
    return { error: 'Failed to update template. Please try again.' }
  }

  revalidatePath('/templates')
  return { success: true }
}

/**
 * Fetch templates filtered by process number (for PromptPreviewModal selector).
 * Returns template id, name, and content for the dropdown.
 */
export async function getTemplatesByProcess(
  processNumber: number
): Promise<{ templates: Array<{ id: string; name: string; description: string | null; content: Record<string, unknown> }> } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const numResult = z.number().int().min(1).max(16).safeParse(processNumber)
  if (!numResult.success) return { error: 'Invalid process number' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('templates')
    .select('id, name, description, content')
    .eq('process_number', numResult.data)
    .order('name', { ascending: true })

  if (error) {
    console.error('[getTemplatesByProcess] Query error:', error)
    return { error: 'Failed to load templates' }
  }

  return {
    templates: (data ?? []).map((t) => ({
      id: t.id as string,
      name: t.name as string,
      description: (t.description as string) ?? null,
      content: (t.content as Record<string, unknown>) ?? {},
    })),
  }
}
