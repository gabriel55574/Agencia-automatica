---
phase: 07-document-management
plan: 02
subsystem: ui
tags: [react-pdf, pdf-export, dynamic-import, next.js, client-side-rendering]

# Dependency graph
requires:
  - phase: 07-document-management
    plan: 01
    provides: OutputViewer component with Structured/Raw tabs and PDF placeholder comment
provides:
  - OutputPdfTemplate component for branded PDF generation from squad outputs
  - PdfDownloadSection wrapper for PDFDownloadLink with dynamic import
  - Export PDF button in OutputViewer with lazy-loaded @react-pdf/renderer
affects: [08-dashboard]

# Tech tracking
tech-stack:
  added: ["@react-pdf/renderer ^4.4.0"]
  patterns: [dynamic import with ssr:false for heavy client-side libraries, two-step lazy load button pattern]

key-files:
  created:
    - src/components/documents/OutputPdfTemplate.tsx
    - src/components/documents/PdfDownloadSection.tsx
  modified:
    - src/components/documents/OutputViewer.tsx
    - package.json

key-decisions:
  - "Two-step lazy load: Export PDF button click loads @react-pdf/renderer dynamically, then shows Download PDF link"
  - "Built-in Helvetica font only for v1 -- no custom font registration"
  - "Recursive renderStructuredFields handles nested objects with increasing indentation"

patterns-established:
  - "Dynamic import with ssr:false pattern for heavy client-only libraries: define const with next/dynamic, use loading fallback"
  - "Two-step button pattern: first click loads component, second click triggers action -- avoids loading large library on page load"

requirements-completed: [DOCS-03]

# Metrics
duration: 6min
completed: 2026-04-09
---

# Phase 7 Plan 2: PDF Export for Document Viewer Summary

**Client-side PDF export using @react-pdf/renderer with branded template, dynamic import, and two-step lazy loading from OutputViewer**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-09T15:37:22Z
- **Completed:** 2026-04-09T15:43:36Z
- **Tasks:** 2 code tasks + 1 checkpoint (documented)
- **Files modified:** 4

## Accomplishments
- Installed @react-pdf/renderer ^4.4.0 for client-side PDF generation
- Created OutputPdfTemplate with branded layout: Agency OS header, client/process/phase metadata, structured output as labeled fields (recursive), raw text fallback, and footer
- Created PdfDownloadSection as a PDFDownloadLink wrapper component
- Wired Export PDF button into OutputViewer using dynamic import (ssr:false) to keep @react-pdf/renderer out of initial page bundle
- Two-step lazy load: "Export PDF" click loads the library, then "Download PDF" link appears

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @react-pdf/renderer and create PDF template** - `9516fbe` (feat)
2. **Task 2: Wire PDF export button into OutputViewer** - `198aa29` (feat)

## Files Created/Modified
- `src/components/documents/OutputPdfTemplate.tsx` - React-PDF Document template with header, section, body (structured fields or raw text), and footer
- `src/components/documents/PdfDownloadSection.tsx` - PDFDownloadLink wrapper with loading state and Button UI
- `src/components/documents/OutputViewer.tsx` - Added dynamic import of PdfDownloadSection, showPdf state, Export PDF button replacing placeholder
- `package.json` - Added @react-pdf/renderer ^4.4.0 dependency

## Decisions Made
- Used two-step lazy load pattern: clicking "Export PDF" triggers dynamic import of @react-pdf/renderer, then shows "Download PDF" link -- avoids loading ~500KB library on page load
- Built-in Helvetica font for v1 (no custom font registration per plan spec)
- Recursive renderStructuredFields handles arbitrary depth of nested objects with indentation
- Null/undefined values render as "--" in PDF for clean presentation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Known Stubs
None - the PDF placeholder from Plan 01 has been fully replaced with working PDF export functionality.

## Checkpoint: Human Verification (Task 3)

**Type:** human-verify
**Status:** Documented for manual testing

The following verification steps should be performed when the app is running:
1. Navigate to a client profile page -- verify "View All Outputs" button links to /clients/{id}/outputs
2. On outputs page, expand a phase with completed runs
3. Click "View" on a run to open the inline viewer
4. Click "Export PDF" -- verify the button changes to "Generating PDF..." then "Download PDF"
5. Click "Download PDF" -- verify PDF downloads with Agency OS branding, client name, process/phase info, and output content
6. Open downloaded PDF -- verify it is readable and properly formatted with header, section, body, and footer

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete document management system is now functional: outputs browsing, inline viewer, raw download, and PDF export
- All components in src/components/documents/ directory are ready for reuse
- PDF template can be extended in future phases for additional document types
- Batch export deferred to v1.1 per CONTEXT.md

## Threat Mitigations Applied
- T-07-05: All PDF content rendered via @react-pdf/renderer Text elements -- no HTML/script injection possible
- T-07-02 (continued): Filename sanitization applied to PDF filenames using existing sanitizeForFilename helper

## Self-Check: PASSED

- All 3 key files verified on disk (OutputPdfTemplate.tsx, PdfDownloadSection.tsx, OutputViewer.tsx)
- Both task commits verified in git log (9516fbe, 198aa29)
- All 3 must_haves key_links verified (dynamic import, OutputPdfTemplate import, @react-pdf/renderer import)
- min_lines met: OutputPdfTemplate 222 lines (>= 40), PdfDownloadSection 50 lines (>= 15)
- @react-pdf/renderer present in package.json
- TypeScript compiles with zero errors

---
*Phase: 07-document-management*
*Completed: 2026-04-09*
