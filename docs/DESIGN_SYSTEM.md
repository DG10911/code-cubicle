# DESIGN SYSTEM — "Intelligence Console"

Dark, restrained, high-density. One accent per product. No AI slop.
All tokens below are the *actual* values in `tailwind.config.ts` and
`src/app/globals.css`; components are the actual exports of `src/components/ui.tsx`.

Design language (brief §20): cinematic but professional, high information
density, restrained typography, excellent whitespace, subtle depth, meaningful
motion, strong hierarchy — **no unnecessary gradients, no excessive
glassmorphism, no random neon, no "AI toy" look.**

---

## 1. Color tokens (`tailwind.config.ts`)

### Neutral surfaces — `base` (near-black, layered depth)
| Token | Hex |
|---|---|
| `base-0` | `#07080b` (page background) |
| `base-50` | `#0b0d12` |
| `base-100` | `#0f1219` (panel) |
| `base-200` | `#161a23` |
| `base-300` | `#1e232e` |
| `base-400` | `#2a303d` (scrollbar) |
| `base-500` | `#3a4150` (muted mono / empty meter) |

### Text — `ink`
| Token | Hex | Use |
|---|---|---|
| `ink.DEFAULT` | `#e6e9ef` | body |
| `ink.muted` | `#a4adbd` | secondary |
| `ink.faint` | `#6b7484` | labels/captions |
| `ink.ghost` | `#454d5c` | placeholders/dividers |

### Lines
| Token | Value |
|---|---|
| `line.DEFAULT` | `rgba(255,255,255,0.08)` |
| `line.strong` | `rgba(255,255,255,0.14)` |

### Product accents (exactly one per product)
| Token | Hex | Product |
|---|---|---|
| `signal.DEFAULT` | `#38e1c8` (cyan) | ORCHESTRA |
| `signal.soft` | `#1f8f80` | |
| `signal.dim` | `rgba(56,225,200,0.12)` | |
| `impact.DEFAULT` | `#5ce27a` (green) | IMPACTOS |
| `impact.soft` | `#2f8f45` | |
| `impact.dim` | `rgba(92,226,122,0.12)` | |

### Semantic states
| Token | Hex | Meaning |
|---|---|---|
| `warn.DEFAULT` | `#f5b942` | needs review / medium confidence |
| `danger.DEFAULT` | `#f2637a` | failed / low confidence / conflict |
| `info.DEFAULT` | `#5aa9f5` | in-progress states |

Each of `warn/danger/info` also has a `.dim` at 0.12 alpha for backgrounds.

## 2. Typography
- **Sans:** Inter (`--font-sans`, loaded via `next/font/google` in `layout.tsx`).
- **Mono:** JetBrains Mono (`--font-mono`) — used for numbers (`.mono-num` =
  `font-mono tabular-nums`), IDs, block meters, source URLs.
- Custom size `2xs` = `0.6875rem / 1rem`, letter-spacing `0.02em` — the workhorse
  for labels, badges, captions.
- `body` sets `font-feature-settings: "cv11","ss01"`, antialiased, optimizeLegibility.

## 3. Spacing, radius, shadows
- **Radius:** Tailwind default plus `xl: 14px`, `2xl: 18px`. Panels use `2xl`,
  insets/buttons/inputs use `xl`, badges `md`, chips full-round.
- **Shadows (`boxShadow`):**
  - `panel` — `0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)` (subtle depth on panels).
  - `pop` — `0 20px 60px -20px rgba(0,0,0,0.8)` (popovers/drawers).
  - `glow` — `0 0 0 1px rgba(56,225,200,0.25), 0 0 30px -8px rgba(56,225,200,0.35)` (primary signal button only — restrained).
- **Spacing:** standard Tailwind scale; layout uses `px-5/6 py-4`, panel headers
  `px-5 py-4`, high-density rows `px-4 py-3`.

