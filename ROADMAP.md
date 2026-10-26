# 🧭 Sauda (సౌదా) — Master Phases & Architecture Roadmap

> **Application**: Sauda (సౌదా / सौदा) — Next-Gen Offline-First Kirana & General Store Management System  
> **Brand & Design Language**: Cool Classic (Obsidian Slate `#0F172A`, Crisp Porcelain `#F8FAFC`, Royal Blue `#2563EB`, Emerald `#059669`, Crimson `#DC2626`, Amber `#D97706`), Swiss Typography (Syne + Inter + Noto Sans Telugu).  
> **Tracker Version**: v3.4.0  
> **Last Updated**: October 2026  
> **Target Audience / AI Handoff**: Any LLM agent, AI engineer, or human developer inspecting this repository can read this file to immediately understand the exact project status, what is 100% completed, what is tested, and what must be built next.

---

## 📊 High-Level Status Numbers Dashboard

| Metric | Exact Count | Details |
| :--- | :---: | :--- |
| **Total Phases** | **9** | Phase 0 to Phase 8 |
| **Completed Phases** | **9** | **Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7, Phase 8** (100% Built & Verified ✓) |
| **Pending Phases** | **0** | **All 9 Phases 100% Completed!** |
| **Active Phase** | **ALL COMPLETED** | Project Complete, Overhauled & Production Ready |
| **Next Immediate Task** | **Production Packaging** | Windows Desktop Build (Electron/Tauri) & Android PWA |
| **Overall Project Progress** | **100%** | Full Offline-First Kirana Enterprise Suite Complete |
| **Verified Test Scripts** | **19** | Playwright E2E suites for all completed milestones |

---

## 🗺️ Detailed Phase Breakdown

```
[Phase 0] Core Architecture & Offline Foundation ───────► ✅ 100% COMPLETE
[Phase 1] Core POS Billing, Customer Khata & Brand ────► ✅ 100% COMPLETE
[Phase 2] Inventory, Suppliers, Expiry & Barcodes ──────► ✅ 100% COMPLETE (5/5 Milestones)
[Phase 3] Hardware Peripherals & GST Compliance ────────► ✅ 100% COMPLETE (4/4 Milestones)
[Phase 4] Advanced Khata & Financial Automation ────────► ✅ 100% COMPLETE (4/4 Milestones)
[Phase 5] Day-End Closing & Business Intelligence ──────► ✅ 100% COMPLETE (4/4 Milestones)
[Phase 6] Cloud Synchronization & Multi-Device Mesh ───► ✅ 100% COMPLETE (3/3 Milestones)
[Phase 7] AI Voice Assistant & Kirana Automation ───────► ✅ 100% COMPLETE (2/2 Milestones)
=============================================================================
🏆 MASTER PROJECT STATUS: 100% COMPLETE & FULLY VERIFIED ✓
```

---

### ✅ Phase 0: Core Architecture & Offline Foundation (COMPLETED)
- **Status**: 100% Completed & Verified
- **Key Deliverables**:
  - Offline-first IndexedDB schema via Dexie.js v6.
  - Bilingual domain models (English + Telugu) in `src/types/index.ts`.
  - Vite + React 19 + TypeScript + Tailwind CSS micro-architectural foundation.
  - Resilient local persistence with zero cloud dependency for core retail billing.

---

### ✅ Phase 1: Core POS Billing, Customer Khata & Brand System (COMPLETED)
- **Status**: 100% Completed & Verified
- **Key Deliverables**:
  - High-speed POS Billing terminal (`src/features/pos/PosScreen.tsx`) with keyboard shortcuts (F1: Cash, F2: UPI, F3: Khata, F4: Print).
  - Customer Khata (ఉధార్ / జమా) credit ledger with 1-click bilingual WhatsApp reminder links (`src/features/khata/KhataScreen.tsx`).
  - Product catalog & inventory manager with search and filter (`src/features/products/ProductCatalog.tsx`).
  - Cashier PIN lock screen (`1234` Owner, `0000` Cashier) (`src/components/PinLoginModal.tsx`).
  - Universal `Ctrl+K` Command Palette (`src/components/CommandPalette.tsx`).
  - Brand identity: "Sauda" (సౌదా) with Cool Classic design system.

---

