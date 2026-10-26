# Sauda — Rebrand Direction (Round 02)

**Date:** 26 October 2026
**Status:** research + concepts complete · **awaiting your approval** · no product code changed yet
**Why this round exists:** the previous logo, the font stack and the colour system were rejected. This document replaces all three, and re-plans the dashboard as a *shop cockpit*, not another card grid.

---

## 0. The one idea

> **Sauda is the deal. The screen is the khata.**

Every kirana shop runs on two objects: the **ledger** (ruled paper, running balance) and the **counter** (stamp, seal, bill). We are not building "a dashboard for a POS". We are building **a live ledger that happens to take payments**.

That gives three rules the whole rebrand obeys:

1. **Paper, not glass.** Warm paper surfaces, ink type, rules instead of shadows, stamps instead of badges.
2. **Numbers are the hero.** Money is set in a tabular mono at large size; labels are small caps; everything else gets out of the way.
3. **One accent per zone.** A shopkeeper reads colour as meaning — green = settled, red = overdue, yellow = watch. We never decorate with meaning colours.

---

## 1. Logo — 24 concepts, 6 shortlisted

All 24 are rendered in `brand/concepts-v2/sheet-1.png` (01–12) and `sheet-2.png` (13–24), with 16 px, 32 px and 48 px tests on every card. Each was checked in-browser: 12 cards per page, no overflow, no clipping, all fonts loaded.

### Shortlist

| # | Name | Family | What it is | Why it survives | Risk |
|---|---|---|---|---|---|
| **17** | **Kolam S** | Indian | An `S` drawn as a kolam dot-grid line — four dots, one continuous stroke | Genuinely Indian without being kitsch; a mark no competitor owns; reads as "ledger line that became a letter" | Needs the heaviest 16 px tuning; may need a simplified variant for favicon |
| **24** | **Ledger Rule** | Wordmark | `sauda` set in a ruled serif, the `s` cut by a rupee rule line | Best *wordmark*; works at any size; instantly says "ledger" | Weaker as a standalone icon |
| **04** | **Counter Seal** | Ledger | Circular shop stamp with counter + balance mark inside | Perfect for receipts, stickers, shutter, app icon; feels official | Needs a separate wordmark |
| **13** | **Ribbon S** | Monogram | An `S` folded from a bill ribbon | Elegant, ownable, scales well | Slightly decorative for a billing tool |
| **10** | **Grain** | Kirana | Three grain strokes forming an `S` | Kirana-native, friendly, cheap to animate | Generic "organic" territory |
| **01** | **Folded Leaf** | Ledger | Paper folded into an `S` with a fold shadow | Clean, paper metaphor, great at small sizes | Least distinctive of the six |

### Recommendation

**Use a system, not one file:**

- **Mark:** `#17 Kolam S` — for app icon, favicon, receipt header, loading state.
- **Wordmark:** `#24 Ledger Rule` — for the sidebar, login, invoices, WhatsApp statements.
- **Stamp:** `#04 Counter Seal` — for the "PAID" stamp on receipts and the day-end Z-report.

`#17 + #24` gives the brand a mark that is Indian and a wordmark that is legible. If you want a single mark only, take **#24**.

**What I need from you:** pick one number (or "the 17 + 24 + 04 system").

---

## 2. Typography — 3 routes

No Fraunces, no Instrument Sans, no IBM Plex Mono. All routes are Google Fonts, self-hosted later so billing never waits on a CDN.

| Route | Display | UI / body | Numbers | Telugu | Character |
|---|---|---|---|---|---|
| **1 · Bazaar Modern** *(recommended)* | **Bricolage Grotesque** | **Archivo** | **Martian Mono** | **Anek Telugu** | A variable grotesque with slightly wonky shoulders — modern Indian shop signage, not a startup template. Archivo is a workhorse at 12–14 px. Martian Mono's tabular figures make ₹ amounts line up in a column. |
| **2 · Ledger Press** | **Gloock** (or Bodoni Moda) | **Spline Sans** | **Azeret Mono** | **Ramaraja** | High-contrast display serif, like a 1960s bill book cover; Spline Sans keeps forms quiet; Ramaraja is the Telugu serif that matches. Most "premium", least "fast counter". |
| **3 · Signal Slab** | **Unbounded** | **Anek Latin** | **Space Mono** | **Baloo Tammudu 2** | Wide geometric display with a slabby weight; loud, poster-like, great for a brand that wants to be seen from the street. Tiring inside a dense POS after an hour. |

