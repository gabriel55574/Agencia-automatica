# Phase 16: Brand Identity & Sidebar Layout — Research

**Researched:** 2026-04-09
**Question:** What do I need to know to PLAN this phase well?

---

## Standard Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.2.3 | App Router, RSC, Server Actions |
| CSS | Tailwind CSS | v4 | CSS-first config via `@theme` directive, no tailwind.config.js |
| Components | shadcn/ui | new-york style | 21 components installed, Radix primitives |
| Icons | Lucide React | Already in project | Via shadcn iconLibrary config |
| Fonts | next/font/google | Built into Next.js | Self-hosted, zero layout shift |

---

## Key Technical Findings

### 1. Tailwind v4 CSS-First Configuration

**No tailwind.config.js needed.** Tailwind v4 uses the `@theme` directive in CSS to define custom tokens. The project already uses this pattern in `globals.css`.

**Two `@theme` variants:**

- **`@theme { ... }`** — Defines new design tokens as CSS custom properties on `:root`. Creates utility classes. Use for static values like `--color-velocity-lime: #BFF205`.

- **`@theme inline { ... }`** — References other CSS variables without creating a new variable. Use when a token references a `var()`. Example: `--font-sans: var(--font-montserrat)` must be in `@theme inline` to avoid scoping issues.

**Pattern for this phase:**

```css
@import "tailwindcss";

/* Static tokens — @theme (creates CSS vars + utility classes) */
@theme {
  --color-velocity-black: #062222;
  --color-velocity-lime: #BFF205;
  --color-velocity-white: #F2F2F2;
  --color-velocity-lime-hover: #ACD904;
  /* ... all static color/spacing/radius/shadow tokens ... */
}

/* Font references — @theme inline (references next/font CSS vars) */
@theme inline {
  --font-heading: var(--font-montserrat);
  --font-body: var(--font-roboto);
}
```

**Important:** The existing `@theme inline` block in `globals.css` references `--font-geist-sans` and `--font-geist-mono`. These must be replaced with `--font-montserrat` and `--font-roboto` respectively.

### 2. next/font/google — Multiple Fonts

Current `src/app/layout.tsx` loads Geist Sans and Geist Mono. Must be replaced with Montserrat + Roboto.

**Pattern:**

```tsx
import { Montserrat, Roboto } from 'next/font/google'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['600', '700'],  // heading-sm/md use 600, heading-lg/display use 700
})

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
  weight: ['400', '500'],  // body uses 400, active sidebar uses 500
})
```

Apply variables on `<html>`:
```tsx
<html lang="pt-BR" className={`${montserrat.variable} ${roboto.variable}`}>
```

Then in `globals.css` `@theme inline`:
```css
@theme inline {
  --font-heading: var(--font-montserrat);
  --font-body: var(--font-roboto);
}
```

This creates Tailwind utilities `font-heading` and `font-body`.

### 3. Sidebar Layout Architecture

**Server Component layout** in `src/app/(dashboard)/layout.tsx`:

```
<div className="flex h-screen">
  <Sidebar />                     {/* fixed 240px, dark theme */}
  <main className="flex-1 overflow-auto">
    {children}                    {/* light theme content */}
  </main>
</div>
```

**Sidebar is a Client Component** because it needs:
- `usePathname()` for active state detection
- Mobile state toggle (hamburger open/close)

**Sign-out** remains a Server Action (form action) — the sign-out button inside the Sidebar can use a form element that calls the server action.

### 4. Dark/Light Hybrid Theme

The sidebar needs dark theme tokens while the content area uses light. Two approaches:

**Approach A: Scoped CSS variables (RECOMMENDED)**

Define light theme tokens on `:root` and dark theme tokens on a `.sidebar` class:

```css
:root {
  --bg-primary: #F2F2F2;
  --text-primary: #062222;
  /* ... light theme ... */
}

.sidebar {
  --bg-primary: #062222;
  --text-primary: #F2F2F2;
  /* ... dark theme ... */
}
```

Components using `var(--bg-primary)` automatically get the right value based on their DOM context.