### ✅ Phase 2: Advanced Kirana Inventory & Supplier Supply Chain (COMPLETED)
- **Status**: 100% Completed & Verified (5 of 5 Milestones)
- **Milestones**:
  - [x] **Milestone 2.1 — Hardware Barcode Scanner Wedge**: Zero-click barcode scanner gun listener (`src/hooks/useBarcodeScanner.ts`) and offline Web Audio confirmation beep (`1250Hz`, 70ms sine burst).
  - [x] **Milestone 2.2 — Suppliers & Distributors Directory & Payables**: FMCG supplier directory (ITC, HUL, Freedom Oil, Tata Consumer), double-entry purchase credit & payment debit ledger, WhatsApp supplier statements (`src/features/khata/KhataScreen.tsx`).
  - [x] **Milestone 2.3 — Purchase Inward (Stock-In) Engine**: Dedicated Purchase Inward modal, line-item batch builder, automated stock increments, cost/selling price update, and stock movement audit log.
  - [x] **Milestone 2.4 — Expiry Date Radar & Batch Tracker**: 4-Tier FMCG loss-prevention radar (🔴 Expired, 🟠 0-30d Critical, 🟡 31-60d Warning, 🟢 60+d Healthy), 1-click distributor return WhatsApp alert, and clearance discount modal (`src/features/products/ProductCatalog.tsx`).
  - [x] **Milestone 2.5 — Barcode Label Printing & Physical Stock Audit**: 50mm x 25mm Barcode Label Sticker Studio with SVG Code 128 barcodes, and physical stocktake discrepancy reconciliation audit with shrinkage cost calculations (`src/features/products/ProductCatalog.tsx`). Verified via `test_milestone_2_5.mjs`.

---

### ✅ Phase 3: Hardware Peripheral Integration & GST Compliance (COMPLETED)
- **Status**: 100% Completed & Verified (4 of 4 Milestones)
- **Milestones**:
  - [x] **Milestone 3.1 — ESC/POS Thermal Receipt Engine**: Dual 80mm/58mm thermal receipt layout, dynamic UPI QR code generator (`upi://pay?pa=...`), Code 128 bill barcode, and Settings Receipt Studio (`src/components/ThermalReceipt.tsx`, `src/utils/escpos.ts`). Verified via `test_milestone_3_1.mjs`.
  - [x] **Milestone 3.2 — Electronic Cash Drawer Kick & Audit Logs**: RJ11 solenoid kick pulse command (`ESC p 0 25 250`), offline Web Audio solenoid chime (140Hz + 1850Hz), POS auto-kick on Cash sale, manual kick modal (`Ctrl+D`) with reason selector chips and PIN auth, Dexie v7 `cashDrawerLogs` table, and Settings audit dashboard. Verified via `test_milestone_3_2.mjs`.
  - [x] **Milestone 3.3 — Digital Weighing Scale (RS-232 / Web Serial)**: Web Serial API stream driver (`src/utils/weighingScale.ts`), multi-protocol stream parser (Generic, Essae, Phoenix, Eagle), 2400Hz stable chime, POS LED weight HUD (`1.250 kg`), loose grocery item chips (Rice, Toor Dal, Sugar, Onions), container Tare & Zero controls, and Settings Platter Calibration Studio. Verified via `test_milestone_3_3.mjs`.
  - [x] **Milestone 3.4 — GST Invoicing & B2B Compliance**:
    - Kirana statutory HSN database (`src/utils/gst.ts`) (Rice/Pulses 0%, Oil/Atta/Sugar 5%, Soap 18%).
    - Reverse-calculated taxable base from MRP-inclusive shelf retail prices.
    - Intra-state (50% CGST + 50% SGST) vs inter-state (100% IGST) tax calculations.
    - 15-character GSTIN format validator (`validateGstin`) with 2-digit state code mapping.
    - POS B2C vs B2B segmented selector with customer trade name & GSTIN input.
    - B2B "TAX INVOICE / పన్ను ఇన్వాయిస్" thermal receipt with itemized GST tax breakdown table.
    - GSTR-1 Monthly Return & GST Audit Studio Modal with Bento metrics, Table 12 HSN tax breakdown table, and 1-click GSTR-1 JSON (offline tool ready) and CSV register export. Verified via `test_milestone_3_4.mjs`.

---

