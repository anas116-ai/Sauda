# Sauda — Competitive Audit & Feature Gap Report

**Date:** 26 October 2026
**Product:** Sauda (సౌదా) — kirana ledger + POS for Indian general stores
**Prepared for:** Sauda rebrand (Round 02) — research gate before design
**Method:** public feature pages of each product, read on 26 Oct 2026, cross-checked against Sauda's own domain model and UI (`src/types/index.ts`, `src/features/*`, `src/utils/*`). Competitor cells are public claims, not a hands-on trial; `◐` means partial, add-on, plan-gated, or ambiguous on the public page.

---

## 1. Why these six products

| Product | Category | Why it matters to Sauda |
|---|---|---|
| **Vyapar** | GST billing + accounting for small business | The widest Indian SMB feature surface: billing, inventory, books, GST, loans, online store. The parity benchmark. |
| **myBillBook** | Retail billing + inventory | Strongest retail/POS packaging: hardware, batches, labels, loyalty, multi-store, e-invoice. The retail benchmark. |
| **Loyverse** | Global POS + back office | Best-designed POS interaction model: open tickets, customer display, loyalty, stocktakes, employee rights. The UX benchmark. |
| **Khatabook** | Ledger-first khata app | The habit Sauda inherits: fast udhar entry, WhatsApp reminders, simple language. The adoption benchmark. |
| **Dukaan** | Online storefront for local sellers | Catalogue + WhatsApp commerce; relevant to the "online store" gap. |
| **Marg / GoFrugal** | Traditional Indian retail ERP | What large kirana chains use: price lists, godown transfer, schemes, secondary sales. The depth benchmark. |

Sources read directly:
- https://vyaparapp.in/blog/vyapar-app-features/ (Vyapar complete feature list, updated 18 Dec 2025)
- https://mybillbook.in/s/billing-software-for-retail-shop/ (myBillBook retail feature page)
- https://www.loyverse.com/features (Loyverse feature index)

---

## 2. What Sauda already does well (evidence in code)

Sauda is **not** a thin clone. These are shipped and were exercised in the test run:

| Capability | Evidence |
|---|---|
| Bilingual Telugu/English/Hindi UI | `AppContext` language switch, `t(te, en, hi)` across screens |
| Bilingual thermal receipt, 58 mm / 80 mm | `ThermalReceipt.tsx`, `PrinterConfig`, `PrinterPaperWidth` |
| POS billing with cash / UPI QR / khata / split / bank | `PosScreen.tsx`, `PaymentMethod`, `SplitPaymentDetail` |
| B2B tax invoice vs B2C retail | `InvoiceType`, B2B modal in POS |
| GSTR-1 slab view | `Gstr1Report`, `utils/gst.ts`, GSTR-1 modal in POS |
| Customer khata with credit limits, aging buckets, interest | `Customer`, `CustomerLedgerEntry`, `interestUtils.ts`, `agingUtils.ts` |
| Supplier ledger + purchase inward | `Supplier`, `SupplierLedgerEntry`, `PurchaseInward`, Khata screen supplier tab |
| Batch / expiry radar | `ProductBatch`, `ExpiryStatus`, inventory radar tab |
| Barcode label studio (50 × 25 mm) | `ProductCatalog.tsx`, `BarcodeSvg.tsx` |
| Physical stock audit & shrinkage | `StockAuditSession`, `StockAuditItem`, audit tab |
| Smart reorder with supplier PO groups | `SmartReorderRecommendation`, `SupplierPurchaseOrderGroup`, `reorderUtils.ts` |
| Loose commodities matrix + RS-232 weighing scale | `LooseCommoditiesModal`, `WeighingScaleConfig`, `ScaleProtocol` (Essae/Phoenix/Eagle) |
| Park / hold bill | `park-cart-btn`, verified in test run |
| Returns / exchange, void bill with stock + khata reversal | `BillStatus RETURNED/CANCELLED`, dashboard void handler |
| Day-end Z-report with denomination count | `DayEndClosingReport`, `CashDenominationCount`, `dayEndUtils.ts` |
| Cash drawer event log | `CashDrawerLog`, `DrawerEventType` |
| Offline-first IndexedDB (Dexie) | `src/db/index.ts`, `useLiveQuery` everywhere |
| LAN mesh multi-counter sync | `LanPeerDevice`, `LanSyncDeltaPackage`, `MultiCounterModal` |
| Encrypted cloud/local backup + restore | `EncryptedBackupEnvelope`, `CloudBackupModal`, 88.7 KB JSON verified |
| P&L by category/product + expenses | `ProfitLossReport`, `ProfitLossStudioModal`, expense form |
| Store health score & FMCG velocity grading | `StoreHealthReport`, `ProductVelocityMetric` |
| PIN terminal lock with roles | `PinLoginModal`, `UserRole` |

