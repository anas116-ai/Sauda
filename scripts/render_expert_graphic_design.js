import { chromium } from 'playwright';

async function generateMasterGraphicDesignSuites() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  // Master Graphic Design System Engine
  const renderDesign = async (title, subtitle, palette, outFilename) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: ${palette.canvas};
    color: ${palette.textMain};
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    height: 100vh;
    display: flex;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* 1. ARCHITECTURAL SIDEBAR (Strict Grid Alignment) */
  .sidebar {
    width: 256px;
    background: ${palette.sidebar};
    border-right: 1px solid ${palette.border};
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .brand-header {
    display: flex; align-items: center; gap: 12px;
    padding-bottom: 20px; border-bottom: 1px solid ${palette.border};
  }
  .brand-badge {
    width: 40px; height: 40px; border-radius: 10px;
    background: ${palette.brandBg}; color: ${palette.brandText};
    display: flex; align-items: center; justify-content: center;
    font-size: 19px; font-weight: 800;
    box-shadow: 0 4px 12px ${palette.brandShadow};
  }
  .brand-title { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; color: ${palette.textMain}; }
  .brand-sub { font-size: 11px; font-weight: 700; color: ${palette.textMuted}; text-transform: uppercase; letter-spacing: 0.08em; }

  .nav-group { margin-top: 24px; display: flex; flex-direction: column; gap: 4px; }
  .nav-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 14px; border-radius: 10px;
    font-size: 13px; font-weight: 600; color: ${palette.textDim};
    transition: all 0.15s ease;
  }
  .nav-btn.active {
    background: ${palette.navActiveBg};
    color: ${palette.navActiveText};
    font-weight: 700;
    box-shadow: ${palette.navActiveShadow};
  }
  .key-chip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 700;
    padding: 2px 6px; border-radius: 4px;
    background: ${palette.chipBg}; color: ${palette.chipText};
  }

  /* 2. MAIN APPLICATION WORKSPACE */
  .workspace {
    flex: 1; padding: 24px 28px; display: flex; gap: 24px;
  }
  .left-viewport {
    flex: 7; display: flex; flex-direction: column; gap: 18px;
  }

  /* TOP SEARCH & HARDWARE BAR - Principle 1: Immediate Hierarchy */
  .search-container {
    background: ${palette.cardBg};
    border: 1px solid ${palette.border};
    border-radius: 12px; padding: 13px 18px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: ${palette.cardShadow};
  }
  .search-input {
    background: transparent; border: none; outline: none;
    font-size: 14px; font-weight: 600; color: ${palette.textMain}; flex: 1;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .search-input::placeholder { color: ${palette.textMuted}; }
  .kbd-hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 700;
    padding: 3px 7px; border-radius: 5px;
    background: ${palette.chipBg}; color: ${palette.textMuted};
    border: 1px solid ${palette.border};
  }

  .scale-strip {
    background: ${palette.scaleBg};
    border: 1px solid ${palette.border};
    border-radius: 10px; padding: 10px 18px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .scale-weight {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px; font-weight: 800; color: ${palette.accent};
  }

  /* CART DATA TABLE - Strict Typographic Balance & Zero Clutter */
  .cart-panel {
    flex: 1; background: ${palette.cardBg};
    border: 1px solid ${palette.border};
    border-radius: 14px; padding: 22px;
    display: flex; flex-direction: column;
    box-shadow: ${palette.cardShadow};
  }
  .cart-header {
    display: flex; justify-content: space-between;
    padding-bottom: 12px; border-bottom: 1px solid ${palette.border};
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: ${palette.textMuted};
  }
  .cart-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 15px 0; border-bottom: 1px solid ${palette.rowBorder};
  }
  .item-title { font-size: 14px; font-weight: 700; color: ${palette.textMain}; }
  .item-meta { font-size: 12px; font-weight: 500; color: ${palette.textMuted}; margin-top: 2px; }
  .qty-pill {
    font-family: 'JetBrains Mono', monospace;
    padding: 6px 12px; border-radius: 6px;
    background: ${palette.chipBg}; font-size: 13px; font-weight: 700; color: ${palette.textMain};
  }
  .item-price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px; font-weight: 800; color: ${palette.textMain};
  }

  /* 3. RIGHT BILLING & CHECKOUT COLUMN - Principle 1: Dominant Visual Anchor */
  .right-viewport {
    flex: 5; background: ${palette.cardBg};
    border: 1px solid ${palette.border};
    border-radius: 16px; padding: 24px;
    display: flex; flex-direction: column; justify-content: space-between;
    box-shadow: ${palette.cardShadow};
  }
  .section-tag {
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: ${palette.textMuted};
    margin-bottom: 12px;
  }
  .customer-box {
    background: ${palette.innerSurface};
    border: 1px solid ${palette.border};
    border-radius: 10px; padding: 13px 16px;
    display: flex; justify-content: space-between; align-items: center;
  }

  .totals-breakdown {
    margin: 20px 0; display: flex; flex-direction: column; gap: 8px;
  }
  .breakdown-row {
    display: flex; justify-content: space-between;
    font-size: 13px; font-weight: 600; color: ${palette.textDim};
  }
  .breakdown-val { color: ${palette.textMain}; font-weight: 700; font-family: 'JetBrains Mono', monospace; }

  /* GRAND TOTAL CARD - Highest Visual Weight in Entire UI */
  .grand-total-card {
    background: ${palette.totalCardBg};
    border: 1.5px solid ${palette.totalBorder};
    border-radius: 12px; padding: 18px 22px;
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 20px;
    box-shadow: ${palette.totalShadow};
  }
  .gt-label { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: ${palette.textDim}; }
  .gt-amount { font-family: 'JetBrains Mono', monospace; font-size: 38px; font-weight: 900; color: ${palette.totalAmountColor}; letter-spacing: -0.02em; }

  /* PRIMARY F1 HERO BUTTON - Intentional Action */
  .btn-hero {
    background: ${palette.ctaBg};
    color: ${palette.ctaText};
    padding: 16px 20px; border-radius: 10px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 15px; font-weight: 800; cursor: pointer; border: none;
    box-shadow: ${palette.ctaShadow};
    transition: transform 0.1s ease;
  }
  .btn-hero:active { transform: scale(0.98); }

  /* SECONDARY PAYMENT GRID - Principle 6: Proximity */
  .secondary-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px;
  }
  .sub-pay-btn {
    background: ${palette.innerSurface}; border: 1px solid ${palette.border};
    padding: 10px 6px; border-radius: 8px; text-align: center;
    font-size: 12px; font-weight: 700; color: ${palette.textMain}; cursor: pointer;
  }
  .sub-pay-btn:hover { border-color: ${palette.accent}; }
  .sub-key {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; font-weight: 800;
    color: ${palette.textMuted}; display: block; margin-bottom: 2px;
  }
