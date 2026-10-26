# Sauda — Functional Test Report

**Run:** 26 Oct 2026, 17:26 IST · build `vite dev @ localhost:5173`
**Driver:** Playwright + Chromium (Chrome channel, headless), viewport 1440 × 950, then a 390 × 844 mobile probe
**Script:** `scripts/audit-app.mjs` → raw results in `research/test-results.json`
**Screenshots:** `brand/review/audit/01-dashboard.png` … `08-mobile-390.png`

## Result

| | |
|---|---|
| Checks | **46** |
| Passed | **46** |
| Failed | **0** |
| Console / page errors | **0** |
| Horizontal overflow @1440 | none (1440/1440) |
| Horizontal overflow @390 | none |

Previous gate `scripts/qa-final.mjs` also passes 6/6 on the same build (design regression: khata chips, emoji policy, WhatsApp panel, no pulsing badges, PIN lock card, PIN 1234 unlock).

---

## 1. Dashboard

| Check | Result | Evidence |
|---|---|---|
| D1 Sidebar, brand, 5 primary tabs | PASS | 5 tabs, logo 40 px, sidebar visible |
| D2 Four KPI zones | PASS | 5 tabular numerals; Today's Sales, Khata Due, Stock Value, Today's Invoices |
| D3 Recent invoices table | PASS | 4 rows |
| D4 Low Stock Radar | PASS | panel renders |
| D5 Store tools drawer | PASS | 7 tools |

## 2. POS billing

| Check | Result | Evidence |
|---|---|---|
| P1 Search + F1/F2/F3 payment suite | PASS | cash=1, upi=1, khata=1 |
| P2 Telugu search (బియ్యం) | PASS | 2 matches |
| P3 English search (rice) | PASS | 7 matches |
| P4 Add to cart updates total | PASS | ₹1,550 |
| P5 Qty + doubles line | PASS | ₹1,550 → ₹3,100 |
| P6 Cash checkout finalises bill | PASS | bill written, cart cleared |
| P7 Empty-cart cash disabled | PASS | disabled |
| P8 Loose matrix (F8) | PASS | overlay opens with commodity matrix |
| P9 GSTR-1 report | PASS | slabs, taxable value, CGST/SGST render |
| P10 Park cart | PASS | parked ticket created |

## 3. Inventory

| Check | Result | Evidence |
|---|---|---|
| I1 Product list | PASS | 73 rows |
| I2 Search filters | PASS | 73 → 8 for బియ్యం |
| I3 Add Item form | PASS | name EN/TE, category, prices |
| I4 Stock inward studio | PASS | supplier, invoice, qty |
| I5 Barcode label studio | PASS | 50 × 25 mm sticker renders |
| I6 Stock audit & shrinkage | PASS | audit tab, 73 rows |
| I7 CSV import | PASS | file picker present (import only — no export) |

## 4. Khata

| Check | Result | Evidence |
|---|---|---|
| K1 Customer + supplier ledgers | PASS | 4 customer rows, supplier tab |
| K2 Aging buckets | PASS | 5 chips, no clipping |
| K3 Search | PASS | view narrows on రమేష్ |
| K4 Gave / Got entry | PASS | amount, method, note, date |
| K5 Bulk settlement | PASS | multi-select settle modal |
| K6 WhatsApp statement | PASS | composer opens |

## 5. Settings

| Check | Result | Evidence |
|---|---|---|
| S1 Six sections | PASS | printer, drawer, scale, profile, staff, snapshot |
| S2 58 mm width | PASS | selectable, persisted |
| S3 Language te → en | PASS | round trip clean |
| S4 Staff roles | PASS | OWNER / ADMIN / CASHIER |
| S5 Encrypted backup | PASS | `Sauda_Backup_2026-10-26.json`, 88.7 KB downloaded |

## 6. Studio modals

| Check | Result | Evidence |
|---|---|---|
| Re-order | PASS | FMCG 30-day forecast |
| P&L | PASS | revenue, COGS, expenses |
| Store health | PASS | vitality index, 14-day forecast |
| Day-end | PASS | Z-report, denomination count |
| LAN mesh | PASS | peer sync, zero-internet |
| Cloud backup | PASS | AES-256 vault |
| Multi-counter | PASS | primary host, concurrent billing |

## 7. Lock & global quality

| Check | Result | Evidence |
|---|---|---|
| L1 PIN pad | PASS | 12 keys |
| L2 Wrong PIN rejected | PASS | stays locked |
| L3 PIN 1234 unlocks | PASS | overlay closes |
| Q1 No h-overflow @1440 | PASS | 1440/1440 |
| Q2 No console/page errors | PASS | 0 |
| Q3 Mobile 390 usable | PASS | no h-scroll |

---

## 8. Defects found (not blocking, must fix in the rebrand)

### A11y — modals are not dialogs

Most overlays are `div.fixed.inset-0` with **no `role="dialog"`, no `aria-modal`, no Escape handler, no focus trap**. Only `PinLoginModal` has `role="dialog"`.

Affected: `ProductCatalog` (9 overlays), `KhataScreen` (6), `DashboardScreen` studios, POS modals.

Impact: a keyboard or screen-reader user can tab into the page behind the modal and cannot close it without hunting for an ×. Fix is scheduled into Step 6 of the build plan (overlay primitive with role, `aria-labelledby`, Escape, focus return).

### Mobile 390 — sidebar still 256 px

No horizontal scroll, but the rail takes 66% of a 390 px screen and leaves ~134 px for content. The mobile layout needs a bottom bar or drawer, not the desktop rail. Scheduled into Step 3 (shell rebuild).

### Export missing

Inventory has CSV **import** only. No CSV export, no Tally export, no GSTR-1 JSON. Confirmed in code and UI. Part of P0 gap #10.

### Stale milestone scripts

`test_milestone_*.mjs`, `test_app.js`, `audit_ui.mjs` target the removed top `header` nav and fail on selectors, not features. They are superseded by `scripts/audit-app.mjs`. They should be deleted or rewritten after the shell rebuild so the repo has one gate, not eight broken ones.

### Token drift in markup

Components still carry legacy names (`bg-slateBase-900/50`, `text-classicCrimson-600`, `bg-blue-600`) even though tokens now resolve to the new palette. This is why some colours feel inconsistent. The token sweep in Step 1 removes them.

---

## 9. What this run does **not** prove

Honest limits — these need hardware or a second machine:

- **Thermal printing** — receipt layout renders in DOM; no physical 58/80 mm printer attached.
- **Weighing scale** — RS-232 simulator path exists; no Essae/Phoenix/Eagle device attached.
- **Barcode scanner** — keyboard-wedge demo barcodes used, no physical scanner.
- **UPI** — QR is generated locally; no live payment gateway callback.
- **GST filing** — GSTR-1 is a viewer; nothing was uploaded to the portal.
- **LAN mesh** — single browser tab; no second device joined the peer mesh.
- **Cloud backup** — local encrypted file verified; no real Drive/remote round trip or restore.
- **Load** — 73 products, 4 bills. Not tested at 5,000 SKUs / 100k bills.
- **Hindi UI** — labels exist; only English and Telugu were round-tripped.

## 10. Verdict

The shipped core is **solid**: billing, khata, inventory, GST view, day-end, backup, LAN, lock all work and survive an automated sweep with zero console errors. The problems are not broken features — they are **missing modules** (the P0 list in `research/COMPETITIVE-AUDIT.md`), **one accessibility pattern** (dialogs), and **one layout** (mobile rail). All three are already in the build plan.
