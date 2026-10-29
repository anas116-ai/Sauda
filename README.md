<div align="center">

<img src="public/brand/sauda_official_lockup_dark.svg" alt="Sauda Brand Lockup" width="540" />

### Next-Gen Offline-First Kirana & Retail Management ERP
**భారతీయ కిరాణా, జనరల్ స్టోర్స్ మరియు రిటైల్ వ్యాపారాల కోసం రూపొందించబడిన అత్యాధునిక POS & ఇన్వెంటరీ వ్యవస్థ**

[![MIT License](https://img.shields.io/badge/License-MIT-emerald.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-v7_IndexedDB-brightgreen)](https://dexie.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Verified-orange?logo=playwright)](https://playwright.dev/)

---

<img src="docs/screenshots/01_hero_gateway.png" alt="Sauda Luxury Welcome Gateway & Store Setup" width="100%" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />

</div>

---

## 🌟 Overview (పరిచయం)

**Sauda (సౌదా / सौदा)** is a production-grade, offline-first Point of Sale (POS), Khata ledger, and inventory ERP tailored specifically for Indian Kirana stores, FMCG retailers, supermarkets, and provision stores.

- **100% Offline-First:** Operates seamlessly with zero internet dependency using Dexie.js (IndexedDB v7).
- **Bilingual Interface:** Instant real-time language toggle between English, Telugu (తెలుగు), and Hindi (हिंदी).
- **Hardware Agnostic:** Plug-and-play support for Barcode Scanners, Thermal Receipt Printers (58mm/80mm), Solenoid Cash Drawers, and Digital Weighing Scales (RS-232 / Web Serial).

---

## 📸 Visual Showcase & Screen Walkthrough

### 1. 🛒 Next-Gen Fast POS Billing Terminal
*Rapid item search, hardware wedge barcode scanner, weighing scale live HUD, and instant payment settlement.*

<div align="center">
  <img src="docs/screenshots/03_pos_terminal.png" alt="POS Terminal Interface" width="100%" style="border-radius: 8px;" />
</div>

---

### 2. 📊 Store Analytics & Real-Time KPI Dashboard
*Daily turnover, gross margins, low stock alerts, top-selling inventory, and cash/UPI collection ratios.*

<div align="center">
  <img src="docs/screenshots/02_store_dashboard.png" alt="Store Dashboard" width="100%" style="border-radius: 8px;" />
</div>

---

### 3. 📖 Bilingual Double-Entry Khata & Customer Aging
*Customer credit limits, supplier outstanding balances, 30/60/90+ day aging analysis, and 1-click WhatsApp payment reminders.*

<div align="center">
  <img src="docs/screenshots/05_khata_ledger.png" alt="Khata Ledger Screen" width="100%" style="border-radius: 8px;" />
</div>

---

### 4. 📦 Product Catalog, Barcode Printing & Physical Audit
*Batch management, MRP vs Selling Price tracking, barcode sticker generator, and expiry date radar.*

<div align="center">
  <img src="docs/screenshots/04_product_catalog.png" alt="Product Catalog & Inventory" width="100%" style="border-radius: 8px;" />
</div>

---

### 5. 📑 Financial Balance Sheet, Day Book & Statutory GST Studio
*Real-time Assets vs Liabilities calculation, Daybook cash-flow audits, B2B tax invoicing, and GSTR-1 compliant filing exports.*

<div align="center">
  <img src="docs/screenshots/06_balance_sheet.png" alt="Financial Balance Sheet" width="100%" style="border-radius: 8px;" />
</div>

---

## 🔌 Hardware Integration Suite

| Hardware Device | Communication Protocol | Key Features |
| :--- | :--- | :--- |
| **Barcode Scanner** | Zero-latency Keyboard Wedge | Automatic UPC/EAN-13 detection with 1250Hz audio chime confirmation |
| **Thermal Printer** | ESC/POS (USB / Bluetooth) | Dual 80mm & 58mm bill layouts with dynamic UPI QR code generation |
| **Cash Drawer** | RJ11 Solenoid Kick Pulse | Automated drawer kick upon cash payment & PIN-protected audit log |
| **Weighing Scale** | RS-232 (Web Serial API) | Real-time continuous weight stream parser (Phoenix, Essae, Eagle) with stable tone |

---

## 🏗️ Technology Stack

* **Frontend Framework:** React 19, TypeScript, Vite
* **Styling & Design System:** Tailwind CSS with custom Kirana luxury tokens
* **Local Persistence:** Dexie.js (IndexedDB v7) with high-performance compound indexing
* **Testing & Verification:** Playwright E2E automation test suite
* **Icons & Animation:** Lucide Icons, Motion (Framer Motion v12)

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v20.0 or higher
* **npm**: v10.0 or higher

### Installation & Launch

```bash
# 1. Clone repository
git clone https://github.com/anas116-ai/Sauda.git
cd Sauda

# 2. Install dependencies
npm install

# 3. Launch development server
npm run dev
```

Visit `http://localhost:5173` in your browser to experience Sauda.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for full details.

Developed with ❤️ for Indian Retailers & Kirana Entrepreneurs.
