/**
 * Agency OS: Email sending wrapper using Resend
 *
 * Wraps the Resend API for sending notification emails.
 * CRITICAL: sendEmail NEVER throws. All errors are caught and returned
 * as a result object. Email failures must NEVER affect squad job processing.
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Send an email via Resend. Returns a result object — never throws.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - Complete HTML email body
 * @returns SendEmailResult with success status and optional error message
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  try {
    const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'Agency OS <noreply@agencyos.local>'

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })

    if (error) {
      process.stdout.write(`[notifications] Email send error: ${error.message}\n`)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.stdout.write(`[notifications] Email send exception: ${message}\n`)
    return { success: false, error: message }
  }
}