## 4. Surface components (`globals.css @layer components`)
| Class | Definition |
|---|---|
| `.panel` | `rounded-2xl border border-line bg-base-100/80 shadow-panel backdrop-blur-sm` |
| `.panel-inset` | `rounded-xl border border-line bg-base-50` |
| `.chip` | full-round `border-line bg-base-200 px-2.5 py-1 text-2xs text-ink-muted` |
| `.kbd` | keycap: `border-line bg-base-200 font-mono text-2xs` |
| `.grid-lines` | 40px background grid (landing/hero ambience) |
| `.mono-num` | `font-mono tabular-nums` |
| `.row-enter` | progressive row reveal (`fade-up`) for streaming datasets |

The page `body` uses two very low-alpha radial gradients (signal + info, ~0.04–0.05)
as ambient depth — the *only* gradients in chrome; content avoids gradient fills.

## 5. Component inventory (`src/components/ui.tsx`)
| Component | Purpose / API notes |
|---|---|
| `Button` | variants `primary\|ghost\|outline\|danger`, `accent signal\|impact`, sizes `sm\|md\|lg`; `primary` gets `shadow-glow` |
| `Panel` / `PanelHeader` | surface + header (title, subtitle, right slot, icon) |
| `Chip` | inline token/tag |
| `Badge` | tones `neutral\|signal\|impact\|warn\|danger\|info`, uppercase `2xs` |
| `ProgressBar` | 1.5px bar, accent `signal\|impact\|warn\|danger`, animated width |
| `BlockMeter` | ASCII `█/░` meter (live execution stages) |
| `ConfidenceMeter` | 14px bar + 2-dp value; color-banded by `classifyConfidence` (≥0.85 high/impact, ≥0.6 med/warn, else low/danger) |
| `Skeleton` | shimmer loading placeholder |
| `Sparkline` | inline SVG trend (non-scaling stroke) |
| `Stat` | KPI tile (label, mono value, hint, optional accent) |
| `EmptyState` | icon + title + description + action |

Shell (`components/shell.tsx`): sticky 60-unit left rail (product identity +
nav + "Switch to…" + persistent **"Fixture dataset · deterministic"** status),
sticky 14-unit top bar (`Console / <title>` breadcrumb + right slot).

## 6. Motion rules (brief §22 — motion communicates state, never decoration)
Keyframes/animations (`tailwind.config.ts`):
| Animation | Def | Use |
|---|---|---|
| `fade-up` | 0.4s `cubic-bezier(0.16,1,0.3,1)` | panel/row entrance, hero |
| `pulse-soft` | 1.6s ease-in-out infinite | live "active" status dots |
| `shimmer` | 1.8s infinite | skeleton loading |
| `spin-slow` | 1.4s linear infinite | in-progress task spinner |

Rule: only animate to signal state change (task active, loading, streaming rows,
progress). Do **not** animate everything.

## 7. State patterns
- **Empty:** `EmptyState` (icon in `ink-ghost`, title, muted description, action).
- **Loading:** `Skeleton` shimmer; `spin-slow` for active tasks; `BlockMeter`/
  `ProgressBar` for staged progress derived from real events.
- **Error:** `Button variant="danger"` / `Badge tone="danger"`; failed workflow
  state renders `danger`; the Cloudinary indicator honestly shows fixture vs live.
- **Uncertainty is a first-class state:** `warn` for `needs_review`, `danger` for
  low confidence, `unverified` shown explicitly — never hidden.

## 8. "No AI slop" principles (enforced)
1. One accent per product; semantic colors only carry meaning.
2. Restrained glow — `shadow-glow` on the single primary action only.
3. Gradients confined to hero text + ambient background at ≤0.05 alpha.
4. Monospace + tabular numerals for all data (a data-product tell).
5. Persistent honesty affordances: "fixture dataset" pill, Cloudinary status pill.
6. High density, quiet scrollbars, thin lines — an intelligence console, not a toy.

## 9. Responsive
`AppShell` is a fixed left rail + fluid content (`min-w-0 flex-1`). Grids use
`sm:grid-cols-*` / `md:grid-cols-2`; task rows hide the right metrics cluster
below `sm`. Dark-only (`color-scheme: dark`).
