/**
 * Agency OS: Notification preferences management
 *
 * Fetches operator notification preferences from the database.
 * Falls back to defaults if no preferences row exists (first run).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationPreferences } from './types'

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'email'> = {
  squad_completion_enabled: true,
  gate_failure_enabled: true,
  daily_digest_enabled: true,
  digest_hour_utc: 8,
}

/**
 * Fetch notification preferences for the operator.
 *
 * For solo operator mode, queries the first notification_preferences row.
 * If no row exists, returns defaults with the provided fallback email.
 *
 * @param supabase - Supabase admin client (service role)
 * @param fallbackEmail - Email to use if no preferences or override exists
 * @returns NotificationPreferences with resolved email address
 */
export async function getNotificationPreferences(
  supabase: SupabaseClient,
  fallbackEmail?: string
): Promise<NotificationPreferences> {
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('squad_completion_enabled, gate_failure_enabled, daily_digest_enabled, digest_hour_utc, email_override')
    .limit(1)
    .single()

  if (prefs) {
    return {
      squad_completion_enabled: prefs.squad_completion_enabled,
      gate_failure_enabled: prefs.gate_failure_enabled,
      daily_digest_enabled: prefs.daily_digest_enabled,
      digest_hour_utc: prefs.digest_hour_utc,
      email: prefs.email_override || fallbackEmail || process.env.NOTIFICATION_EMAIL || '',
    }
  }

  return {
    ...DEFAULT_PREFERENCES,
    email: fallbackEmail || process.env.NOTIFICATION_EMAIL || '',
  }
}