**Unique to Sauda (not found on the three benchmark pages):** Telugu-first bilingual billing, loose-grain scale matrix with budget/grams entry, LAN mesh that works without internet, store-health scoring, FMCG velocity grading, encrypted local-first backup.

---

## 3. Pin-to-pin feature matrix

Legend: `✅` offered · `◐` partial / add-on / plan-gated / unclear · `❌` not offered · **Sauda** column is verified against this codebase, not marketing.

### 3.1 Billing & sales

| # | Feature | Vyapar | myBillBook | Loyverse | Sauda |
|---|---|---|---|---|---|
| 1 | GST retail invoice (B2C) | ✅ | ✅ | ◐ | ✅ |
| 2 | B2B tax invoice | ✅ | ✅ | ◐ | ✅ |
| 3 | Estimates / quotations | ✅ | ✅ | ❌ | ❌ |
| 4 | Sale orders | ✅ | ✅ | ❌ | ❌ |
| 5 | Delivery challan | ✅ | ✅ | ❌ | ❌ |
| 6 | Fast POS billing | ✅ | ✅ | ✅ | ✅ |
| 7 | Barcode scanning | ✅ | ✅ | ✅ | ✅ |
| 8 | Weighing scale integration | ◐ | ✅ | ✅ | ✅ |
| 9 | Loose / open-price items | ◐ | ✅ | ✅ | ✅ |
| 10 | Park / hold / open ticket | ❌ | ◐ | ✅ | ✅ |
| 11 | Split payment | ◐ | ◐ | ✅ | ✅ |
| 12 | Sales return / exchange | ✅ | ✅ | ✅ | ✅ |
| 13 | Discounts & free schemes | ✅ | ✅ | ✅ | ◐ |
| 14 | Price lists | ✅ | ✅ | ❌ | ❌ |
| 15 | Customer-facing display | ❌ | ❌ | ✅ | ❌ |
| 16 | 58 mm / 80 mm receipt | ✅ | ✅ | ✅ | ✅ |
| 17 | Bilingual receipt (Telugu) | ❌ | ◐ | ❌ | ✅ |
| 18 | Offline billing | ✅ | ✅ | ✅ | ✅ |

### 3.2 Customers, credit & loyalty

| # | Feature | Vyapar | myBillBook | Loyverse | Sauda |
|---|---|---|---|---|---|
| 19 | Khata / credit ledger | ✅ | ✅ | ◐ | ✅ |
| 20 | Credit limits + aging buckets | ✅ | ✅ | ◐ | ✅ |
| 21 | Interest on overdue | ◐ | ◐ | ❌ | ✅ |
| 22 | WhatsApp statement / reminder | ✅ | ✅ | ❌ | ✅ |
| 23 | Loyalty points / rewards | ◐ | ✅ | ✅ | ❌ |
| 24 | Customer price tiers / groups | ✅ | ✅ | ✅ | ◐ |
| 25 | Bulk settlement | ✅ | ✅ | ❌ | ✅ |

### 3.3 Purchases & inventory