**Recommendation: Route 1.** A cashier reads at speed under bad tube light; a high-contrast serif (Route 2) loses thin strokes at 12 px, and Unbounded (Route 3) eats horizontal space in Telugu labels. Route 1 keeps personality in the display layer and discipline in the data layer.

Non-negotiables in implementation:

- Money always `font-variant-numeric: tabular-nums`, right-aligned, `.tnum`.
- Telugu gets `letter-spacing: 0` (Anek Telugu breaks if tracked).
- Telugu line-height 1.55; Latin 1.35.
- Numerals never in Telugu font — always Martian Mono, even on Telugu screens.

---

## 3. Colour — 4 palettes

Every ratio below was measured with `scripts/_contrast.mjs` and `scripts/_contrast2.mjs` (WCAG 2.1, sRGB). Body text needs **4.5:1**; large text / graphics need **3:1**.

### Route A · **Chilli & Neel** *(recommended)*

| Token | Hex | On paper |
|---|---|---|
| Ink (text) | `#191512` | **15.30** |
| Paper (bg) | `#F2EBDD` | — |
| Neel (credit, in) | `#23306B` | **10.37** |
| Paan (settled, healthy) | `#2B5A44` | **6.68** |
| Chilli (overdue, out) | `#C0431F` | 4.36 → **text use `#A23A19` = 5.61** |
| Haldi (watch) | `#8A6414` | 4.52 → **text use `#7A5510` = 5.65** |
| Muted | `#6B6257` | **5.04** |
| White on Chilli | `#FFFFFF` on `#A23A19` | **6.65** |

Why: mirchi red + indigo is Indian street colour, and **no competitor owns it** — Vyapar is blue/teal, myBillBook is blue/purple, Khatabook is blue, Loyverse is purple. Red is used *only* for money owed and cash out, so it never becomes decoration.

### Route B · **Haldi & Jamun**

| Token | Hex | On paper |
|---|---|---|
| Plum ink | `#2A1C2E` | **14.06** |
| Warm paper | `#F6EFDF` | — |
| Jamun | `#3A2344` | **12.19** |
| Haldi | `#8F6410` | **4.58** |

Why: turmeric and black plum — a mithai-box palette. Warmer and softer than A, slightly less "money". Good if you want the shop to feel welcoming rather than sharp. No red at all, so overdue needs haldi, which weakens urgency.

### Route C · **Paan & Chalk**

| Token | Hex | On chalk |
|---|---|---|
| Deep green-black | `#14201B` | **13.79** |
| Chalk | `#EDE9DA` | — |
| Paan | `#1E4E3A` | **7.83** |
| Clay | `#B4552F` | 4.03 → **text use `#93401F` = 5.77** |

Why: betel-leaf green on chalkboard, like a village shop's rate board. Very calm, very Indian, excellent for long shifts. Risk: green is the default "money app" colour, so it reads more expected than A.

### Route D · **Neel & Brass**

| Token | Hex | On sand |
|---|---|---|
| Near-black | `#1B1A17` | **14.26** |
| Sand paper | `#F1E8D2` | — |
| Indigo | `#1C2A56` | **11.36** |
| Madder | `#8B3A2E` | **6.28** |

Why: closest to the rejected copper direction. Listed for completeness and **not recommended** — it would repeat the direction you already turned down.

**Recommendation: Route A (Chilli & Neel).** It has the widest separation between "in", "out", "settled" and "watch", passes AA everywhere once the two text-safe variants are used, and is the least likely to look like every other billing app.

---

## 4. Dashboard — "The Day Tape"

### What is wrong today

The current dashboard is four KPI cards, a table and a radar panel. Each is a box. The shopkeeper has to *add up* four numbers in their head to answer the only question that matters at 8 pm: **"Did today work?"**

It also hides the two things a kirana owner checks constantly: **who owes me** and **what will run out tomorrow**.

### The concept

One horizontal **tape** carries the day's money from opening float to expected drawer. It is a single continuous strip, like the paper roll in the billing machine — not a grid. Everything else hangs off it.

