# Phase 12: Deferred Items

## Pre-existing TypeScript errors (out of scope)

1. **src/worker/job-runner.ts:305** - TS2339: Property 'catch' does not exist on type 'PromiseLike<void | undefined>'. Pre-existing issue from Phase 9 feedback loop integration. The `.then().catch()` chain uses a PromiseLike that lacks `.catch()`. Fix: wrap in `Promise.resolve()` or cast to `Promise`.
