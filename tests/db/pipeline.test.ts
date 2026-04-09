import { describe, it, beforeEach } from 'vitest'
import { cleanTestData } from './helpers'

beforeEach(async () => { await cleanTestData() })

describe('PIPE-01: Independent pipeline state per client', () => {
  it.todo('two clients created separately have independent phase rows and statuses')
  it.todo('process rows are isolated by client_id — no cross-contamination')
})

describe('PIPE-02: Gate-controlled transition (approve_gate RPC)', () => {
  it.todo('approve_gate advances phase: gate.status=approved, current phase completed, next phase active')
  it.todo('approve_gate on already-approved gate raises exception')
})

describe('PIPE-03: Gate rejection routes to specific failed processes', () => {
  it.todo('reject_gate sets gate.status=rejected and marks only selected processes as failed')
  it.todo('phase remains active after rejection (no regression)')
  it.todo('gate can be re-approved after rejection (rejected -> approved)')
})

describe('PIPE-04: Race condition protection', () => {
  it.todo('concurrent approve_gate calls do not result in duplicate phase transitions')
})