```
┌──────────┬─────────────────────────────────────────────────────┬─────────────────────┐
│  SAUDA   │  KIRANA LEDGER · Monday, 26 October                 │  KHATA WATCH        │
│  mark    │  Sri Lakshmi General Store · Srinivas (Owner)       │                     │
│          │  ● scanner  ● drawer  ● LAN sync                    │  Ramesh Ji   42d  ₹780│
│  SELL    ├─────────────────────────────────────────────────────┤  Suresh      18d  ₹320│
│  Billing │  THE DAY TAPE                                       │  Lakshmi      6d  ₹210│
│  Tickets │  Opening ₹2,000 ─▶ Sales ₹18,450 ─▶ Out ₹1,240 ─▶   │  ─────────────────  │
│          │  Drawer should be ₹19,210        ▲ ₹340 vs yesterday │  ₹12,450 across 4   │
│  STOCK   │  ▁▂▃▅▆▇▇▆▅▃▂▁  hourly tape 9am → 9pm                │  [ Collect ]        │
│  Items   │                                                     │                     │
│  Inward  ├───────────────────────────────┬─────────────────────┤  SHELF RISK         │
│  Audit   │  COUNTER TAPE (live)          │  TODAY BY METHOD    │  Toor dal   2d  ▓▓░ │
│          │  #004  3:17p  Counter   ₹380  │  Cash   ₹9,120      │  Sona rice  3d  ▓▓░ │
│  PEOPLE  │  #003  5:17p  Ramesh    ₹780  │  UPI    ₹5,830      │  Sugar      4d  ▓░░ │
│  Khata   │  #002  5:17p  Suresh    ₹320  │  Khata  ₹3,500      │  [ Re-order ]       │
│  Staff   │  #001  5:17p  Ramesh    ₹410  │  ─────────────      │                     │
│          │  ── running ₹1,890 ──         │  Avg basket ₹380    │                     │
│  MONEY   ├───────────────────────────────┴─────────────────────┴─────────────────────┤
│  Books   │  Day-end  Re-orders  P&L  Health  Counters  LAN  Cloud   ← mono tool chips │
│  Cash    │                                                                             │
└──────────┴─────────────────────────────────────────────────────────────────────────────┘
```

### Zone rules

| Zone | Reads as | Data (already in app) |
|---|---|---|
| **Day Tape** | A single strip of paper; numbers count up on mount | `todaySalesPaise`, `todayCashPaise`, `todayUpiPaise`, opening float from day-end, yesterday delta |
| **Hourly tape** | A bar-strip sparkline, one bar per trading hour, no axes | bills grouped by hour |
| **Counter Tape** | Live bills, vertical dotted rule on the left, running total at the bottom | `bills` (latest 6), `formatPaise` |
| **Khata Watch** | Debtor stack ordered by days overdue, not by amount | `Customer.outstandingPaise`, `agingUtils` |
| **Shelf Risk** | Days-of-cover bars, worst first | `StockMovement`, `reorderUtils` |
| **Method split** | Three thin rules, not a donut | cash / UPI / khata |
| **Tool chips** | Small mono chips in a footer rail | the 7 existing studios |

### Visual rules

- Max radius **6 px**. One shadow, only on modals.
- **No card grid.** Panels are separated by 1 px ink rules at `10%`, not by boxes.
- Numbers: 40 px display mono for the tape figures, 13 px mono for table rows.
- Colour only for meaning: neel = credit, chilli = overdue/out, paan = settled, haldi = watch.
- Motion: number count-up 400 ms `ease-out`, tape rows stagger 40 ms, sparkline draws left-to-right 600 ms. All gated behind `prefers-reduced-motion`.
- Every old `data-testid` preserved so the audit suite keeps working.

### Why this is not another template

It is not a "KPI cards + chart + table" page. It is **one continuous money line** (the thing a ledger is), with the two anxiety lists — who owes me, what runs out — pinned to the edge. Print it in black and white and it still reads like a shop's day sheet.

---

## 5. Navigation — 5 tabs → grouped rail

| Group | Items | Source |
|---|---|---|
| Sell | Billing, Parked tickets | existing POS |
| Stock | Items, Inward, Audit, Re-order | existing + tool graduation |
| People | Khata, Suppliers, Staff | existing |
| Money | Day-end, Cash & bank book **(new)**, Expenses | P0 build |
| Books | Day book **(new)**, P&L, Balance sheet **(new)**, GST | P0 build |
| Setup | Printer, scale, counters, LAN, cloud | existing settings |

The current "Store tools" drawer disappears; its seven studios become either rail items (Day-end, Re-order, P&L, Health) or setup sections (LAN, Cloud, Counters).

---

## 6. Feature gaps to close after the rebrand (from the competitive audit)

Full 63-row matrix: `research/COMPETITIVE-AUDIT.md`. Sauda matches or beats **39/63**; missing **15**, partial **9**.

