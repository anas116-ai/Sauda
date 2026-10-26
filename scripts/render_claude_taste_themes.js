import { chromium } from 'playwright';

async function generateClaudeHandcraftedThemes() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  // High-Taste Handcrafted Renderer (Anti-Slop, Zero AI Gradients, Zero Clutter)
  const renderTheme = async (title, sub, styles, filename) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif; }
  body {
    background-color: ${styles.bodyBg};
    color: ${styles.textPrimary};
    height: 100vh;
    display: flex;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* Architectural Sidebar */
  .sidebar {
    width: 250px;
    background: ${styles.sidebarBg};
    border-right: 1px solid ${styles.borderSubtle};
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .brand-row {
    display: flex; align-items: center; gap: 12px;
    padding-bottom: 20px; border-bottom: 1px solid ${styles.borderSubtle};
  }
  .brand-seal {
    width: 38px; height: 38px; border-radius: 8px;
    background: ${styles.sealBg}; color: ${styles.sealText};
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800; letter-spacing: -0.02em;
  }
  .brand-title { font-size: 16px; font-weight: 800; letter-spacing: 0.05em; color: ${styles.textPrimary}; }
  .brand-sub { font-size: 11px; font-weight: 700; color: ${styles.textMuted}; text-transform: uppercase; letter-spacing: 0.08em; }

  .nav-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-radius: 8px; margin-bottom: 4px;
    font-size: 13px; font-weight: 600; color: ${styles.textSecondary};
  }
  .nav-item.active {
    background: ${styles.navActiveBg};
    color: ${styles.navActiveText};
    font-weight: 700;
  }
  .nav-pill {
    font-size: 10px; font-family: monospace; font-weight: 700;
    padding: 2px 6px; border-radius: 4px; background: ${styles.pillBg}; color: ${styles.pillText};
  }

  /* Workspace */
  .workspace {
    flex: 1; padding: 24px; display: flex; gap: 20px;
  }
  .left-pane { flex: 7; display: flex; flex-direction: column; gap: 16px; }

  /* Precision Input - Principle 1: Hierarchy */
  .search-box {
    background: ${styles.surfaceBg};
    border: 1px solid ${styles.borderStrong};
    border-radius: 10px; padding: 14px 18px;
    display: flex; align-items: center; gap: 12px;
  }
  .search-input {
    background: transparent; border: none; outline: none;
    font-size: 15px; font-weight: 600; color: ${styles.textPrimary}; flex: 1;
  }
  .search-shortcut {
    font-size: 11px; font-weight: 700; font-family: monospace;
    padding: 3px 8px; border-radius: 5px; background: ${styles.pillBg}; color: ${styles.textMuted};
    border: 1px solid ${styles.borderSubtle};
  }

  /* Hardware Weighing Bar - Principle 6: Proximity */
  .scale-bar {
    background: ${styles.surfaceBg};
    border: 1px solid ${styles.borderSubtle};
    border-radius: 10px; padding: 12px 18px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .scale-digits {
    font-size: 20px; font-weight: 800; font-family: monospace; color: ${styles.accentColor};
  }
  .tare-btn {
    padding: 6px 14px; background: ${styles.pillBg};
    border: 1px solid ${styles.borderSubtle}; border-radius: 6px;
    font-size: 11px; font-weight: 700; color: ${styles.textPrimary}; cursor: pointer;
  }

  /* Cart Table - Clean Lines, Zero Clutter */
  .cart-table-panel {
    flex: 1; background: ${styles.surfaceBg};
    border: 1px solid ${styles.borderSubtle}; border-radius: 12px;
    padding: 20px; display: flex; flex-direction: column;
  }
  .th-row {
    display: flex; justify-content: space-between;
    padding-bottom: 12px; border-bottom: 1px solid ${styles.borderSubtle};
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${styles.textMuted};
  }
  .tr-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 0; border-bottom: 1px solid ${styles.borderSubtle};
  }
  .item-title { font-size: 14px; font-weight: 700; color: ${styles.textPrimary}; }
  .item-sku { font-size: 12px; color: ${styles.textMuted}; margin-top: 2px; }
  .qty-box {
    padding: 6px 12px; border-radius: 6px; background: ${styles.pillBg};
    font-size: 13px; font-weight: 700; color: ${styles.textPrimary};
  }
  .item-total { font-size: 15px; font-weight: 800; font-family: monospace; color: ${styles.textPrimary}; }

  /* Right Billing Folio */
  .right-pane {
    flex: 5; background: ${styles.surfaceBg};
    border: 1px solid ${styles.borderSubtle}; border-radius: 14px;
    padding: 24px; display: flex; flex-direction: column; justify-content: space-between;
  }
  .section-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${styles.textMuted};
    margin-bottom: 12px;
  }
  .customer-card {
    background: ${styles.innerSurface}; border: 1px solid ${styles.borderSubtle};
    border-radius: 10px; padding: 14px 16px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .cust-name { font-size: 14px; font-weight: 700; color: ${styles.textPrimary}; }
  .cust-phone { font-size: 12px; color: ${styles.textMuted}; margin-top: 2px; }

  .bill-breakdown {
    margin: 20px 0; display: flex; flex-direction: column; gap: 8px;
  }
  .bill-line {
    display: flex; justify-content: space-between; font-size: 13px; color: ${styles.textSecondary}; font-weight: 600;
  }
  .bill-val { color: ${styles.textPrimary}; font-weight: 700; }

  /* Grand Total Box - Principle 1: Dominant Visual Anchor */
  .grand-total-card {
    background: ${styles.totalCardBg};
    border: 1px solid ${styles.totalCardBorder};
    border-radius: 12px; padding: 18px 22px;
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 20px;
  }
  .gt-text { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: ${styles.textSecondary}; }
  .gt-val { font-size: 36px; font-weight: 900; font-family: monospace; color: ${styles.totalValColor}; }

  /* Principle 1 & 4: Primary Hero Action (F1) */
  .primary-action-btn {
    background: ${styles.actionBtnBg};
    color: ${styles.actionBtnText};
    padding: 16px 20px; border-radius: 10px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 15px; font-weight: 800; cursor: pointer; border: none;
    box-shadow: ${styles.actionShadow};
  }

  .pay-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px;
  }
  .sub-btn {
    background: ${styles.innerSurface}; border: 1px solid ${styles.borderSubtle};
    padding: 10px 6px; border-radius: 8px; text-align: center;
    font-size: 12px; font-weight: 700; color: ${styles.textPrimary}; cursor: pointer;
  }
  .sub-key {
    font-size: 9px; font-weight: 800; font-family: monospace;
    color: ${styles.textMuted}; display: block; margin-bottom: 2px;
  }
