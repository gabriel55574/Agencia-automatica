/**
 * Agency OS: Token usage extraction from Claude CLI output (Phase 12)
 *
 * Parses the Claude CLI JSON envelope for token usage metadata.
 * Uses the same JSON-line-finding pattern as output-parser.ts:
 * find first line starting with '{', parse as JSON, check for usage field.
 *
 * Returns null gracefully when:
 * - stdout is empty or not parseable
 * - No "usage" field in the JSON envelope
 * - usage fields are not numbers
 *
 * Security (T-12-01): CLI output is local to the server worker process.
 * JSON.parse wrapped in try/catch. No external attacker can inject.
 */

import type { TokenUsage } from './types'

/**
 * Extract token usage from Claude CLI JSON output.
 *
 * Looks for the first JSON line in stdout (same pattern as parseCliOutput),
 * then checks for a "usage" object with input_tokens and output_tokens fields.
 *
 * @param rawStdout - Raw stdout from the Claude CLI process
 * @returns TokenUsage with input_tokens, output_tokens, total_tokens, or null
 */
export function extractTokenUsage(rawStdout: string): TokenUsage | null {
  if (!rawStdout || rawStdout.trim() === '') return null

  try {
    // Find first line that looks like JSON (same pattern as output-parser.ts)
    const jsonLine = rawStdout.split('\n').find((l) => l.trim().startsWith('{'))
    if (!jsonLine) return null

    // Parse the outer envelope
    const envelope = JSON.parse(jsonLine)

    // Check for usage field
    if (!envelope.usage || typeof envelope.usage !== 'object') return null

    const { input_tokens, output_tokens } = envelope.usage

    // Both must be numbers
    if (typeof input_tokens !== 'number' || typeof output_tokens !== 'number') return null

    return {
      input_tokens,
      output_tokens,
      total_tokens: input_tokens + output_tokens,
    }
  } catch {
    // JSON.parse failed -- not valid JSON
    return null
  }
}