### P0 — parity blockers

| # | Module | Why a kirana needs it | Effort |
|---|---|---|---|
| 1 | **Estimates / quotations → invoice** | Monthly ration lists for households and offices; convert in one tap; WhatsApp share | M |
| 2 | **Purchase order document** | Reorder suggestions already exist, but no numbered PO to send or receive against | M |
| 3 | **Delivery challan** | Home delivery before payment | S |
| 4 | **Cash & bank book** | Cash drawer logs exist, but no account ledger, deposits, UPI settlement | M |
| 5 | **Day book** | One chronological tape of every sale, purchase, payment, expense | M |
| 6 | **Balance sheet** | Stock + receivables − payables + cash/bank | M |
| 7 | **GSTR-3B / 9 + GSTR-1 JSON** | GSTR-1 is view-only today; filing needs export | M |
| 8 | **Loyalty points** | Cheapest retention lever; both retail benchmarks ship it | S |
| 9 | **Staff permissions + activity log** | Roles exist in data but are not enforceable; no "who did what" | M |
| 10 | **Bulk export CSV + Tally** | Import exists, export does not | S |

### P1 — depth

Godown/warehouse transfer · price lists & customer tiers · serial/IMEI · customer display · offers engine · online catalogue · e-Invoice/e-Way · custom report builder.

### Honest note on `rea`

`rea` reverse-engineers **shipped artifacts** (APK/EXE/Electron/firmware). Sauda is a source TypeScript app and no competitor binary was supplied, so `rea` has no target here. If you want a competitor APK torn down (e.g. Vyapar's receipt layout or loyalty rules), give me the APK and I will run it — otherwise code inspection + public feature pages is the correct method, which is what the audit used.

---

## 7. Build plan after approval (skills named per step)

| Step | What ships | Skills used | Gate |
|---|---|---|---|
| 1 | Design tokens: new palette + type scale + radii in `tailwind.config.js`, `index.css`; legacy aliases remapped | `ponytail` (no new abstraction), `ui-ux-pro-max` (palette/type data), `design-system` | `qa-final.mjs` 6/6, zero `bg-blue-*`/`text-emerald-*` left |
| 2 | Logo: mark + wordmark + stamp as SVG components, favicon, receipt header | `logo-design`, `brand-extract` (measure), `browser` QA at 16/32/48 px | Contrast + 16 px legibility check |
| 3 | Shell: grouped rail, header status strip, kill the tools drawer | `frontend-design`, `emil-design-eng` (state/motion), `frontend-a11y` | Keyboard + focus test |
| 4 | Dashboard "Day Tape" rebuild | `frontend-design`, `emilkowalski-motion`, `d3-visualization` (sparkline), `ponytail` | `audit-app.mjs` D1–D5 green |
| 5 | P0 modules one per turn: Estimates → PO → Challan → Day book → Cash/Bank book → Balance sheet → GST export → Loyalty → Activity log → Export | `spec-driven-development` per module, `database-migrations` (IndexedDB version bump), `test-driven-development`, `browser` QA | new audit checks per module, old 46 still green |
| 6 | Final sweep: token audit, a11y (overlays get `role="dialog"` + Escape + focus trap), screenshots | `code-review-and-quality`, `verification-before-completion` | full suite + manual walkthrough |

Note on a11y: the audit found that most overlays are plain `div.fixed.inset-0` with no `role="dialog"`, no Escape handler and no focus trap. That is a real defect and it is included in Step 6, not deferred.

---

## 8. Decision sheet

Please answer four things:

1. **Logo** — `#17 Kolam S` + `#24 Ledger Rule` + `#04 Counter Seal` as a system? Or a single number?
2. **Type** — Route 1 (Bricolage / Archivo / Martian Mono / Anek Telugu) · Route 2 (Gloock / Spline Sans / Azeret / Ramaraja) · Route 3 (Unbounded / Anek Latin / Space Mono / Baloo Tammudu 2)?
3. **Palette** — A Chilli & Neel · B Haldi & Jamun · C Paan & Chalk · D Neel & Brass?
4. **Dashboard** — approve "The Day Tape" shape, or do you want a different hero (e.g. a full-width ledger sheet instead of the tape)?

Nothing is coded until these four are answered.

---

*Research sources and the 63-row matrix: `research/COMPETITIVE-AUDIT.md`. Functional test run: `research/TEST-REPORT.md`. Concept sheets: `brand/concepts-v2/sheet-1.png`, `sheet-2.png`.*
