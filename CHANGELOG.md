# Changelog

## [Unreleased] — 2026-04-10

### Adicionado

- **Worker Monitor (`/worker`):** Nova página na sidebar com terminal-style viewer de jobs em tempo real. Lista jobs das últimas 24h com status, cliente, processo, duração e custo. Log do CLI atualiza via Supabase Realtime com auto-scroll.
- **Sistema de outputs por arquivo:** Cada processo concluído agora salva seu output em `outputs/clients/{client_id}/process-{N}-{slug}.md`. Squad prompts referenciam esses arquivos via `@mentions` para o Claude CLI ler diretamente, eliminando truncamento de contexto.
- **Mapeamento `context_from` por processo:** Cada processo declara explicitamente quais outputs anteriores precisa (`context_from: number[]` em `PROCESS_DEFINITIONS`). O assembler filtra apenas os processos necessários em vez de buscar todos os anteriores.
- **Gate outputs na aba Outputs do cliente:** Reviews de gate agora aparecem na aba Outputs com seção "Revisoes de Gate (IA)", exibindo verdict badge, resumo IA, checklist com ícones pass/fail e toggle de output bruto.
- **Realtime nas tabelas de pipeline:** Migration `00013_realtime_publication.sql` adiciona `squad_jobs`, `processes`, `quality_gates`, `gate_reviews` e `phases` à publicação `supabase_realtime` com `REPLICA IDENTITY FULL`. Pipeline UI agora atualiza automaticamente sem reload.

### Alterado

- **Worker terminal output:** Removido truncamento de 200/100 chars nos logs `[claude]` e `[tool]`. Tool calls agora mostram JSON completo formatado. Adicionado log de `tool_result`.
- **Assembler (`assembler.ts`):** Novo parâmetro `contextFrom?: number[]`. Quando fornecido, filtra outputs por processo específico; quando vazio (`[]`), pula a query (processo 1); sem parâmetro, mantém comportamento legado.
- **Squad actions (`squad.ts`):** Passa `PROCESS_DEFINITIONS[processNumber]?.context_from` automaticamente para o assembler.
- **Todos os 4 prompt builders** (estrategia, planejamento, growth, crm): Seção de contexto anterior usa `@/caminho/arquivo.md` para arquivos em disco, com fallback para texto do banco quando arquivo não existe.

### Corrigido

- **Gate outputs não apareciam na aba Outputs:** Jobs de gate review tinham `process_id = null`, sendo filtrados pelo guard `if (!job.process_id) continue`. Corrigido consultando a tabela `gate_reviews` diretamente.
- **Status do pipeline não atualizava sem reload:** Tabelas não estavam na publicação `supabase_realtime`, causando silêncio nas subscriptions Realtime. Resolvido com migration de publicação.

### Infraestrutura

- `src/lib/squads/output-files.ts` — helper para paths de arquivos de output
- `src/lib/types/outputs.ts` — tipo `GateReviewOutput`
- `src/components/worker/worker-monitor.tsx` — componente do monitor
- `src/app/(dashboard)/worker/page.tsx` — rota do monitor
- `outputs/clients/` — diretório gitignored para outputs de clientes
- Backfill manual dos 6 outputs do cliente existente via script Node.js