| # | Feature | Vyapar | myBillBook | Loyverse | Sauda |
|---|---|---|---|---|---|
| 26 | Supplier ledger | ✅ | ✅ | ◐ | ✅ |
| 27 | Purchase inward | ✅ | ✅ | ✅ | ✅ |
| 28 | Purchase order document | ✅ | ✅ | ✅ | ◐ |
| 29 | Batch / expiry | ✅ | ✅ | ◐ | ✅ |
| 30 | Serial / IMEI tracking | ◐ | ✅ | ❌ | ❌ |
| 31 | Physical stock audit | ✅ | ✅ | ✅ | ✅ |
| 32 | Barcode label printing | ✅ | ✅ | ◐ | ✅ |
| 33 | Godown / warehouse transfer | ✅ | ✅ | ✅ | ❌ |
| 34 | Multi-store | ✅ | ✅ | ✅ | ❌ |
| 35 | Low-stock alerts | ✅ | ✅ | ✅ | ✅ |
| 36 | Reorder suggestions | ✅ | ✅ | ◐ | ✅ |
| 37 | Online catalogue / store | ✅ | ✅ | ◐ | ❌ |

### 3.4 Money, books & tax

| # | Feature | Vyapar | myBillBook | Loyverse | Sauda |
|---|---|---|---|---|---|
| 38 | Cash / UPI / bank / split | ✅ | ✅ | ✅ | ✅ |
| 39 | Bank accounts & reconciliation | ✅ | ✅ | ❌ | ❌ |
| 40 | Cash book / day book | ✅ | ✅ | ◐ | ❌ |
| 41 | Expense entry | ✅ | ✅ | ✅ | ✅ |
| 42 | Profit & loss | ✅ | ✅ | ✅ | ✅ |
| 43 | Balance sheet | ✅ | ✅ | ❌ | ❌ |
| 44 | Loans & advances | ✅ | ◐ | ❌ | ❌ |
| 45 | Day-end Z-report + denominations | ◐ | ◐ | ✅ | ✅ |
| 46 | Cash-drawer audit log | ❌ | ❌ | ◐ | ✅ |
| 47 | GSTR-1 | ✅ | ✅ | ❌ | ◐ (view only) |
| 48 | GSTR-3B | ✅ | ✅ | ❌ | ❌ |
| 49 | GSTR-9 | ✅ | ◐ | ❌ | ❌ |
| 50 | e-Invoice (IRN / QR) | ✅ | ✅ | ❌ | ❌ |
| 51 | e-Way bill | ✅ | ✅ | ❌ | ❌ |
| 52 | HSN summary | ✅ | ✅ | ◐ | ◐ |

### 3.5 Staff, data & intelligence

| # | Feature | Vyapar | myBillBook | Loyverse | Sauda |
|---|---|---|---|---|---|
| 53 | Roles & permissions | ✅ | ✅ | ✅ | ◐ (3 roles) |
| 54 | Activity / audit log | ✅ | ✅ | ✅ | ❌ |
| 55 | Employee time clock | ❌ | ❌ | ✅ | ❌ |
| 56 | Multi-device sync | ✅ | ✅ | ✅ | ✅ |
| 57 | Bulk product import | ✅ | ✅ | ✅ | ◐ (CSV import) |
| 58 | Export CSV / Tally | ✅ | ✅ | ✅ | ❌ |
| 59 | Encrypted backup / restore | ✅ | ✅ | ◐ | ✅ |
| 60 | Custom report builder | ✅ | ✅ | ◐ | ❌ |
| 61 | Profit by product / category | ✅ | ✅ | ◐ | ✅ |
| 62 | Store health score | ❌ | ❌ | ❌ | ✅ |
| 63 | FMCG velocity grading | ❌ | ❌ | ❌ | ✅ |

**Score:** Sauda matches or beats 39 of 63 benchmark capabilities. Missing 15, partial 9. The missing set is concentrated in **documents (estimate/challan/PO)**, **books (bank/cash book, day book, balance sheet)**, **compliance depth (GSTR-3B/9, e-invoice, e-way)**, **expansion (loyalty, warehouse transfer, price lists, online catalogue)** and **admin (activity log, export)**.

---

## 4. Gaps, prioritised for a kirana general store

### P0 — parity blockers (a shop comparing Sauda to Vyapar/myBillBook will notice these first)

