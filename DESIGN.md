# LEKVYA (లేక్వ్యా) — PRODUCT DESIGN & ARCHITECTURE MANUAL
**Kirana & General Store Management System**
*Offline-First Architecture for Android and Windows Desktop*

---

## 1. Project Overview & Identity
- **Name**: Lekvya (లేక్వ్యా / लेక్వ్యా)
- **Primary Markets**: Indian Retail (Kirana, General Stores, Provision Stores)
- **Target Form Factors**: Android Phones/Tablets & Windows 10/11 Desktops
- **Core Principle**: True Offline-First with Encrypted Local SQLite (Drift + SQLCipher), Double-Entry Stock & Financial Ledgers, and Bilingual (Telugu + English) support.

## 2. Design System Guidelines
- **Palette**: "Prosperity & Growth"
  - Background: Warm Sand (`#F4F1EA`)
  - Primary / Surface: Deep Forest Green (`#064E3B`)
  - Accent / Actions: Amber / Saffron Gold (`#F59E0B`)
  - Positive / Jama: Emerald Green (`#059669`)
  - Negative / Udhar: Crimson Red (`#DC2626`)
  - Typography: `Inter` (Numbers/English) + `Noto Sans Telugu` (Telugu)
- **UI Quality**: High contrast (WCAG AAA 7:1) for bright sunlight shop counters. Zero generic AI gradients or pill buttons.

## 3. Technology Stack (Verified)
- **Frontend / Client**: Flutter 3.24+ (Android & Windows Desktop)
- **State Architecture**: Flutter Riverpod 2.6+ / 3.x
- **Local Storage**: Drift ORM + `sqlite3mc` (SQLite3MultipleCiphers AES-256)
- **Key Store**: `flutter_secure_storage` (Android KeyStore + Windows Credential Manager)
- **Barcodes**: `mobile_scanner` (Android Camera) + USB Keyboard Wedge Listener (Windows)
- **Printers**: ESC/POS thermal printing via Bluetooth & USB (Image rasterization for Telugu support)
- **Voice Recognition**: Offline Telugu/English models (`vosk_flutter_service` / Whisper.cpp)

## 4. Current Status: Phase 0 Approval Pending
Refer to the Phase 0 Master Specification for complete ERD, threat models, and acceptance tests.
Coding starts strictly after Phase 0 sign-off.
