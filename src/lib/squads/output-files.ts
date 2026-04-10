import path from 'path'
import fs from 'fs'

export function getClientOutputDir(clientId: string): string {
  return path.join(process.cwd(), 'outputs', 'clients', clientId)
}

export function getProcessOutputFilePath(clientId: string, processNumber: number, processName: string): string {
  const slug = processName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const num = String(processNumber).padStart(2, '0')
  return path.join(getClientOutputDir(clientId), `process-${num}-${slug}.md`)
}

export function processOutputFileExists(clientId: string, processNumber: number, processName: string): boolean {
  return fs.existsSync(getProcessOutputFilePath(clientId, processNumber, processName))
}
