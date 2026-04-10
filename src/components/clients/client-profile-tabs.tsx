'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PipelineAccordion } from '@/components/clients/pipeline-accordion'
import { OutputsBrowser } from '@/app/(dashboard)/clients/[id]/outputs/outputs-browser'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { PhaseRow, ProcessRow, GateRow, GateReviewRow, LatestJobData } from '@/lib/types/pipeline'
import type { ProcessWithRuns } from '@/lib/types/outputs'

interface ClientProfileTabsProps {
  clientId: string
  clientName: string
  // Pipeline tab data
  phases: PhaseRow[]
  processes: ProcessRow[]
  gates: GateRow[]
  latestJobs: Record<string, LatestJobData>
  latestReviews: Record<string, GateReviewRow>
  budgetUsage: Record<string, { budget: number; used: number; status: string }>
  // Outputs tab data
  outputsData: {
    phaseNumbers: number[]
    byPhase: Record<string, ProcessWithRuns[]>
    hasAnyRuns: boolean
  }
  // Briefing tab data
  briefing: {
    niche: string | null
    target_audience: string | null
    additional_context: string | null
  } | null
}

export function ClientProfileTabs({
  clientId,
  clientName,
  phases,
  processes,
  gates,
  latestJobs,
  latestReviews,
  budgetUsage,
  outputsData,
  briefing,
}: ClientProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('pipeline')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        <TabsTrigger value="outputs">Outputs</TabsTrigger>
        <TabsTrigger value="briefing">Briefing</TabsTrigger>
      </TabsList>

      <TabsContent value="pipeline" className="pt-6">
        {phases.length > 0 ? (
          <PipelineAccordion
            phases={phases}
            processes={processes}
            gates={gates}
            clientId={clientId}
            clientName={clientName}
            latestJobs={latestJobs}
            latestReviews={latestReviews}
            budgetUsage={budgetUsage}
          />
        ) : (
          <p className="text-sm text-[#8A9999]">Pipeline nao inicializado.</p>
        )}
      </TabsContent>

      <TabsContent value="outputs" className="pt-6">
        {outputsData.hasAnyRuns ? (
          <OutputsBrowser
            clientName={clientName}
            clientId={clientId}
            phaseNumbers={outputsData.phaseNumbers}
            byPhase={outputsData.byPhase}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="Nenhum output gerado"
            description="Os outputs das squads aparecerao aqui conforme forem gerados."
            actionLabel="Ir para Pipeline"
            onAction={() => setActiveTab('pipeline')}
          />
        )}
      </TabsContent>

      <TabsContent value="briefing" className="pt-6">
        {briefing ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-[#5C6E6E] uppercase tracking-wide mb-1">Nicho</dt>
                <dd className="text-sm text-foreground">
                  {briefing.niche ?? <span className="text-[#8A9999] italic">Nao informado</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#5C6E6E] uppercase tracking-wide mb-1">Publico-Alvo</dt>
                <dd className="text-sm text-foreground">
                  {briefing.target_audience ?? <span className="text-[#8A9999] italic">Nao informado</span>}
                </dd>
              </div>
              {briefing.additional_context && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-[#5C6E6E] uppercase tracking-wide mb-1">Contexto Adicional</dt>
                  <dd className="text-sm text-foreground whitespace-pre-wrap">{briefing.additional_context}</dd>
                </div>
              )}
            </dl>
            <div className="flex justify-end">
              <Link href={`/clients/${clientId}/edit`}>
                <Button variant="outline" size="sm">Editar Briefing</Button>
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8A9999] italic">Nenhum briefing registrado.</p>
        )}
      </TabsContent>
    </Tabs>
  )
}
