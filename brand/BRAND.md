# SAUDA — Brand & Interface Manual
**సౌదా · The Kirana Ledger**

Version 2.0 · 2026-10-26 · supersedes the "Cool Classic" and "Lekvya Luxury" directions

---

## 1. The idea

**Sauda** (సౌదా / सौदा) means *the deal* — the bargain across the counter, the price agreed, the handshake that ends it.
The product is the book that remembers every deal after the shopkeeper has forgotten it: an offline-first POS,
inventory and khata ledger for the Indian high street.

The identity is built on one metaphor: **the ledger seal**.

> A shop's seal is its word. A ledger page folds at the corner where the day ends.
> Sauda is the seal on the page — one mark that says *this deal is recorded*.

That gives the mark its three parts:

| Part | Meaning |
| --- | --- |
| Solid ink tile | The shop — permanent, heavy, unmistakable at 16 px |
| Folded copper corner | The page turning; the end of a day's entries; the rupee weight |
| Serif **S** | The name, set in a book face — the ledger, not a startup |

No 3D bevel. No gradient. No glow. No sparkles. One ink, one paper, one copper.

### Personality
Composed · trustworthy · warm · precise · local.
It should feel like a well-bound bahi-khata that happens to run on a tablet — not like a Silicon Valley dashboard.

### Anti-brief (what we deliberately rejected)
- 3D ribbon S, bevels, glass reflections, neon blue gradients
- Hexagons, globes, shields, upward arrows, rupee coins, wheat, shopfronts, weighing scales
- More than one accent colour competing for attention
- "AI" as a visual language: sparkles, purple gradients, glowing orbs
- Rounded-pill everything; 16–24 px card radii; blue-slate SaaS palette
- Letter-spaced Telugu (breaks the script)

---

## 2. Logo

### Construction
- Grid 64 × 64. Tile 56 × 56 at (4, 4).
- Top-right corner clipped 14 × 14 (46,4 → 60,18).
- Serif **S** = Fraunces SemiBold, optical size 96, 47 px, optically centred at x 30.
- Copper fold fills the clipped triangle exactly; it is part of the silhouette, never an overlay.
- The S is paper on ink (primary) or ink on paper (reverse).

### Lockups
1. **Seal** — symbol only: favicon, app icon, avatar, stamp.
2. **Horizontal** — seal + SAUDA + సౌదా: sidebar, invoices, documents.
3. **Stacked** — seal above wordmark: signage, covers, splash.
4. **Wordmark** — SAUDA + సౌదా without seal: long-form documents, footers.

Wordmark: Fraunces SemiBold, uppercase, tracking `+0.12em` at display sizes, `+0.06em` below 24 px.
Telugu: Noto Sans Telugu SemiBold, `సౌదా`, **letter-spacing 0**, always.

### Clear space & minimums
- Clear space on all sides = half the tile width.
- Minimum seal: 16 px. Minimum horizontal lockup: 120 px wide.
- Below 24 px, use the seal; never shrink the full lockup.

### Don'ts
Do not outline the tile, round its corners, gradient the ink, recolour the fold, rotate, stretch,
add a shadow to the S, or place the seal on a mid-tone without a paper plate.

### Files
`brand/final/` — seal (primary/reverse/mono), horizontal and stacked lockups, wordmark, favicon set.

---

## 3. Colour

### Core
| Token | Hex | Role |
| --- | --- | --- |
| Ink 950 | `#14110F` | Dark surfaces, primary text on paper |
| Ink 900 | `#1C1815` | Sidebar, elevated dark |
| Ink 800 | `#2A241F` | Hairlines on dark |
| Paper | `#F7F3EA` | Canvas |
| Paper raised | `#FCFAF4` | Cards |
| Stone 200 | `#E3DACA` | Hairline borders |
| Stone 300 | `#CFC3AF` | Strong borders |
| Indigo 800 | `#202853` | Primary actions, links |
| Indigo 700 | `#293368` | Primary hover |
| Copper 700 | `#8A5A38` | Accent text on paper, fold |
| Copper 600 | `#A9714B` | Large accent marks, icons |
| Copper 400 | `#CF9F79` | Accent on ink |