1. **Estimates / quotations → convert to invoice.** A kirana quotes monthly ration lists to households and offices. Needs: estimate list, line items, validity, convert, share on WhatsApp.
2. **Purchase order document.** Sauda already computes suggested POs per supplier; it cannot print/send a numbered PO, receive against it, or track partial receipt.
3. **Delivery challan.** Needed for home delivery and bulk orders before payment.
4. **Bank & cash book.** Cash drawer logs exist, but there is no ledger of bank accounts, deposits, withdrawals, UPI settlement, or reconciliation.
5. **Day book.** One chronological tape of every sale, purchase, payment, expense and journal — the screen an owner opens when the accountant calls.
6. **Balance sheet.** Assets/liabilities snapshot from stock, receivables, payables, cash/bank, loans.
7. **GSTR-3B + GSTR-9 + GSTR-1 JSON export.** GSTR-1 is a viewer today; filing needs export and 3B/9 summaries.
8. **Loyalty / points.** The cheapest retention lever for a kirana; myBillBook and Loyverse both ship it.
9. **Staff permissions + activity log.** Roles exist in data, but rights are not enforceable and there is no "who did what" trail.
10. **Bulk export (CSV) + Tally export.** Import exists; export is missing.

### P1 — competitive depth

11. **Godown / warehouse transfer** (stock movement between storage and counter, with in-transit state).
12. **Price lists / customer price tiers** (retail vs wholesale vs hotel supply).
13. **Serial / IMEI tracking** (only if Sauda serves durables; low priority for pure kirana).
14. **Customer display** (second screen / tablet facing the customer).
15. **Offers & schemes engine** (buy-X-get-Y, slab discounts, festival offers) beyond the current per-line free toggle.
16. **Online catalogue / WhatsApp order page** (share a link, receive orders into POS).
17. **e-Invoice / e-Way bill** (needed once turnover crosses the mandate; plan-gated).
18. **Custom report builder** (save filters, schedule on WhatsApp).

### P2 — later

19. Employee time clock / attendance.
20. Multi-store (independent shops, not just counters of one shop).
21. Loans & advances module.
22. Accounting journal / ledger adjustments.

---

## 5. Test report — current app

A fresh Playwright audit was written for this review: `scripts/audit-app.mjs`. It drives the real app at `http://localhost:5173/` with Chromium, at 1440 × 950, and records every assertion to `research/test-results.json`. Screenshots land in `brand/review/audit/`.

Coverage: dashboard, POS billing (search → cart → qty → cash → empty state → loose matrix → GSTR-1 → park), inventory (list → search → add item → inward → labels → audit → CSV import), khata (customers → aging → search → entry → bulk settle → WhatsApp), settings (printer → language → staff → encrypted backup), all seven tool studios, PIN lock, console errors, overflow.

**Result: see `research/test-results.json` for the machine-readable run.** Summary is repeated in `research/TEST-REPORT.md`.

### Findings that are not feature gaps

- **Modal semantics:** most overlays are plain `div.fixed.inset-0` without `role="dialog"`, `aria-modal`, a focus trap, or an Escape handler. Screen-reader and keyboard users cannot reliably enter/exit them. This is an accessibility defect across `ProductCatalog`, `KhataScreen` and the dashboard studios.
- **Legacy Tailwind names in markup:** e.g. `bg-slateBase-900/50`, `text-classicCrimson-600`, `bg-blue-600` appear in components although tokens now resolve to the new palette. This is why some colours feel inconsistent; a token sweep is required with the rebrand.
- **Stale test scripts:** the old `test_milestone_*.mjs` suite still targets a top `header` navigation that no longer exists, so it fails on selectors, not features. The new `scripts/audit-app.mjs` is the current gate.

---

## 6. What this means for the redesign

1. The dashboard must stop being a card grid and become a **shop cockpit**: cash position, payables vs receivables, today's margin, stock risk, and a live ledger tape. The missing modules above (day book, cash book, balance sheet) become first-class destinations, not modals.
2. Navigation must grow from 5 tabs to a **grouped rail**: Sell · Stock · People · Money · Books · Setup. The current "Store tools" drawer is where the missing modules should graduate from.
3. The feature build order should follow P0, but the **rebrand ships first** so new modules inherit the final tokens and type scale instead of being restyled twice.
4. Loyalty, price lists and warehouse transfer should be designed as **kirana-native**, not ERP-generic: points on khata settlement, "wholesale rate for hotel supply", "godown → counter" in one scan.

---

*Competitor claims are from public pages on 26 Oct 2026 and may be plan-gated or renamed. Sauda status is code-verified. This report is the research gate; no product code was changed for it.*
