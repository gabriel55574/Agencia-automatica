/**
 * Schema dispatcher: maps process numbers (1-16) to their Zod schemas.
 *
 * Used by:
 * - src/worker/output-parser.ts to validate CLI output against the correct schema
 * - Future: prompt templates reference schema field names for output format instructions
 *
 * @example
 * const schema = getProcessSchema(1)
 * if (schema) {
 *   const result = schema.safeParse(parsedOutput)
 * }
 */

import type { ZodTypeAny } from 'zod'

import { process01Schema } from './process-01'
import { process02Schema } from './process-02'
import { process03Schema } from './process-03'
import { process04Schema } from './process-04'
import { process05Schema } from './process-05'
import { process06Schema } from './process-06'
import { process07Schema } from './process-07'
import { process08Schema } from './process-08'
import { process09Schema } from './process-09'
import { process10Schema } from './process-10'
import { process11Schema } from './process-11'
import { process12Schema } from './process-12'
import { process13Schema } from './process-13'
import { process14Schema } from './process-14'
import { process15Schema } from './process-15'
import { process16Schema } from './process-16'

/**
 * Map of process number to its Zod validation schema.
 * Keys are 1-16 matching the 16 Agency OS marketing processes.
 */
const PROCESS_SCHEMAS: Record<number, ZodTypeAny> = {
  1: process01Schema,
  2: process02Schema,
  3: process03Schema,
  4: process04Schema,
  5: process05Schema,
  6: process06Schema,
  7: process07Schema,
  8: process08Schema,
  9: process09Schema,
  10: process10Schema,
  11: process11Schema,
  12: process12Schema,
  13: process13Schema,
  14: process14Schema,
  15: process15Schema,
  16: process16Schema,
}

/**
 * Returns the Zod schema for the given process number, or null if invalid.
 *
 * @param processNumber - The process number (1-16)
 * @returns The Zod schema for validation, or null for invalid process numbers
 */
export function getProcessSchema(processNumber: number): ZodTypeAny | null {
  return PROCESS_SCHEMAS[processNumber] ?? null
}

// Re-export all schemas for direct imports
export { process01Schema } from './process-01'
export { process02Schema } from './process-02'
export { process03Schema } from './process-03'
export { process04Schema } from './process-04'
export { process05Schema } from './process-05'
export { process06Schema } from './process-06'
export { process07Schema } from './process-07'
export { process08Schema } from './process-08'
export { process09Schema } from './process-09'
export { process10Schema } from './process-10'
export { process11Schema } from './process-11'
export { process12Schema } from './process-12'
export { process13Schema } from './process-13'
export { process14Schema } from './process-14'
export { process15Schema } from './process-15'
export { process16Schema } from './process-16'

// Re-export all types
export type { Process01Output } from './process-01'
export type { Process02Output } from './process-02'
export type { Process03Output } from './process-03'
export type { Process04Output } from './process-04'
export type { Process05Output } from './process-05'
export type { Process06Output } from './process-06'
export type { Process07Output } from './process-07'
export type { Process08Output } from './process-08'
export type { Process09Output } from './process-09'
export type { Process10Output } from './process-10'
export type { Process11Output } from './process-11'
export type { Process12Output } from './process-12'
export type { Process13Output } from './process-13'
export type { Process14Output } from './process-14'
export type { Process15Output } from './process-15'
export type { Process16Output } from './process-16'
