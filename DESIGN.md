# Citeward — "Scriptorium Folio" Design System

This file is the single source of truth for how Citeward looks, moves, and speaks. Read it before modifying any stylesheet or component. Every token below is defined in `src/app/globals.css` and verified by `npm run verify:contrast` and `npm run verify:copy`.

## 1. Aesthetic Direction

**Ink on archival paper.** Citeward is an open-access manuscript similarity engine, stylometric authorship inspector, and Solana Devnet prior-art notary built for students and researchers. Because the core task is reading manuscripts side-by-side against numbered source matches and statistical telemetry, the interface adopts the quiet precision of a scholarly critical edition: warm archival paper (`#FAF8F4`), hairline rules (`#E2DED4`), tabular figures (`tabular-nums`), one action signal (`--cw-signal`), and a three-channel data triad sampled directly from the Citeward Folio Prism logo.

**Never introduce:**
- Glow `box-shadow` effects or blurred color blobs behind text
- Gradient text on headings or numbers
- Glassmorphism panels (`backdrop-filter` is permitted only on the sticky top bar)
- Uniform `2rem` card radii or 3-column generic icon-in-circle feature grids
- All-monospace body copy (monospace is strictly for hashes, shingle fingerprints, and aligned figures)
- Emojis or decorative Unicode symbols anywhere in UI copy, logs, or code
- Unverified marketing superlatives (`revolutionize`, `seamless`, `unlock`, `delve`, `tapestry`, `cutting-edge`, `game-changer`, `next-gen`, `supercharge`)

## 2. Three-Tier Token Architecture

All components reference semantic `--cw-*` tokens, never raw hex or Tailwind palette literals (`text-white`, `bg-slate-*`, `text-violet-*`).

### Surfaces
| Token | Light Hex | Dark Hex | Role |
|---|---|---|---|
| `--cw-paper` | `#FAF8F4` | `#0C0E12` | Page ground (warm archival sheet / night reading desk) |
| `--cw-raised` | `#FFFFFF` | `#12161F` | Manuscript sheet, inspector panel, active card |
| `--cw-sunken` | `#F1EFE8` | `#080A0E` | Index well, table header, code/fingerprint tray |
| `--cw-overlay` | `rgba(12,13,16,0.45)` | `rgba(0,0,0,0.68)` | Modal scrim |

### Ink Ramp (Measured WCAG AA >= 4.5:1 against all surfaces)
| Token | Light Hex | Dark Hex | Contrast on Paper (Light / Dark) | Role |
|---|---|---|---|---|
| `--cw-ink` | `#0C0D0F` | `#F3F2EE` | `18.52:1` / `17.40:1` | Primary manuscript & heading ink |
| `--cw-ink-2` | `#363940` | `#C7CBD4` | `10.84:1` / `11.62:1` | Secondary body copy & abstracts |
| `--cw-ink-3` | `#565A64` | `#949AA6` | `6.42:1` / `6.58:1` | Captions, metadata, kicker labels |
| `--cw-ink-4` | `#666A73` | `#7E8491` | `5.02:1` / `4.85:1` | Muted hints, placeholders |

### Rules & Borders
- `--cw-rule`: `#E2DED4` (light) / `#222836` (dark) — 1px editorial hairline
- `--cw-rule-2`: `#CFC9BC` (light) / `#313A4D` (dark) — emphasized table & panel divider
- `--cw-rule-ink`: `#0C0D0F` (light) / `#F3F2EE` (dark) — structural 2px folio header rule

### Single Action Signal (`--cw-signal`)
Interactive controls (buttons, links, focus rings, active tab indicators) use one color only so users never confuse a data highlight with a clickable button:
- `--cw-signal`: `#1939B7` (light) / `#6889FF` (dark)
- `--cw-signal-ink`: `#112888` (light) / `#8FA8FF` (dark)
- `--cw-signal-wash`: `#EDF1FF` (light) / `#162044` (dark)
- `--cw-signal-rule`: `#BFCBFF` (light) / `#2B3F82` (dark)

