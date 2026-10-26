# 🛒 Sauda (సౌదా) — Next-Gen Offline-First Kirana & General Store Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-v7_IndexedDB-brightgreen)](https://dexie.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Verified-orange?logo=playwright)](https://playwright.dev/)

**Sauda (సౌదా / सौदा)** is a production-grade, offline-first Point of Sale (POS) and inventory ERP engineered specifically for Indian Kirana stores, FMCG retailers, and general provision shops.

---

## 📊 Current Status Summary (For AI Agents & Developers)

| Metric | Current Count | Status |
| :--- | :---: | :--- |
| **Total Phases** | **8 (Phase 0 – 7)** | Defined in [`ROADMAP.md`](./ROADMAP.md) |
| **Completed Phases** | **4 (Phases 0, 1, 2, 3)** | **100% Tested & Verified ✓** |
| **Pending Phases** | **4 (Phases 4, 5, 6, 7)** | Phase 4 Active Now |
| **Active Next Task** | **Milestone 4.1** | Customer Credit Limits & Aging Analysis |
| **Total Completed Milestones** | **11** | Fully functional and in production code |

> 📖 **Full Implementation Roadmap**: See [`ROADMAP.md`](./ROADMAP.md) for detailed deliverables of each phase, milestone breakdowns, and verification procedures.

---

## 🏗️ Architecture & Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite, Tailwind CSS.
- **Database & Offline Persistence**: Dexie.js (IndexedDB v7) with resilient local persistence, compound indexes, and zero cloud requirement for core billing.
- **Design System**: "Cool Classic" — Slate (`#0F172A`), Porcelain (`#F8FAFC`), Royal Blue (`#2563EB`), Emerald (`#059669`), Crimson (`#DC2626`), Amber (`#D97706`).
- **Typography**: Syne (Display/Numbers), Inter (UI), Noto Sans Telugu (Regional script).
- **Hardware Integration**:
  - **Barcode Scanner**: Zero-click hardware wedge hook (`src/hooks/useBarcodeScanner.ts`) with Web Audio 1250Hz confirmation chime.
  - **Thermal Receipt Printer**: Dual 80mm & 58mm ESC/POS layout (`src/components/ThermalReceipt.tsx`) with dynamic UPI QR and Code 128 barcodes.
  - **Cash Drawer**: RJ11 solenoid kick pulse (`ESC p 0 25 250`), Web Audio solenoid chime, PIN-authorized manual modal (`Ctrl+D`), and Dexie audit log.
  - **Weighing Scale**: Web Serial API (`src/utils/weighingScale.ts`) with continuous RS-232 multi-protocol stream parser (Generic, Essae, Phoenix, Eagle), stable tone, and live LED HUD (`src/features/pos/PosScreen.tsx`).
  - **GST Compliance Engine**: Kirana statutory HSN database, reverse-calculation of taxable base, CGST/SGST/IGST, 15-character GSTIN validator, B2B tax invoice modal, and GSTR-1 Sales Return Studio with 1-click JSON and CSV export (`src/utils/gst.ts`).

---

## 📁 Repository Structure

```
c:\Project\Lekvya\
├── src\
│   ├── components\          # Reusable UI widgets (Navbar, ThermalReceipt, CommandPalette, BarcodeSvg)
│   ├── context\             # App state provider (AppContext.tsx)
│   ├── db\                  # Dexie.js v7 schema and sample database seeder (db.ts)
│   ├── features\
│   │   ├── dashboard\       # Store metrics, KPI cards, low stock alerts (DashboardScreen.tsx)
│   │   ├── pos\             # Fast POS billing, weighing scale HUD, B2B tax modal (PosScreen.tsx)
│   │   ├── products\        # Catalog, barcode stickers, expiry radar, physical audit (ProductCatalog.tsx)
│   │   ├── khata\           # Customer & Supplier double-entry ledger (KhataScreen.tsx)
│   │   └── settings\        # Printer, Cash drawer, Scale calibration, Backup/Restore (SettingsScreen.tsx)
│   ├── hooks\               # Custom hooks (useBarcodeScanner.ts)
│   ├── types\               # Complete bilingual domain models (index.ts)
│   └── utils\               # ESC/POS generator, RS-232 parser, GST calculation engine
├── test_milestone_2_5.mjs   # Playwright E2E: Barcode Stickers & Physical Audit
├── test_milestone_3_1.mjs   # Playwright E2E: Thermal Receipt Printer & Dynamic UPI QR
├── test_milestone_3_2.mjs   # Playwright E2E: Electronic Cash Drawer Kick & Audit Logs
├── test_milestone_3_3.mjs   # Playwright E2E: Digital Weighing Scale & RS-232 Stream
├── test_milestone_3_4.mjs   # Playwright E2E: GST Invoicing, B2B Tax Receipts & GSTR-1 Studio
├── ROADMAP.md               # Master phase & milestone tracker
└── package.json             # NPM scripts and dependencies
```

---

## 🚀 Development & Testing Commands

```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server (runs on http://localhost:5173/)
npm run dev

# 3. Compile and build TypeScript for production
npm run build

# 4. Run Playwright verification tests
node test_milestone_3_4.mjs
```

---

## 🤖 Instructions for AI Agents Continuing Development

If an autonomous coding agent (Claude, Cursor, Copilot, ChatGPT, Antigravity) is given this codebase:
1. **Always read [`ROADMAP.md`](./ROADMAP.md) first** to identify the active phase and milestone.
2. **Current Active Task**: **Milestone 4.1: Customer Credit Limits & Aging Analysis** in `src/features/khata/KhataScreen.tsx` and `src/features/pos/PosScreen.tsx`.
3. **Strict QA Rule**: Do not declare any feature complete without writing a dedicated Playwright test (`test_milestone_<X>_<Y>.mjs`), executing it, and confirming zero errors.
4. **Design Rules**: Adhere strictly to the "Cool Classic" palette, bilingual Telugu/English labels, and tactile feedback.