**Approach B: Explicit Tailwind classes**

Sidebar uses explicit dark color classes: `bg-velocity-black text-velocity-white`. Content area uses `bg-velocity-white text-velocity-black`.

**Decision: Use Approach B (explicit classes).** Simpler, more readable, no variable shadowing confusion. The sidebar has a fixed theme — it will never need to switch dynamically. Explicit classes like `bg-velocity-black` are self-documenting.

### 5. Mobile Responsive Pattern

**Breakpoint:** 1024px (`lg:` in Tailwind)

```
Desktop (>= 1024px):
  [Sidebar 240px] [Content flex-1]

Mobile (< 1024px):
  [MobileHeader 48px]
  [Content full-width]
  [SidebarOverlay when open]
```

**Implementation:**
- Sidebar hidden on mobile: `hidden lg:flex lg:w-60`
- MobileHeader shown on mobile only: `flex lg:hidden`
- Overlay sidebar: absolutely positioned, z-50, with backdrop
- State: `const [sidebarOpen, setSidebarOpen] = useState(false)` in a Client Component wrapper

### 6. Logo SVG Handling

SVG logo files are at `Logo/logotipo fundo claro.svg` (for dark sidebar background). These need to be either:

**Option A:** Move to `public/` directory for `<img>` loading
**Option B:** Import as React component via Next.js SVG loader

**Decision: Option A (public/ directory).** Copy logo SVGs to `public/logo/` with clean filenames:
- `public/logo/velocity-light.svg` (for sidebar — light text on dark bg)
- `public/logo/velocity-icon.svg` (for mobile header and favicon)

Use `<Image src="/logo/velocity-light.svg" />` with Next.js Image component (SVGs are passed through without optimization, which is correct).

### 7. Existing Component Migration

**Files to modify:**
- `src/app/layout.tsx` — Swap fonts (Geist → Montserrat + Roboto)
- `src/app/globals.css` — Inject all Velocity CSS tokens, replace `@theme inline` block
- `src/app/(dashboard)/layout.tsx` — Full restructure: header → sidebar + mobile header

**Files to create:**
- `src/components/layout/Sidebar.tsx` — New sidebar component
- `src/components/layout/MobileHeader.tsx` — Mobile-only slim header with hamburger

**Files to delete:**
- `src/components/layout/NavLinks.tsx` — Fully replaced by Sidebar

### 8. shadcn/ui Component Impact

The 21 existing shadcn components use zinc-based tokens from the default install. After injecting Velocity tokens into `globals.css`, the shadcn components will still use their original zinc variables unless we update the CSS variable mappings.

**Strategy:** Map shadcn's expected CSS variables to Velocity tokens:

```css
:root {
  /* Map shadcn expected vars to Velocity tokens */
  --background: #F2F2F2;     /* was #ffffff */
  --foreground: #062222;     /* was #171717 */
  --primary: #BFF205;        /* accent color */
  --primary-foreground: #062222;
  --destructive: #EF4444;
  --border: #E8EDED;
  /* etc. */
}
```

This ensures existing shadcn components automatically adopt brand colors without modifying each component file.

---

## Dependencies

| Dependency | Type | Notes |
|-----------|------|-------|
| Logo SVG files | Asset | Must exist at `Logo/logotipo fundo claro.svg` or be copied to `public/` |
| Montserrat font | External | Via Google Fonts, loaded by next/font |
| Roboto font | External | Via Google Fonts, loaded by next/font |
| Lucide React | Package | Already installed via shadcn |

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Logo SVG files may be missing from repo | MEDIUM | Check file existence before plan execution; provide fallback text logo |
| shadcn components may not pick up new tokens | LOW | Map Velocity tokens to shadcn expected CSS variable names |
| Tailwind v4 @theme syntax may differ from docs | LOW | Already verified against current globals.css — @theme inline pattern confirmed working |
| Mobile sidebar may cause layout shift | LOW | Use `fixed` positioning for overlay, not layout-shift-causing approaches |

---

## RESEARCH COMPLETE
