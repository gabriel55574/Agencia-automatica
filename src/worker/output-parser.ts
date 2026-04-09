/**
 * Agency OS: CLI output parser with two-level JSON deserialization.
 *
 * Claude Code CLI with --output-format json returns a JSON envelope:
 *   { "type": "result", "is_error": false, "result": "{\"key\":\"val\"}" }
 *
 * The `result` field is a JSON-encoded string containing the actual output.
 * This module handles:
 * 1. Finding the JSON line in potentially noisy stdout
 * 2. Parsing the outer envelope
 * 3. Parsing the inner result string as JSON
 * 4. Validating the parsed output against the process-specific Zod schema
 *
 * Security (T-05-01): All JSON.parse calls are wrapped in try/catch.
 * safeParse never throws. Malformed output returns null, preserving raw
 * output in squad_jobs.output for debugging.
 *
 * IMPORTANT: This file uses RELATIVE imports (not @/ alias) because it runs
 * in the worker process outside Next.js bundler.
 */

import { getProcessSchema } from '../lib/squads/schemas/index'

/**
 * Extracts the inner JSON from Claude CLI JSON envelope.
 *
 * Step 1: Find first line starting with '{', parse as JSON (outer envelope)
 * Step 2: Check is_error field — return null if true
 * Step 3: If envelope.result is a string, JSON.parse it (inner content)
 *         If inner parse fails, return the raw result string
 * Step 4: If envelope.result is missing, return null
 *
 * @param rawStdout - Raw stdout from the Claude CLI process
 * @returns Parsed inner content, or null if parsing fails or is_error is true
 */
export function parseCliOutput(rawStdout: string): unknown | null {
  try {
    // Find first line that looks like JSON
    const jsonLine = rawStdout.split('\n').find((l) => l.trim().startsWith('{'))
    if (!jsonLine) return null

    // Parse the outer envelope
    const envelope = JSON.parse(jsonLine)

    // Check for CLI error
    if (envelope.is_error === true) return null

    // Check result field exists
    if (envelope.result === undefined || envelope.result === null) return null

    // If result is a string, try to parse it as JSON (two-level deserialization)
    if (typeof envelope.result === 'string') {
      try {
        return JSON.parse(envelope.result)
      } catch {
        // Inner parse failed — return the raw string value
        return envelope.result
      }
    }

    // If result is already an object, return it directly
    return envelope.result
  } catch {
    // Outer JSON.parse failed — not valid JSON at all
    return null
  }
}

/**
 * Applies the process-specific Zod schema to parsed output.
 *
 * @param parsedOutput - The output from parseCliOutput (or any unknown value)
 * @param processNumber - The process number (1-16)
 * @returns Validation result with typed data on success, null data + error message on failure
 */
export function parseStructuredOutput(
  parsedOutput: unknown,
  processNumber: number
): { success: true; data: unknown } | { success: false; data: null; error: string } {
  const schema = getProcessSchema(processNumber)

  if (!schema) {
    return {
      success: false,
      data: null,
      error: `No schema found for process number ${processNumber}`,
    }
  }

  const result = schema.safeParse(parsedOutput)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    data: null,
    error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
  }
}