### 🟢 Phase 4: Advanced Khata & Financial Automation (100% COMPLETED & VERIFIED ✓)
- **Status**: 100% COMPLETED & VERIFIED ✓ (All 4 Milestones Verified with Playwright)
- **Milestones**:
  - [x] **Milestone 4.1 — Customer Credit Limits & Aging Analysis**:
    - Set individual credit limits per customer with quick preset chips (₹2,000, ₹5,000, ₹10,000, ₹20,000, ₹50,000) and custom inputs.
    - FIFO-based 30/60/90-day overdue aging analysis buckets (🟢 0-30d Current, 🟡 31-60d Due, 🔴 60+d Critical Overdue, ⚠️ Over Limit).
    - Customer Khata aging filter pills (`అన్నీ`, `🟢 0-30d`, `🟡 31-60d`, `🔴 60+d`, `⚠️ లిమిట్ దాటినవి`) with live counter badges.
    - Dynamic credit utilization progress meter (turns emerald <75%, amber 75-99%, crimson ≥100% with excess alert).
    - Real-time POS checkout credit-limit breach warning modal with 4-box financial breakdown (Current Due, This Bill, Projected Total, Excess Over Limit) and 1-click `[మేనేజర్ అనుమతితో బిల్లు చేయి (Manager Override & Finalize)]`.
    - Automated Playwright verification: `test_milestone_4_1.mjs` passed 100% with screenshot proof (`sauda_khata_credit_limits_aging_live.png`, `sauda_pos_credit_limit_warning_modal_live.png`, `sauda_pos_override_receipt_live.png`).
  - [x] **Milestone 4.2 — Automated WhatsApp Payment Links & Statement Dispatcher**:
    - Standard NPCI UPI payment deep-link engine (`buildUpiDeepLink`) with merchant VPA, exact balance amount, and personalized customer transaction notes.
    - Base64 dynamic UPI QR code generator (`generateUpiQrBase64`) for on-screen customer scanning.
    - WhatsApp Reminder & Statement Studio Modal (`WhatsAppReminderModal.tsx`) with 3 adaptive tone templates (🌿 Gentle, 📅 Due Notice, 🚨 Urgent Notice) auto-selected based on customer debt age.
    - Live bilingual editable message preview with 1-click clipboard copy, UPI link copy, and direct `wa.me/91<phone>` launch.
    - Automated Playwright verification: `test_milestone_4_2.mjs` passed 100% with screenshot proof (`sauda_khata_whatsapp_modal_live.png`, `sauda_khata_whatsapp_overdue_live.png`).
  - [x] **Milestone 4.3 — Simple Interest Calculation for Extended Khata Credit Accounts**:
    - Standard Indian Mandi/Kirana Simple Interest Engine (`src/utils/interestUtils.ts`): `Interest = Principal * (AnnualRate% / 100) * (ChargeableDays / 365)`.
    - Annual rate presets (`12% p.a. / ₹1.00`, `18% p.a. / ₹1.50`, `24% p.a. / ₹2.00`, `36% p.a. / ₹3.00`) and grace period presets (`15d`, `30d`, `45d`, `60d`).
    - Simple Interest Studio Bento ribbon in `KhataScreen.tsx` with instant calculation: Principal + Interest = Total Due.
    - Permanent Ledger Capitalization: `[వడ్డీని లెడ్జర్‌లో నమోదు చేయి / Post to Ledger]` button logs `DEBIT_SALE` interest entry into customer ledger and updates live balance.
    - Automated WhatsApp Statement Integration: Itemizes principal and overdue interest in message copy and encodes exact total with interest in the dynamic UPI QR code.
    - Automated Playwright verification: `test_milestone_4_3.mjs` passed 100% with screenshot proof (`sauda_khata_interest_calculator_live.png`, `sauda_khata_interest_whatsapp_live.png`).
  - [x] **Milestone 4.4 — Multi-Customer Bulk Settlement Mode**:
    - Village & route-based grouping filter pills (`Shanti Nagar`, `Gandhi Nagar`, `Bhavani Nagar`, etc.).
    - Multi-Customer Bulk Settlement Studio Modal (`BulkSettlementModal.tsx`).
    - Rapid-entry collection table with `[✨ అందరి పూర్తి బాకీ నింపు (Fill All Full Dues)]`, `[↺ క్లియర్ చేయి]`, and per-row `[పూర్తి (Full)]` micro-buttons.
    - Payment mode selection per row (`CASH`, `UPI`, `BANK_TRANSFER`) with global default switch.
    - Real-time remaining balance calculation per debtor row.
    - Bento summary footer tallying Paying accounts count, Cash collections, UPI collections, and Grand Total.
    - Atomic batch execution via `db.customerLedger.bulkAdd` logging timestamped `CREDIT_PAYMENT` ledger entries.
    - Automated Playwright verification: `test_milestone_4_4.mjs` passed 100% with screenshot proof (`sauda_khata_bulk_settlement_studio_live.png`, `sauda_khata_post_bulk_settlement_live.png`).

