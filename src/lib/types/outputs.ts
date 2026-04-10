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
