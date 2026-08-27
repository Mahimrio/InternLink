---
name: ui_ux_pro_max
description: >-
  Enterprise-grade UI/UX design and implementation system. Use for creating,
  refining, and auditing user interfaces with rich aesthetics, modern typography,
  accessible color palettes (Deep Teal & Warm Amber), glassmorphism, fluid animations,
  and pixel-perfect Tailwind CSS components.
---

# UI/UX Pro Max Design System & Component Guidelines

This skill provides mandatory design standards, design tokens, component patterns, and aesthetic principles for building visually stunning, accessible, and high-performance user interfaces in InternLink.

---

## 1. Visual Identity & Brand Philosophy

- **Primary Brand Color (Deep Teal):** Represents trust, intelligence, career growth, and academic rigor.
- **Accent Color (Warm Amber):** Drives urgency, primary actions, call-to-actions (CTAs), and highlights.
- **Surface & Backgrounds:** Crisp off-whites/slate in light mode (`bg-slate-50`, `bg-white`), rich obsidian/slate depths in dark mode (`bg-slate-950`, `bg-slate-900`).
- **Elevation Philosophy:** Avoid harsh, heavy black shadows. Use subtle dual-layer shadows combined with delicate border rings (`border border-slate-200/80 dark:border-slate-800 shadow-sm`).

---

## 2. Typography Hierarchy

InternLink uses a dual-typeface system:
- **Display & Headings:** `Space Grotesk` (`font-heading`) — geometric, modern, distinctive.
- **Body & Dense UI:** `Inter` (`font-sans`) — hyper-legible, balanced x-height, neutral.

### Rules:
1. Always apply `font-heading font-semibold tracking-tight` on `h1`, `h2`, `h3`, and major metric counters.
2. Maintain strict heading hierarchy: Single `<h1>` per page with descriptive semantic content.
3. Use `text-balance` on headings to prevent single hanging words (orphans).
4. Use `tabular-nums` on financial figures, timestamps, counters, and table metrics.

---

## 3. Colors & Theme Tokens (OKLCH & Tailwind v4)

Tokens defined in `web/app/globals.css`:
- **Primary:** `oklch(0.45 0.12 195)` (Teal 700)
- **Primary Hover:** `oklch(0.38 0.13 195)` (Teal 800)
- **Accent:** `oklch(0.75 0.18 65)` (Amber 500)
- **Muted Background:** `oklch(0.97 0.01 200)` (Slate 50)
- **Muted Foreground:** `oklch(0.55 0.02 200)` (Slate 500)

---

## 4. Components & Layout Standards

### Page Container
- Wrap standard page content in `<PageContainer>` (`components/shared/page-container.tsx`): max width `max-w-7xl px-4 sm:px-6 lg:px-8`.
- Navigation headers and footers use wide edge-to-edge layout (`max-w-[1600px]`).

### Cards & Surfaces
- **Standard Cards:** `rounded-xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900`.
- **Hero / Glassmorphism Cards:** `rounded-2xl border border-white/40 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80`.

### Primary Action Buttons
- Major CTAs (Register, Log In, Apply Now, Submit) must use the `.btn-gradient-animate` class for a luminous, looping teal shimmer effect.
- Base UI `<Button>` rendered with Next.js `<Link>` must include `nativeButton={false}`:
  ```tsx
  <Button render={<Link href="/register" />} nativeButton={false} className="btn-gradient-animate">
    Get Started
  </Button>
  ```

### Inputs & Forms
- Always include an icon (`lucide-react`, 16px/18px) aligned with input fields.
- Inputs must have smooth focus rings: `focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2`.
- Form validation errors must appear with slide-in animation and red accent (`text-rose-500 text-xs font-medium`).

---

## 5. Micro-Animations & State Transitions

1. **Page Entries:** Apply staggered entry transitions (`animate-in fade-in slide-in-from-bottom-4 duration-500`).
2. **Interactive Elements:** Add subtle hover lifts (`hover:-translate-y-0.5 transition-all duration-200`).
3. **Skeleton Loaders:** When loading async data, use pulse skeletons that match the exact shape of content cards rather than generic spinners.
4. **Empty States:** When a list is empty (e.g. No applications, No interviews), render an illustrated icon, an encouraging heading, a helpful explanation, and a clear action button.

---

## 6. Pre-Implementation Checklist

- [ ] Does the UI feel premium, uncluttered, and purposeful?
- [ ] Are headings in `font-heading` (Space Grotesk) and body in `font-sans` (Inter)?
- [ ] Are contrast ratios at least 4.5:1 (WCAG AA) for all text?
- [ ] Are inputs annotated with clear labels, placeholders, and error messages?
- [ ] Is layout responsive across mobile (375px), tablet (768px), and desktop (1280px+)?