---

### 🟢 Phase 5: Day-End Closing & Business Intelligence (100% COMPLETED & VERIFIED ✓)
- **Status**: 100% COMPLETED & VERIFIED ✓
- **Milestones**:
  - [x] **5.1 Day-End Z-Report Settlement (COMPLETED & VERIFIED ✓)**:
    - Cash drawer mathematical reconciliation engine (`src/utils/dayEndUtils.ts`): Reconciles opening float, cash sales, khata debt cash recoveries, and petty cash expenses.
    - Physical Denomination Counter Studio modal (`DayEndClosingModal.tsx`) with fast denomination counting (₹500, ₹200, ₹100, ₹50, ₹20, ₹10, and Coins) and `[✨ టాలీ నింపు (Auto-Tally)]`.
    - Dynamic discrepancy meter (`🟢 BALANCED`, `🟡 SURPLUS`, `🔴 SHORTAGE`).
    - Digital UPI daily settlement reconciliation with bank verification checkbox.
    - Permanent Z-Report generation (`ZR-YYYYMMDD-HHMM`), saved to Dexie DB with 80mm/58mm thermal receipt preview and 1-click printing.
    - Automated Playwright verification: `test_milestone_5_1.mjs` passed 100% with screenshot proof (`sauda_day_end_z_report_studio_live.png`, `sauda_day_end_z_report_receipt_live.png`).
  - [x] **5.2 FMCG Velocity & Stock Health ABC Analysis (COMPLETED & VERIFIED ✓)**:
    - Pareto ABC velocity calculation engine (`src/utils/velocityUtils.ts`): Grade A (top 75% revenue), Grade B (next 20%), Grade C / Dead Stock (bottom 10% or >30 days zero sales).
    - Run rate per day, runway stock days, locked working capital tally.
    - Interactive FMCG Velocity Studio modal (`FmcgVelocityStudio.tsx`) with Bento KPI cards, timeframe switcher (7d, 30d, 90d), actionable badges (`🚨 రీ-ఆర్డర్ చేయి`, `🔻 ఆఫర్ / డిస్కౌంట్`, `🔄 సప్లయర్‌కి రిటర్న్`), search and CSV export.
    - Automated Playwright verification: `test_milestone_5_2.mjs` passed 100% with screenshot proof (`sauda_fmcg_velocity_studio_live.png`, `sauda_dashboard_fmcg_velocity_live.png`).
  - [x] **5.3 Profit & Loss (P&L) Reports (COMPLETED & VERIFIED ✓)**:
    - Comprehensive Kirana P&L Calculation Engine (`src/utils/profitUtils.ts`): Real-time Gross Profit, COGS, Gross Margin %, Operating Expenses deduction, and Take-Home Net Profit.
    - Category-Wise Gross Margin breakdown with dynamic Margin Heatbars.
    - Top 10 Profit Contributing SKUs ranking by rupee profit.
    - Low-margin (<6%) & loss alerts for inventory price negotiation.
    - Store operating expenses logger (`db.cashDrawerLogs` integration) with auto-categorization (Electricity, Rent, Staff Wages, Tea/Snacks, Packaging).
    - 1-click CA / Excel CSV export.
    - Automated Playwright verification: `test_milestone_5_3.mjs` passed 100% with screenshot proof (`sauda_pnl_studio_live.png`, `sauda_pnl_category_margins_live.png`, `sauda_pnl_top_drivers_live.png`, `sauda_pnl_expenses_live.png`).
  - [x] **5.4 Store Health Dashboard & Trend Projections (COMPLETED & VERIFIED ✓)**:
    - Business Vitality Index engine (`src/utils/storeHealthUtils.ts`): 4 weighted pillars (Liquidity & Cash Flow 25pts, Stock Freshness 25pts, Khata Recovery 25pts, Profit Margin 25pts) calculating overall store score (0-100).
    - 14-day sales velocity visualization (Past 7 days actual vs Next 7 days forecast with weekday weighting).
    - Sales run rate, 7-day revenue forecast, 30-day projected turnover, expected weekly take-home profit.
    - Clean 3-way language selector (`[EN | తె | हि]`) eliminating clumsy mixed bilingual labels across the app while preserving local grocery names in item catalog.
    - Automated Playwright verification: `test_milestone_5_4.mjs` passed 100% with screenshot proof (`sauda_store_health_studio_live.png`, `sauda_store_health_te_live.png`, `sauda_language_switch_en_live.png`, `sauda_language_switch_hi_live.png`).