</style>
</head>
<body>
  <div class="sidebar">
    <div>
      <div class="brand-row">
        <div class="brand-seal">S</div>
        <div>
          <div class="brand-title">SAUDA</div>
          <div class="brand-sub">${sub}</div>
        </div>
      </div>

      <div style="margin-top: 20px;">
        <div class="nav-item active">
          <span>POS Billing</span>
          <span class="nav-pill">F1</span>
        </div>
        <div class="nav-item">
          <span>Inventory</span>
          <span class="nav-pill">F2</span>
        </div>
        <div class="nav-item">
          <span>Khata / Udhar</span>
          <span class="nav-pill">F3</span>
        </div>
        <div class="nav-item">
          <span>Store Analytics</span>
          <span class="nav-pill">F4</span>
        </div>
        <div class="nav-item">
          <span>Settings</span>
          <span class="nav-pill">F5</span>
        </div>
      </div>
    </div>

    <div style="padding: 12px; background: ${styles.innerSurface}; border: 1px solid ${styles.borderSubtle}; border-radius: 8px;">
      <div style="font-size: 12px; font-weight: 700; color: ${styles.textPrimary};">Sri Lakshmi General Store</div>
      <div style="font-size: 10px; color: ${styles.accentColor}; font-weight: 700; margin-top: 2px;">● OFFLINE-FIRST DESK</div>
    </div>
  </div>

  <div class="workspace">
    <div class="left-pane">
      <div class="search-box">
        <span style="font-size: 16px; color: ${styles.textMuted};">🔍</span>
        <input class="search-input" value="Scan barcode or type item name (F8 for loose staples)..." readonly />
        <span class="search-shortcut">CTRL K</span>
      </div>

      <div class="scale-bar">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 13px; font-weight: 700; color: ${styles.textSecondary};">Digital Weighing Scale:</span>
          <span class="scale-digits">1.480 kg</span>
          <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${styles.pillBg}; color: ${styles.accentColor};">STABLE</span>
        </div>
        <button class="tare-btn">TARE (ZERO)</button>
      </div>

      <div class="cart-table-panel">
        <div class="th-row">
          <span style="width: 45%;">Item Description</span>
          <span style="width: 25%; text-align: center;">Quantity / Weight</span>
          <span style="width: 30%; text-align: right;">Total</span>
        </div>

        <div class="tr-item">
          <div style="width: 45%;">
            <div class="item-title">Aashirvaad Superior MP Atta 10kg</div>
            <div class="item-sku">SKU: ASH-ATT-10K • Whole Wheat</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="qty-box">1 bag</span></div>
          <div style="width: 30%; text-align: right;"><span class="item-total">₹485.00</span></div>
        </div>

        <div class="tr-item">
          <div style="width: 45%;">
            <div class="item-title">Freedom Refined Sunflower Oil 1L</div>
            <div class="item-sku">SKU: FRD-OIL-1L • Refined Pouch</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="qty-box">2 pouches</span></div>
          <div style="width: 30%; text-align: right;"><span class="item-total">₹284.00</span></div>
        </div>

        <div class="tr-item">
          <div style="width: 45%;">
            <div class="item-title">Tata Vacuum Evaporated Salt 1kg</div>
            <div class="item-sku">SKU: TAT-SLT-1K • Iodized Salt</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="qty-box">3 pkts</span></div>
          <div style="width: 30%; text-align: right;"><span class="item-total">₹84.00</span></div>
        </div>

        <div class="tr-item">
          <div style="width: 45%;">
            <div class="item-title">Kandipappu (Toor Dal Grade 1)</div>
            <div class="item-sku">Loose Commodity • Weighed on Scale</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="qty-box" style="color: ${styles.accentColor}; font-weight: 800;">1.480 kg</span></div>
          <div style="width: 30%; text-align: right;"><span class="item-total">₹236.80</span></div>
        </div>
      </div>
    </div>

    <div class="right-pane">
      <div>
        <div class="section-label">Customer Ledger</div>
        <div class="customer-card">
          <div>
            <div class="cust-name">రమేష్ గారు (Ramesh Ji)</div>
            <div class="cust-phone">+91 98480 22338 • CUS-0142</div>
          </div>
          <span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 5px; background: ${styles.pillBg}; color: ${styles.textPrimary};">KHATA LINKED</span>
        </div>

        <div class="bill-breakdown">
          <div class="bill-line">
            <span>Subtotal (4 items)</span>
            <span class="bill-val">₹1,089.80</span>
          </div>
          <div class="bill-line">
            <span>Store Tax (GST)</span>
            <span class="bill-val">₹42.50</span>
          </div>
          <div class="bill-line">
            <span>Customer Discount</span>
            <span class="bill-val" style="color: ${styles.accentColor};">- ₹22.30</span>
          </div>
        </div>

        <div class="grand-total-card">
          <span class="gt-text">Grand Total</span>
          <span class="gt-val">₹1,110.00</span>
        </div>
      </div>

      <div>
        <button class="primary-action-btn">
          <span style="display: flex; align-items: center; gap: 8px;">
            <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; font-size: 11px;">F1</span>
            <span>Complete Cash Sale</span>
          </span>
          <span>₹1,110.00 →</span>
        </button>

        <div class="pay-grid">
          <div class="sub-btn">
            <span class="sub-key">F2</span>
            <span>UPI QR</span>
          </div>
          <div class="sub-btn">
            <span class="sub-key">F3</span>
            <span>Khata</span>
          </div>
          <div class="sub-btn">
            <span class="sub-key">F5</span>
            <span>Split</span>
          </div>
          <div class="sub-btn">
            <span class="sub-key">F7</span>
            <span>Return</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    await page.setContent(html);
    const outPath = `C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/${filename}`;
    await page.screenshot({ path: outPath });
    console.log('Saved', filename);
  };

  // 1. Apple Stark Light Architecture (Pristine Swiss Editorial - Like Apple Store POS)
  await renderTheme(
    'Apple Pure Minimal Light',
    'Swiss Editorial',
    {
      bodyBg: '#F5F5F7',
      sidebarBg: '#FFFFFF',
      surfaceBg: '#FFFFFF',
      innerSurface: '#F5F5F7',
      borderSubtle: '#E5E5EA',
      borderStrong: '#D1D1D6',
      textPrimary: '#1D1D1F',
      textSecondary: '#6E6E73',
      textMuted: '#86868B',
      sealBg: '#1D1D1F',
      sealText: '#FFFFFF',
      navActiveBg: '#E8E8ED',
      navActiveText: '#1D1D1F',
      pillBg: '#E8E8ED',
      pillText: '#1D1D1F',
      accentColor: '#0071E3',
      totalCardBg: '#F5F5F7',
      totalCardBorder: '#D1D1D6',
      totalValColor: '#1D1D1F',
      actionBtnBg: '#0071E3',
      actionBtnText: '#FFFFFF',
      actionShadow: '0 4px 14px rgba(0, 113, 227, 0.3)'
    },
    'claude_taste_01_apple_light.png'
  );

  // 2. Linear Dark Precision (Monochrome Obsidian - Zero AI Gradients, Pure Craft)
  await renderTheme(
    'Linear Dark Precision',
    'Graphite Minimal',
    {
      bodyBg: '#0D0E11',
      sidebarBg: '#12141A',
      surfaceBg: '#161922',
      innerSurface: '#1C202B',
      borderSubtle: '#262A36',
      borderStrong: '#3A4052',
      textPrimary: '#FFFFFF',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      sealBg: '#FFFFFF',
      sealText: '#0D0E11',
      navActiveBg: '#232838',
      navActiveText: '#FFFFFF',
      pillBg: '#232838',
      pillText: '#E2E8F0',
      accentColor: '#38BDF8',
      totalCardBg: '#12141A',
      totalCardBorder: '#3A4052',
      totalValColor: '#FFFFFF',
      actionBtnBg: '#FFFFFF',
      actionBtnText: '#0D0E11',
      actionShadow: '0 4px 20px rgba(255, 255, 255, 0.15)'
    },
    'claude_taste_02_linear_dark.png'
  );

  // 3. Warm Architectural Sand & Forest (Classic European Department Store)
  await renderTheme(
    'Bespoke Merchant Heritage',
    'Warm Linen & Forest',
    {
      bodyBg: '#F7F5F0',
      sidebarBg: '#EFECE6',
      surfaceBg: '#FFFFFF',
      innerSurface: '#F7F5F0',
      borderSubtle: '#E4DFD5',
      borderStrong: '#CFC7BA',
      textPrimary: '#1E1E1E',
      textSecondary: '#5C5850',
      textMuted: '#8A857B',
      sealBg: '#1B3B2B',
      sealText: '#F7F5F0',
      navActiveBg: '#1B3B2B',
      navActiveText: '#FFFFFF',
      pillBg: '#EFECE6',
      pillText: '#1E1E1E',
      accentColor: '#1B3B2B',
      totalCardBg: '#F7F5F0',
      totalCardBorder: '#CFC7BA',
      totalValColor: '#1B3B2B',
      actionBtnBg: '#1B3B2B',
      actionBtnText: '#FFFFFF',
      actionShadow: '0 4px 14px rgba(27, 59, 43, 0.25)'
    },
    'claude_taste_03_merchant_heritage.png'
  );

  await browser.close();
  console.log('All 3 Handcrafted Anti-Slop Claude Taste Themes Rendered!');
}

generateClaudeHandcraftedThemes().catch(err => {
  console.error(err);
  process.exit(1);
});
