---
phase: 17
plan: 2
title: Breadcrumb Navigation
status: complete
commit: 181beeb
---

## What was built

Reusable Breadcrumb component and hierarchical breadcrumb navigation on all client detail pages.

## Changes

1. **`src/components/ui/breadcrumb.tsx`** (NEW) — Breadcrumb component with ChevronRight separators (14px), semantic HTML (`nav > ol > li`), `aria-label="Breadcrumb"`, ancestor links in `text-zinc-400` with `hover:text-[#6D8A03]` (lime dark), current page in `text-zinc-900 font-medium`.

2. **`src/app/(dashboard)/clients/[id]/page.tsx`** — Added breadcrumb: `Clientes > {client.name}`.

3. **`src/app/(dashboard)/clients/[id]/edit/page.tsx`** — Added breadcrumb: `Clientes > {client.name} > Editar`.

4. **`src/app/(dashboard)/clients/[id]/outputs/page.tsx`** — Added breadcrumb: `Clientes > {client.name} > Outputs`. Replaced old crude slash-separator header with standardized breadcrumb + simplified header.

## Verification

- TypeScript compilation: PASS (no errors)
- `breadcrumb.tsx` exists: YES
- Breadcrumb imported in client profile page: YES
- Breadcrumb imported in client edit page: YES
- Breadcrumb imported in client outputs page: YES
- Old `<span className="text-zinc-400">/</span>` separator removed from outputs: YES
- Root pages have no breadcrumbs: YES (only detail pages modified)

## Requirements addressed

- NAV-02: Operator always knows where they are in the page hierarchy with clickable ancestor navigation.