</style>
</head>
<body>
  <div class="sidebar">
    <div>
      <div class="brand-header">
        <div class="brand-badge">S</div>
        <div>
          <div class="brand-title">SAUDA</div>
          <div class="brand-sub">${subtitle}</div>
        </div>
      </div>

      <div class="nav-group">
        <div class="nav-btn active">
          <span>POS Billing</span>
          <span class="key-chip">F1</span>
        </div>
        <div class="nav-btn">
          <span>Inventory & Stock</span>
          <span class="key-chip">F2</span>
        </div>
        <div class="nav-btn">
          <span>Customer Khata</span>
          <span class="key-chip">F3</span>
        </div>
        <div class="nav-btn">
          <span>Store Analytics</span>
          <span class="key-chip">F4</span>
        </div>
        <div class="nav-btn">
          <span>Settings & Hardware</span>
          <span class="key-chip">F5</span>
        </div>
      </div>
    </div>

    <div style="padding: 12px; background: ${palette.innerSurface}; border: 1px solid ${palette.border}; border-radius: 8px;">
      <div style="font-size: 12px; font-weight: 700; color: ${palette.textMain};">Sri Lakshmi General Store</div>
      <div style="font-size: 10px; color: ${palette.accent}; font-weight: 700; margin-top: 2px;">● OFFLINE SECURE DESK</div>
    </div>
  </div>

  <div class="workspace">
    <div class="left-viewport">
      <div class="search-container">
        <span style="font-size: 16px; color: ${palette.textMuted};">🔍</span>
        <input class="search-input" value="Scan barcode or type item name (F8 for loose staples)..." readonly />
        <span class="kbd-hint">CTRL K</span>
      </div>

      <div class="scale-strip">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 13px; font-weight: 700; color: ${palette.textDim};">Digital Weighing Scale:</span>
          <span class="scale-weight">1.480 kg</span>
          <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${palette.chipBg}; color: ${palette.accent};">STABLE</span>
        </div>
        <button style="padding: 6px 14px; background: ${palette.chipBg}; border: 1px solid ${palette.border}; border-radius: 6px; font-size: 11px; font-weight: 700; color: ${palette.textMain};">TARE</button>
      </div>

      <div class="cart-panel">
        <div class="cart-header">
          <span style="width: 45%;">Item Description</span>
          <span style="width: 25%; text-align: center;">Qty / Weight</span>
          <span style="width: 30%; text-align: right;">Total</span>
        </div>

        <div class="cart-row">
          <div style="width: 45%;">
            <div class="item-title">Aashirvaad Superior MP Atta 10kg</div>
            <div class="item-meta">SKU: ASH-ATT-10K • Whole Wheat</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="qty-pill">1 bag</span></div>
          <div style="width: 30%; text-align: right;"><span class="item-price">₹485.00</span></div>
        </div>

        <div class="cart-row">
          <div style="width: 45%;">
            <div class="item-title">Freedom Refined Sunflower Oil 1L</div>
            <div class="item-meta">SKU: FRD-OIL-1L • Refined Pouch</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="qty-pill">2 pouches</span></div>
          <div style="width: 30%; text-align: right;"><span class="item-price">₹284.00</span></div>
        </div>

        <div class="cart-row">
          <div style="width: 45%;">
            <div class="item-title">Tata Vacuum Evaporated Salt 1kg</div>
            <div class="item-meta">SKU: TAT-SLT-1K • Iodized Salt</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="qty-pill">3 pkts</span></div>
          <div style="width: 30%; text-align: right;"><span class="item-price">₹84.00</span></div>
        </div>

        <div class="cart-row">
          <div style="width: 45%;">
            <div class="item-title">Kandipappu (Toor Dal Grade 1)</div>
            <div class="item-meta">Loose Commodity • Weighed on Scale</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="qty-pill" style="color: ${palette.accent};">1.480 kg</span></div>
          <div style="width: 30%; text-align: right;"><span class="item-price">₹236.80</span></div>
        </div>
      </div>
    </div>

    <div class="right-viewport">
      <div>
        <div class="section-tag">Customer Ledger</div>
        <div class="customer-box">
          <div>
            <div style="font-size: 14px; font-weight: 700; color: ${palette.textMain};">రమేష్ గారు (Ramesh Ji)</div>
            <div style="font-size: 11px; color: ${palette.textMuted}; font-weight: 500;">+91 98480 22338 • CUS-0142</div>
          </div>
          <span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 5px; background: ${palette.chipBg}; color: ${palette.textMain};">KHATA LINKED</span>
        </div>

        <div class="totals-breakdown">
          <div class="breakdown-row">
            <span>Subtotal (4 items)</span>
            <span class="breakdown-val">₹1,089.80</span>
          </div>
          <div class="breakdown-row">
            <span>Store Tax (GST)</span>
            <span class="breakdown-val">₹42.50</span>
          </div>
          <div class="breakdown-row">
            <span>Customer Discount</span>
            <span class="breakdown-val" style="color: ${palette.accent};">- ₹22.30</span>
          </div>
        </div>

        <div class="grand-total-card">
          <span class="gt-label">Grand Total</span>
          <span class="gt-amount">₹1,110.00</span>
        </div>
      </div>

      <div>
        <button class="btn-hero">
          <span style="display: flex; align-items: center; gap: 8px;">
            <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; font-size: 11px; font-family: monospace;">F1</span>
            <span>Complete Cash Sale</span>
          </span>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 16px;">₹1,110.00 →</span>
        </button>

        <div class="secondary-grid">
          <div class="sub-pay-btn">
            <span class="sub-key">F2</span>
            <span>UPI QR</span>
          </div>
          <div class="sub-pay-btn">
            <span class="sub-key">F3</span>
            <span>Khata</span>
          </div>
          <div class="sub-pay-btn">
            <span class="sub-key">F5</span>
            <span>Split</span>
          </div>
          <div class="sub-pay-btn">
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
    const outPath = `C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/${outFilename}`;
    await page.screenshot({ path: outPath });
    console.log('Master Graphic Design Generated:', outFilename);
  };

  // 1. SWISS EDITORIAL INTERNATIONAL (Dieter Rams / Helvetica Timeless Standard)
  await renderDesign(
    'Swiss Modernist Neutral',
    'International Typographic Style',
    {
      canvas: '#0F1115',
      sidebar: '#14171E',
      cardBg: '#181C24',
      innerSurface: '#1F242F',
      scaleBg: '#1B202B',
      border: 'rgba(255, 255, 255, 0.08)',
      rowBorder: 'rgba(255, 255, 255, 0.05)',
      cardShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
      textMain: '#FFFFFF',
      textDim: '#94A3B8',
      textMuted: '#64748B',
      brandBg: '#FFFFFF',
      brandText: '#0F1115',
      brandShadow: 'rgba(255, 255, 255, 0.1)',
      navActiveBg: 'rgba(255, 255, 255, 0.12)',
      navActiveText: '#FFFFFF',
      navActiveShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
      chipBg: 'rgba(255, 255, 255, 0.06)',
      chipText: '#CBD5E1',
      accent: '#38BDF8',
      totalCardBg: '#12151C',
      totalBorder: 'rgba(255, 255, 255, 0.15)',
      totalShadow: '0 10px 30px rgba(0,0,0,0.6)',
      totalAmountColor: '#FFFFFF',
      ctaBg: '#FFFFFF',
      ctaText: '#0F1115',
      ctaShadow: '0 8px 24px rgba(255, 255, 255, 0.15)'
    },
    'expert_graphic_design_01_swiss_modernist.png'
  );

  // 2. INDUSTRIAL FINTECH EXECUTIVE (Stripe / Linear / Bloomberg Terminal Standard)
  await renderDesign(
    'Executive Slate & Ultramarine',
    'Fintech High Precision',
    {
      canvas: '#0A0E17',
      sidebar: '#0E131F',
      cardBg: '#131A29',
      innerSurface: '#182133',
      scaleBg: '#151E2E',
      border: 'rgba(56, 189, 248, 0.12)',
      rowBorder: 'rgba(255, 255, 255, 0.05)',
      cardShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
      textMain: '#FFFFFF',
      textDim: '#94A3B8',
      textMuted: '#64748B',
      brandBg: '#2563EB',
      brandText: '#FFFFFF',
      brandShadow: 'rgba(37, 99, 235, 0.4)',
      navActiveBg: '#1D4ED8',
      navActiveText: '#FFFFFF',
      navActiveShadow: '0 4px 16px rgba(29, 78, 216, 0.4)',
      chipBg: 'rgba(37, 99, 235, 0.12)',
      chipText: '#93C5FD',
      accent: '#60A5FA',
      totalCardBg: '#0D1320',
      totalBorder: '#2563EB',
      totalShadow: '0 10px 30px rgba(37, 99, 235, 0.15)',
      totalAmountColor: '#93C5FD',
      ctaBg: '#2563EB',
      ctaText: '#FFFFFF',
      ctaShadow: '0 8px 24px rgba(37, 99, 235, 0.35)'
    },
    'expert_graphic_design_02_executive_ultramarine.png'
  );

  // 3. ARCHITECTURAL PORCELAIN STUDIO (Apple Retail Clean High-Contrast Light)
  await renderDesign(
    'Architectural Porcelain Studio',
    'Pure Swiss Light Minimalist',
    {
      canvas: '#F6F6F8',
      sidebar: '#FFFFFF',
      cardBg: '#FFFFFF',
      innerSurface: '#F3F4F6',
      scaleBg: '#F3F4F6',
      border: '#E5E7EB',
      rowBorder: '#F3F4F6',
      cardShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      textMain: '#111827',
      textDim: '#4B5563',
      textMuted: '#9CA3AF',
      brandBg: '#111827',
      brandText: '#FFFFFF',
      brandShadow: 'rgba(0, 0, 0, 0.1)',
      navActiveBg: '#111827',
      navActiveText: '#FFFFFF',
      navActiveShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      chipBg: '#F3F4F6',
      chipText: '#1F2937',
      accent: '#2563EB',
      totalCardBg: '#F9FAFB',
      totalBorder: '#E5E7EB',
      totalShadow: '0 4px 12px rgba(0,0,0,0.03)',
      totalAmountColor: '#111827',
      ctaBg: '#111827',
      ctaText: '#FFFFFF',
      ctaShadow: '0 6px 16px rgba(0, 0, 0, 0.15)'
    },
    'expert_graphic_design_03_porcelain_light.png'
  );

  await browser.close();
  console.log('All 3 Expert Graphic Design Suites Rendered!');
}

generateMasterGraphicDesignSuites().catch(err => {
  console.error(err);
  process.exit(1);
});
