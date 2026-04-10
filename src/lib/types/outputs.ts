// src/lib/types/outputs.ts
// Shared types for squad job outputs, used by outputs page and client profile tabs.

export type CompletedJob = {
  id: string
  processId: string
  squadType: string
  structuredOutput: Record<string, unknown> | null
  output: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

export type ProcessWithRuns = {
  processId: string
  processName: string
  processNumber: number
  squad: string
  phaseNumber: number
  phaseName: string
  runs: CompletedJob[]
}

/** A single gate review output entry, used in the Outputs tab gate reviews section */
export type GateReviewOutput = {
  id: string
  gateId: string
  gateNumber: number
  phaseNumber: number
  phaseName: string
  verdict: Record<string, unknown>
  rawOutput: string
  status: 'running' | 'completed' | 'failed'
  createdAt: string
}