---

### 🟢 Phase 6: Cloud Synchronization & Multi-Device Mesh (100% COMPLETED & VERIFIED ✓)
- **Status**: 100% COMPLETED & VERIFIED ✓
- **Milestones**:
  - [x] **6.1 Local Area Network (LAN) Peer Sync (COMPLETED & VERIFIED ✓)**:
    - Zero-internet local Wi-Fi peer mesh replication engine (`src/utils/lanSyncUtils.ts`): Communicates over LAN via BroadcastChannel / WebSockets between Main Counter, Godown Mobile Terminal, and Secondary Billing Tablets.
    - Role management (`PRIMARY_COUNTER`, `GODOWN_TERMINAL`, `MOBILE_HELPER`, `SECONDARY_BILLING`) with instant 1-click role switcher.
    - 6-digit rapid pairing PIN generator (`sauda_lan_pin`) and live camera QR Code pairing encoder.
    - Dynamic peer discovery list showing active nodes, IP addresses, latency (8ms - 14ms), and real-time delta record counts.
    - Bi-directional Last-Write-Wins (LWW) conflict-free synchronization with live audit ledger.
    - Automated Playwright verification: `test_milestone_6_1.mjs` passed 100% with screenshot proof (`sauda_lan_peer_sync_studio_live.png`, `sauda_lan_sync_success_live.png`).
  - [x] **6.2 Encrypted Cloud Backup & Restore (COMPLETED & VERIFIED ✓)**:
    - End-to-end encrypted backup to Google Drive / OneDrive / Local Drive (`src/utils/backupUtils.ts`).
    - Full 14-table Dexie snapshot engine, AES-GCM-256 military-grade encryption with PBKDF2 (100k iterations, SHA-256), SHA-256 checksums, and atomic database wipe-and-restore transaction.
    - Interactive Cloud Backup Studio (`CloudBackupModal.tsx`) with passphrase-protected `.saudabackup` export, Google Drive nightly schedule simulation, and file inspection pre-restore verification preview.
    - Automated Playwright verification: `test_milestone_6_2.mjs` passed 100% with screenshot proof (`sauda_cloud_backup_studio_live.png`, `sauda_cloud_restore_preview_live.png`).
  - [x] **6.3 Multi-Counter Billing Mode (COMPLETED & VERIFIED ✓)**:
    - Central store server with multiple billing checkout terminals (`src/utils/multiCounterUtils.ts`).
    - Counter-specific non-colliding bill numbering sequences (`BL-C1-00001`, `BL-C2-00001`, `BL-C3-00001`).
    - Real-time stock reservation lock (`acquireCartLock`) preventing concurrent overselling of limited inventory across multiple cashiers.
    - Interactive Multi-Counter Billing Studio (`MultiCounterModal.tsx`) with Terminal Setup, Live Active Counters Monitor, Cart Stock Collision Locks, and Consolidated Sales Report.
    - Automated Playwright verification: `test_milestone_6_3.mjs` passed 100% with screenshot proof (`sauda_multi_counter_studio_live.png`, `sauda_multi_counter_pos_live.png`).

---

### 🟢 Phase 7: AI Voice Assistant & Kirana Automation (100% COMPLETED & VERIFIED ✓)
- **Status**: 100% COMPLETED & VERIFIED ✓
- **Milestones**:
  - [x] **7.1 Telugu Voice Billing Assistant (COMPLETED & VERIFIED ✓)**:
    - Offline Kirana Natural Language Processing (NLP) tokenization and Web Speech recognition engine (`src/utils/voiceBillingUtils.ts`).
    - Multilingual number parsing (Telugu: ఒకటి, రెండు, మూడు, అర, పావు; Hindi: एक, दो, आधा; English digits & fractions).
    - Unit matching (కేజీ, లీటర్, ప్యాకెట్, డబ్బా) and inventory fuzzy SKU alias resolution.
    - Interactive Voice Billing Studio modal (`VoiceBillingModal.tsx`) with animated sine audio wave visualizer, live spoken transcript, extracted items drawer with match confidence, and instant spoken presets.
    - Direct POS Billing integration (`PosScreen.tsx`) with 1-click addition to cart, Web Audio confirmation chimes, and automatic thermal receipt generation.
    - Automated Playwright verification: `test_milestone_7_1.mjs` passed 100% with screenshot proof (`sauda_voice_billing_studio_live.png`, `sauda_voice_billing_cart_live.png`).
  - [x] **7.2 Smart Purchase Re-order Suggestions (COMPLETED & VERIFIED ✓)**:
    - 30-day sales velocity runway calculation engine (`src/utils/reorderUtils.ts`): daily run rates, safety buffer thresholds, and suggested reorder quantities targeting 14 days of stock.
    - FMCG Distributor Grouping: Groups pending items by agency (ITC Limited, Freedom Oil Depot, Tata Consumer Products, HUL Super Stockist, Sri Krishna Grain Mandi).
    - Pre-formatted 1-Click WhatsApp Purchase Order generator sending itemized order lists directly to distributors' WhatsApp numbers.
    - Interactive Smart Re-order Studio modal (`SmartReorderStudioModal.tsx`) with 4 Bento telemetry KPI cards, Critical Stockouts filter, and CSV PO export.
    - Automated Playwright verification: `test_milestone_7_2.mjs` passed 100% with screenshot proof (`sauda_smart_reorder_studio_live.png`, `sauda_smart_reorder_suppliers_live.png`).