### Brand Data Triad (Logo Colors -> Inspection Channels)
Sampled from the three facets of the Citeward Folio Prism logo (`public/logo.svg`). Used strictly for manuscript span highlights, match badges, stylometric charts, and the 3D `ManuscriptPrismCanvas` — never for action buttons:
1. **Corpus & Citation Overlap (`--cw-corpus` — Teal)**
   - Light: base `#027A94` · ink `#045B70` (`7.18:1` on paper) · wash `#E5F4F8` · rule `#B0DCE8`
   - Dark: base `#2AD0F0` · ink `#6CE0F7` (`11.8:1` on paper) · wash `#0B2833` · rule `#164E63`
2. **Stylometric / Formulaic Drift (`--cw-stylo` — Crimson-Magenta)**
   - Light: base `#A80C60` · ink `#87084C` (`8.24:1` on paper) · wash `#FCE8F2` · rule `#EDB8D4`
   - Dark: base `#F45BA8` · ink `#FF85C2` (`8.9:1` on paper) · wash `#331024` · rule `#691E47`
3. **Verified Quote & On-Chain Seal (`--cw-attest` — Ochre-Gold)**
   - Light: base `#9E6E00` · ink `#735000` (`6.74:1` on paper) · wash `#FBF2DA` · rule `#E6CC85`
   - Dark: base `#F5BD1C` · ink `#FFD25A` (`12.4:1` on paper) · wash `#2E2206` · rule `#5E460D`

### Source Match Series (`--cw-s1` ... `--cw-s6`)
Numbered source match groups (`#1` through `#6+`) inside the Turnitin-style Document Viewer use distinct, contrast-verified inks and washes so overlapping citations remain distinguishable at a glance.

## 3. Typography & CJK Adaptation

- `--cw-font-display`: `'Instrument Serif', Georgia, serif` — headlines and editorial numerals only (`line-height: 0.98`, `letter-spacing: -0.025em` in Latin; automatically reset to `line-height: 1.32`, `letter-spacing: 0`, `font-style: normal` on `:lang(ja)`).
- `--cw-font-sans`: `'Inter', system-ui, sans-serif` — UI controls, manuscript reading pane, and tables.
- `--cw-font-mono`: `'JetBrains Mono', ui-monospace, monospace` — Rabin-Karp hashes, Solana transaction signatures, and aligned telemetry.
- All numeric columns, percentages, similarity scores, and live counters apply `font-variant-numeric: tabular-nums`.

## 4. Motion & 3D Rules

- **No JS `opacity: 0` trap on primary content:** Hero headlines, lead copy, and CTAs use CSS `@keyframes cw-rise` with `animation-fill-mode: both` so content remains 100% visible even if JavaScript is disabled or delayed.
- **Compositor-only properties:** Animate only `transform` and `opacity`.
- **3D `ManuscriptPrismCanvas`:** Loaded dynamically with `ssr: false` and an identically sized placeholder container to guarantee zero Cumulative Layout Shift (`CLS = 0`). Pauses its `requestAnimationFrame` loop via `IntersectionObserver` + `visibilitychange` when offscreen, and renders a single still frame when `prefers-reduced-motion: reduce` is active.
- **Adapted Skiper-UI primitives (`src/components/skiper/`):**
  - `skiper16`: Sticky scroll-stack cards without global Lenis smooth-scroll hijacking; collapses to a clean static list under reduced motion.
  - `skiper40`: Directional CSS underline sweep link (`.cw-link-sweep`).
  - `skiper41`: Progressive edge feather mask for horizontal ticker streams.
  - `skiper61`: Token-colored spring pointer spotlight (`pointer: fine` only) that preserves the native system cursor.

## 5. Internationalization & Accessibility Floor

- **Default locale:** English (`en`), with instant client-side switching across English (`en`), Bahasa Indonesia (`id`), Español (`es`), and 日本語 (`ja`).
- **Accessibility:** Visible `--cw-focus` ring on `:focus-visible`, `aria-expanded` + `aria-controls` on interactive disclosures, `aria-live="polite"` on scan status regions, and 3-state theme persistence (`system`, `light`, `dark`).