### Semantic (functional, never decorative)
| Meaning | Hex | Notes |
| --- | --- | --- |
| Jama / credit / success | `#2F5D4E` (Sage 600) | replaces neon emerald |
| Udhar / debit / danger | `#7A2E35` (Oxblood 600) | replaces pure red |
| Warning / low stock | `#8C6A2F` (Brass 600) | replaces orange |
| Info / neutral accent | `#293368` (Indigo 700) | replaces blue |

### Contrast (WCAG)
| Pair | Ratio |
| --- | --- |
| Ink on paper | 16.98 : 1 |
| Indigo 800 on paper | 12.73 : 1 |
| Copper 700 on paper | 5.27 : 1 |
| Sage 600 on paper | 6.78 : 1 |
| Oxblood 600 on paper | 8.35 : 1 |
| Brass 600 on paper | 4.50 : 1 |
| Copper 400 on ink | 7.96 : 1 |
| Paper on ink | 16.98 : 1 |

Rule: copper 600 is for ≥ 18 px or icons only. Body-size accent text uses copper 700.
Semantic colours are reserved for state — never for decoration.

---

## 4. Typography

| Role | Family | Weights | Usage |
| --- | --- | --- | --- |
| Display | **Fraunces** | 400 / 600 / 900 | Brand, page titles, hero numerals |
| UI | **Instrument Sans** | 400 / 500 / 600 / 700 | Everything functional |
| Telugu | **Noto Sans Telugu** | 400 / 500 / 600 / 700 | All Telugu copy |
| Mono | **IBM Plex Mono** | 400 / 500 | Keycaps, IDs, receipt codes |

Rules
- Financial figures: `font-variant-numeric: lining-nums tabular-nums`.
- Micro labels: 10 px, uppercase, `letter-spacing: .18em`, 600.
- Body 13–14 px, line-height 1.5. Dense tables may go to 12 px.
- Telugu never receives letter-spacing. Line-height +0.15 over Latin.
- Maximum two families visible in one view (display + UI), Telugu excluded as a script.

---

## 5. Interface system

**Surface**
- Canvas `#F7F3EA` with a 3 % paper grain (fixed, pointer-events none).
- Cards `#FCFAF4`, 1 px `#E3DACA` hairline, 10 px radius, shadow `0 4px 12px -4px rgba(20,17,15,.10)`.
- No glass blur except modal scrims. No gradients on surfaces.
- Rules instead of boxes where possible: hairlines carry hierarchy.

**Shape**
- Radius scale: 2 / 4 / 6 / 8 / 10 / 12 px. Pills only for status tags and language toggles.
- Buttons 6 px radius, 40–44 px height, 12–13 px label, 600 weight.
- Primary = Indigo 800. Secondary = transparent + stone border. Tertiary = text + copper underline on hover.

**Density**
- Page padding 24 px; section gap 24–32 px; card padding 20–24 px.
- Tables: 44 px rows, hairline row rules, right-aligned tabular numerals.
- Macro-whitespace around page titles; dense data stays dense.

**Motion**
- 180–240 ms, `cubic-bezier(.2,.7,.2,1)`. Transform/opacity only.
- No infinite pulses. Status is a static dot with a ring.
- Respect `prefers-reduced-motion`.

**Iconography**
- Monoline, 1.5–1.6 px stroke, 18–20 px, currentColor. No filled gradient tiles.
- Lucide is acceptable; custom nav glyphs stay consistent with it.

**Voice**
- Telugu first, English second, Hindi third. Short, factual, shop-floor language.
- No "AI", no "revolutionary", no exclamation marks in labels.

---

## 6. Implementation map

| Layer | File |
| --- | --- |
| Tokens (colour, type, radius, shadow) | `tailwind.config.js` |
| Base, grain, cards, inputs, focus | `src/index.css` |
| Fonts, title, favicon | `index.html` |
| Logo component | `src/components/SaudaLogo.tsx` |
| Navigation shell | `src/components/Sidebar.tsx`, `src/components/GlassIcon.tsx` |
| Landing surface | `src/features/dashboard/DashboardScreen.tsx` |
| Brand assets | `brand/` |

Legacy palettes (`slateBase`, `saudaBlue`, `classicEmerald`, `classicCrimson`) are aliased to the new scales,
so existing screens inherit the system without a line-by-line rewrite.