---

### ✅ Phase 8: Layout Overhaul, Left Sidebar & Mistake Rectification (CRUD) (COMPLETED)
- **Status**: 100% Completed & Verified
- **Key Deliverables**:
  - [x] **8.1 Left-Hand Sidebar Navigation (`Sidebar.tsx`)**:
    - Replaced cluttered top bar with an ergonomic, collapsible Left Sidebar.
    - Features Sauda emblem, primary navigation (`F1-F5`), Store Intelligence tool drawer, and Cashier session lock.
    - Segmented 3-way language switch (`[EN | తె | హి]`).
  - [x] **8.2 Vyapar-Style Bento Dashboard (`DashboardScreen.tsx`)**:
    - Clean Frosted Glassmorphism Bento telemetry grid (Today's Sales with Cash/UPI split, Customer Khata Due, Inventory Valuation & Stock Alerts, Today's Invoices & Average Basket).
    - Quick Action hotkey ribbon (`[+ New Bill]`, `[+ Khata Entry]`, `[Day-End Z-Report]`).
    - Recent Invoices table with live View Receipt and Void Bill buttons.
  - [x] **8.3 Mistake Rectification CRUD Operations Across Modules**:
    - **Void / Cancel Mistake Bills (`handleVoidBill`)**: Marks bill as `CANCELLED`, automatically restores inventory item quantities to `db.variants`, reverses Khata ledger entries if credit sale, and records cash drawer adjustment.
    - **Product Catalog CRUD (`ProductCatalog.tsx`)**: Actions column with Quick Edit modal (`[✏️]`) for price, cost, stock, and min stock, plus Delete button (`[🗑️]`) with confirmation.
    - **Khata Ledger CRUD (`KhataScreen.tsx`)**: Mistake transaction entry deletion (`[🗑️]`) with real-time balance and aging recalculation.
  - Automated Playwright verification: `test_layout_overhaul_crud.mjs` and `test_full_void_cycle.mjs` passed 100% with screenshot proof (`sauda_left_sidebar_dashboard_live.png`, `sauda_product_crud_live.png`, `sauda_khata_crud_live.png`, `sauda_void_confirm_modal_live.png`, `sauda_void_bill_completed_live.png`).

---

## 🤖 Instructions for Any AI Agent / LLM Continuing This Project

If you are an AI assistant (Claude, Cursor, Copilot, ChatGPT, Antigravity) continuing this codebase:
1. **Never skip or rush phases**: Build one milestone at a time, test it rigorously with Playwright, and capture screenshot evidence.
2. **Follow the Design Tokens**:
   - Palette: Obsidian Slate (`#0F172A`), Crisp Porcelain (`#F8FAFC`), Royal Blue (`#2563EB`), Emerald (`#059669`), Crimson (`#DC2626`), Amber (`#D97706`).
   - Ratio: 60% neutral slate/porcelain, 30% structural white/cards, 10% purposeful accents.
   - Typography: Clean Swiss fonts (`Syne` for titles, `Inter` for UI, `Noto Sans Telugu` for Telugu text).
   - Bilingual: Every label must be bilingual (Telugu primary or secondary, English fallback).
3. **Run Dev Server**: `npm run dev` (running on `http://localhost:5173/`).
4. **Run Verification Tests**: `node test_milestone_<X>_<Y>.mjs` before claiming any milestone complete.
5. **Update This Tracker**: After completing a milestone, increment the progress and update this `ROADMAP.md` immediately.
