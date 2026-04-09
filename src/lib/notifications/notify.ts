/**
 * Agency OS: High-level notification functions
 *
 * Each function:
 * 1. Checks notification preferences (respects enabled/disabled toggle)
 * 2. Renders the appropriate HTML template
 * 3. Sends the email via Resend
 * 4. Logs the result to notification_log table
 *
 * CRITICAL: These functions NEVER throw. All errors are caught, logged,
 * and recorded in notification_log with status='failed'.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { SquadCompletionData, GateFailureData, DigestData } from './types'
import { sendEmail } from './email'
import { squadCompletionTemplate, gateFailureTemplate, dailyDigestTemplate } from './templates'
import { getNotificationPreferences } from './preferences'

/**
 * Log a notification attempt to the notification_log table.
 */
async function logNotification(
  supabase: SupabaseClient,
  eventType: 'squad_completion' | 'gate_failure' | 'daily_digest',
  referenceId: string | null,
  recipientEmail: string,
  subject: string,
  status: 'sent' | 'failed' | 'skipped',
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('notification_log').insert({
      event_type: eventType,
      reference_id: referenceId,
      recipient_email: recipientEmail,
      subject,
      status,
      error_message: errorMessage || null,
    })
  } catch (err) {
    process.stdout.write(`[notifications] Failed to log notification: ${String(err)}\n`)
  }
}

/**
 * Send squad completion/failure notification (NOTF-01).
 *
 * @param supabase - Admin Supabase client
 * @param data - Squad completion data payload
 * @param jobId - squad_jobs.id for reference logging
 */
export async function notifySquadCompletion(
  supabase: SupabaseClient,
  data: SquadCompletionData,
  jobId: string
): Promise<void> {
  try {
    const prefs = await getNotificationPreferences(supabase)

    if (!prefs.squad_completion_enabled || !prefs.email) {
      await logNotification(supabase, 'squad_completion', jobId, prefs.email || 'none', `Squad run ${data.status}`, 'skipped')
      return
    }

    const html = squadCompletionTemplate(data)
    const subject = data.status === 'completed'
      ? `[Agency OS] Squad run completed — ${data.client_name}`
      : `[Agency OS] Squad run FAILED — ${data.client_name}`

    const result = await sendEmail(prefs.email, subject, html)

    await logNotification(
      supabase,
      'squad_completion',
      jobId,
      prefs.email,
      subject,
      result.success ? 'sent' : 'failed',
      result.error
    )
  } catch (err) {
    process.stdout.write(`[notifications] notifySquadCompletion error: ${String(err)}\n`)
  }
}

/**
 * Send gate failure/partial notification (NOTF-02).
 *
 * @param supabase - Admin Supabase client
 * @param data - Gate failure data payload
 * @param gateReviewId - gate_reviews.id for reference logging
 */
export async function notifyGateFailure(
  supabase: SupabaseClient,
  data: GateFailureData,
  gateReviewId: string
): Promise<void> {
  try {
    const prefs = await getNotificationPreferences(supabase)

    if (!prefs.gate_failure_enabled || !prefs.email) {
      await logNotification(supabase, 'gate_failure', gateReviewId, prefs.email || 'none', `Gate ${data.gate_number} ${data.overall_verdict}`, 'skipped')
      return
    }

    const html = gateFailureTemplate(data)
    const subject = `[Agency OS] Gate ${data.gate_number} ${data.overall_verdict} — ${data.client_name}`

    const result = await sendEmail(prefs.email, subject, html)

    await logNotification(
      supabase,
      'gate_failure',
      gateReviewId,
      prefs.email,
      subject,
      result.success ? 'sent' : 'failed',
      result.error
    )
  } catch (err) {
    process.stdout.write(`[notifications] notifyGateFailure error: ${String(err)}\n`)
  }
}

/**
 * Send daily digest notification (NOTF-03).
 *
 * @param supabase - Admin Supabase client
 * @param data - Digest data payload
 */
export async function notifyDailyDigest(
  supabase: SupabaseClient,
  data: DigestData
): Promise<void> {
  try {
    const prefs = await getNotificationPreferences(supabase)

    if (!prefs.daily_digest_enabled || !prefs.email) {
      await logNotification(supabase, 'daily_digest', null, prefs.email || 'none', `Daily Digest — ${data.date}`, 'skipped')
      return
    }

    const html = dailyDigestTemplate(data)
    const subject = `[Agency OS] Daily Digest — ${data.date}`

    const result = await sendEmail(prefs.email, subject, html)

    await logNotification(
      supabase,
      'daily_digest',
      null,
      prefs.email,
      subject,
      result.success ? 'sent' : 'failed',
      result.error
    )
  } catch (err) {
    process.stdout.write(`[notifications] notifyDailyDigest error: ${String(err)}\n`)
  }
}
