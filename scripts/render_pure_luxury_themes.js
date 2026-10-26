import { chromium } from 'playwright';

async function generateZeroAiRealLuxuryThemes() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  // Strict architectural, non-AI, zero-gradient luxury POS interface
  const renderCleanTheme = async (themeTitle, config, outFilename) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif; }
  body {
    background: ${config.canvasBg};
    color: #FFFFFF;
    height: 100vh;
    display: flex;
    overflow: hidden;
  }
  
  /* Sidebar - Principle: Pure Architectural Alignment & High Functional Contrast */
  .sidebar {
    width: 260px;
    background: ${config.sidebarBg};
    backdrop-filter: blur(32px);
    border-right: 1px solid ${config.panelBorder};
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .brand-box {
    display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
    padding-bottom: 18px; border-bottom: 1px solid ${config.divider};
  }
  .brand-monogram {
    width: 42px; height: 42px; border-radius: 12px;
    background: ${config.monogramBg};
    border: 1.5px solid ${config.monogramBorder};
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 900; color: ${config.monogramText};
  }
  .brand-name { font-size: 18px; font-weight: 800; letter-spacing: 0.05em; color: #FFFFFF; }
  .brand-tag { font-size: 11px; font-weight: 700; color: ${config.tagColor}; text-transform: uppercase; letter-spacing: 0.1em; }

  .nav-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; border-radius: 12px;
    font-size: 13px; font-weight: 700; color: #94A3B8;
    margin-bottom: 6px;
  }
  .nav-btn.active {
    background: ${config.navActiveBg};
    color: #FFFFFF;
    border: 1.5px solid ${config.navActiveBorder};
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
  .nav-badge {
    font-size: 10px; font-weight: 900; font-family: monospace;
    padding: 2px 6px; border-radius: 6px;
    background: rgba(255,255,255,0.08); color: #CBD5E1;
  }
  .nav-btn.active .nav-badge {
    background: rgba(255,255,255,0.2); color: #FFFFFF;
  }

  /* Main Workspace */
  .workspace {
    flex: 1; padding: 24px; display: flex; gap: 24px;
  }
  
  .left-col {
    flex: 7; display: flex; flex-direction: column; gap: 18px;
  }
  
  /* Search input - Principle 1 & 4: Top contrast zone */
  .search-strip {
    background: ${config.panelBg};
    backdrop-filter: blur(28px);
    border: 1.5px solid ${config.searchBorder};
    border-radius: 16px;
    padding: 14px 20px;
    display: flex; align-items: center; gap: 14px;
  }
  .search-input {
    background: transparent; border: none; outline: none;
    font-size: 15px; font-weight: 700; color: #FFFFFF; flex: 1;
  }
  .search-tag {
    background: ${config.searchTagBg};
    color: ${config.searchTagColor};
    border: 1px solid ${config.searchTagBorder};
    padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800;
  }

  /* Hardware Bar */
  .hardware-strip {
    background: ${config.innerCardBg};
    border: 1px solid ${config.panelBorder};
    border-radius: 14px; padding: 12px 18px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .scale-val {
    font-size: 20px; font-weight: 900; font-family: monospace; color: ${config.scaleValColor};
  }

  /* Cart Table - Crisp Clean Monochrome Elegance */
  .cart-card {
    flex: 1;
    background: ${config.panelBg};
    backdrop-filter: blur(28px);
    border: 1px solid ${config.panelBorder};
    border-radius: 20px;
    padding: 20px;
    display: flex; flex-direction: column;
  }
  .cart-head {
    display: flex; justify-content: space-between;
    padding-bottom: 12px; border-bottom: 1px solid ${config.divider};
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8;
  }
  .cart-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .row-title { font-size: 15px; font-weight: 800; color: #FFFFFF; }
  .row-meta { font-size: 12px; font-weight: 600; color: #94A3B8; margin-top: 2px; }
  .row-qty {
    background: ${config.innerCardBg}; border: 1px solid ${config.panelBorder};
    padding: 6px 14px; border-radius: 8px; font-size: 14px; font-weight: 800; color: #FFFFFF;
  }
  .row-price { font-size: 16px; font-weight: 900; color: #FFFFFF; font-family: monospace; }

  /* Right Checkout Column */
  .right-col {
    flex: 5;
    background: ${config.checkoutBg};
    backdrop-filter: blur(32px);
    border: 1.5px solid ${config.checkoutBorder};
    border-radius: 22px;
    padding: 24px;
    display: flex; flex-direction: column; justify-content: space-between;
  }

  .cust-box {
    background: ${config.innerCardBg};
    border: 1px solid ${config.panelBorder};
    border-radius: 14px; padding: 14px 18px;
    display: flex; justify-content: space-between; align-items: center;
  }

  .calc-summary {
    margin: 16px 0; display: flex; flex-direction: column; gap: 8px;
  }
  .calc-line {
    display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #94A3B8;
  }
  .calc-val { color: #FFFFFF; font-weight: 800; }

  /* Grand Total - Principle 1: Dominant Hierarchy */
  .grand-total-box {
    background: ${config.grandTotalBg};
    border: 2px solid ${config.grandTotalBorder};
    border-radius: 18px; padding: 18px 22px;
    display: flex; justify-content: space-between; align-items: baseline;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    margin: 16px 0;
  }
  .gt-label { font-size: 14px; font-weight: 800; color: #94A3B8; text-transform: uppercase; }
  .gt-amount { font-size: 38px; font-weight: 900; color: ${config.gtAmountColor}; font-family: monospace; }

  /* Action Buttons */
  .cta-master {
    background: ${config.ctaBg};
    border: 1.5px solid ${config.ctaBorder};
    color: ${config.ctaColor};
    padding: 18px 22px; border-radius: 16px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 16px; font-weight: 900; cursor: pointer;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  
  .methods-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px;
  }
  .m-btn {
    background: ${config.innerCardBg};
    border: 1px solid ${config.panelBorder};
    padding: 12px 8px; border-radius: 12px;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    font-size: 12px; font-weight: 800; color: #FFFFFF;
  }
  .m-hint {
    font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 5px;
    background: rgba(255,255,255,0.08); color: #94A3B8;
  }
</style>
</head>
<body>
  <div class="sidebar">
    <div>
      <div class="brand-box">
        <div class="brand-monogram">S</div>
        <div>
          <div class="brand-name">SAUDA</div>
          <div class="brand-tag">${themeTitle}</div>
        </div>
      </div>

      <div class="nav-btn active">
        <span>⚡ POS Billing</span>
        <span class="nav-badge">F1</span>
      </div>
      <div class="nav-btn">
        <span>📦 Inventory</span>
        <span class="nav-badge">F2</span>
      </div>
      <div class="nav-btn">
        <span>📖 Customer Khata</span>
        <span class="nav-badge">F3</span>
      </div>
      <div class="nav-btn">
        <span>📊 Analytics</span>
        <span class="nav-badge">F4</span>
      </div>
      <div class="nav-btn">
        <span>⚙️ Settings</span>
        <span class="nav-badge">F5</span>
      </div>
    </div>

    <div style="padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid ${config.panelBorder}; border-radius: 12px;">
      <div style="font-size: 12px; font-weight: 800; color: #FFFFFF;">Sri Lakshmi General Store</div>
      <div style="font-size: 10px; color: ${config.scaleValColor}; font-weight: 700; margin-top: 2px;">● OFFLINE SECURE TERMINAL</div>
    </div>
  </div>

  <div class="workspace">
    <div class="left-col">
      <div class="search-strip">
        <span style="font-size: 18px; color: #FFFFFF;">🔍</span>
        <input class="search-input" value="Scan Barcode or Search (F8 for Loose Groceries)..." readonly />
        <span class="search-tag">ZERO AI CLICHÉS</span>
      </div>

      <div class="hardware-strip">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 16px;">⚖️</span>
          <span style="font-size: 13px; font-weight: 800; color: #E2E8F0;">Digital Weighing Scale:</span>
          <span class="scale-val">1.480 kg</span>
          <span style="background: rgba(255,255,255,0.1); color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);">STABLE</span>
        </div>
        <button style="padding: 6px 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #FFF; font-size: 11px; font-weight: 800;">TARE</button>
      </div>

      <div class="cart-card">
        <div class="cart-head">
          <span style="width: 45%;">Description</span>
          <span style="width: 25%; text-align: center;">Qty / Weight</span>
          <span style="width: 30%; text-align: right;">Total</span>
        </div>

        <div class="cart-row">
          <div style="width: 45%;">
            <div class="row-title">Aashirvaad Superior MP Atta 10kg</div>
            <div class="row-meta">SKU: ASH-ATT-10K • Whole Wheat</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="row-qty">1 bag</span></div>
          <div style="width: 30%; text-align: right;"><span class="row-price">₹485.00</span></div>
        </div>

        <div class="cart-row">
          <div style="width: 45%;">
            <div class="row-title">Freedom Refined Sunflower Oil 1L</div>
            <div class="row-meta">SKU: FRD-OIL-1L • Refined Pouch</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="row-qty">2 pouches</span></div>
          <div style="width: 30%; text-align: right;"><span class="row-price">₹284.00</span></div>
        </div>

        <div class="cart-row">
          <div style="width: 45%;">
            <div class="row-title">Tata Vacuum Evaporated Salt 1kg</div>
            <div class="row-meta">SKU: TAT-SLT-1K • Iodized Salt</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="row-qty">3 pkts</span></div>
          <div style="width: 30%; text-align: right;"><span class="row-price">₹84.00</span></div>
        </div>

        <div class="cart-row">
          <div style="width: 45%;">
            <div class="row-title">Kandipappu (Toor Dal Grade 1)</div>
            <div class="row-meta">Loose Commodity • Weighed Platter</div>
          </div>
          <div style="width: 25%; text-align: center;"><span class="row-qty" style="color: ${config.scaleValColor}; border-color: ${config.scaleValColor};">1.480 kg</span></div>
          <div style="width: 30%; text-align: right;"><span class="row-price">₹236.80</span></div>
        </div>
      </div>
    </div>

    <div class="right-col">
      <div>
        <div style="font-size: 12px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Customer Ledger</div>
        
        <div class="cust-box">
          <div>
            <div style="font-size: 14px; font-weight: 900; color: #FFFFFF;">రమేష్ గారు (Ramesh Ji)</div>
            <div style="font-size: 11px; color: #94A3B8; font-weight: 600;">Ph: +91 98480 22338 • CUS-0142</div>
          </div>
          <span style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #FFFFFF; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800;">KHATA LINKED</span>
        </div>

        <div class="calc-summary">
          <div class="calc-line">
            <span>Subtotal (4 items)</span>
            <span class="calc-val">₹1,089.80</span>
          </div>
          <div class="calc-line">
            <span>GST Tax (Included)</span>
            <span class="calc-val">₹42.50</span>
          </div>
          <div class="calc-line">
            <span>Special Store Discount</span>
            <span class="calc-val" style="color: ${config.scaleValColor};">- ₹22.30</span>
          </div>
        </div>

        <div class="grand-total-box">
          <span class="gt-label">Grand Total</span>
          <span class="gt-amount">₹1,110.00</span>
        </div>
      </div>

      <div>
        <div class="cta-master">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.3); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 900;">F1</span>
            <span>Complete Cash Sale</span>
          </div>
          <span>₹1,110.00 →</span>
        </div>

        <div class="methods-grid">
          <div class="m-btn">
            <span class="m-hint">F2</span>
            <span>UPI QR</span>
          </div>
          <div class="m-btn">
            <span class="m-hint">F3</span>
            <span>Khata</span>
          </div>
          <div class="m-btn">
            <span class="m-hint">F5</span>
            <span>Split Pay</span>
          </div>
          <div class="m-btn">
            <span class="m-hint">F7</span>
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
    console.log('Saved', outFilename);
  };

  // 1. Apple Vision Titanium Monochrome (Zero AI Color - Pure Quartz Glass & Titanium White)
  await renderCleanTheme(
    'Apple Titanium Crystal',
    {
      canvasBg: '#0B0D11',
      sidebarBg: 'rgba(15, 17, 23, 0.95)',
      panelBg: 'rgba(21, 24, 32, 0.85)',
      panelBorder: 'rgba(255, 255, 255, 0.12)',
      innerCardBg: 'rgba(28, 32, 42, 0.8)',
      divider: 'rgba(255, 255, 255, 0.08)',
      monogramBg: '#FFFFFF',
      monogramBorder: '#FFFFFF',
      monogramText: '#0B0D11',
      tagColor: '#94A3B8',
      navActiveBg: '#FFFFFF',
      navActiveBorder: '#FFFFFF',
      searchBorder: 'rgba(255, 255, 255, 0.35)',
      searchTagBg: 'rgba(255, 255, 255, 0.1)',
      searchTagColor: '#FFFFFF',
      searchTagBorder: 'rgba(255, 255, 255, 0.25)',
      scaleValColor: '#FFFFFF',
      checkoutBg: 'rgba(18, 21, 28, 0.95)',
      checkoutBorder: 'rgba(255, 255, 255, 0.22)',
      grandTotalBg: '#05070A',
      grandTotalBorder: 'rgba(255, 255, 255, 0.4)',
      gtAmountColor: '#FFFFFF',
      ctaBg: '#FFFFFF',
      ctaBorder: '#FFFFFF',
      ctaColor: '#0B0D11'
    },
    'pure_luxury_01_apple_titanium.png'
  );

  // 2. Swiss Institutional Oxford Navy (Pure Banking Blue & Optical Ice)
  await renderCleanTheme(
    'Oxford Navy & Ice',
    {
      canvasBg: '#070B14',
      sidebarBg: 'rgba(11, 16, 28, 0.95)',
      panelBg: 'rgba(15, 23, 40, 0.85)',
      panelBorder: 'rgba(255, 255, 255, 0.14)',
      innerCardBg: 'rgba(20, 32, 54, 0.8)',
      divider: 'rgba(255, 255, 255, 0.08)',
      monogramBg: '#2563EB',
      monogramBorder: '#60A5FA',
      monogramText: '#FFFFFF',
      tagColor: '#60A5FA',
      navActiveBg: '#2563EB',
      navActiveBorder: '#60A5FA',
      searchBorder: '#3B82F6',
      searchTagBg: 'rgba(37, 99, 235, 0.2)',
      searchTagColor: '#93C5FD',
      searchTagBorder: '#3B82F6',
      scaleValColor: '#60A5FA',
      checkoutBg: 'rgba(13, 20, 36, 0.95)',
      checkoutBorder: 'rgba(59, 130, 246, 0.35)',
      grandTotalBg: '#050810',
      grandTotalBorder: '#3B82F6',
      gtAmountColor: '#93C5FD',
      ctaBg: '#2563EB',
      ctaBorder: '#60A5FA',
      ctaColor: '#FFFFFF'
    },
    'pure_luxury_02_oxford_navy.png'
  );

  // 3. British Merchant Racing Green (Natural Bottle Green & Ivory)
  await renderCleanTheme(
    'British Racing Green',
    {
      canvasBg: '#08100C',
      sidebarBg: 'rgba(12, 22, 17, 0.95)',
      panelBg: 'rgba(16, 30, 23, 0.85)',
      panelBorder: 'rgba(255, 255, 255, 0.14)',
      innerCardBg: 'rgba(22, 40, 31, 0.8)',
      divider: 'rgba(255, 255, 255, 0.08)',
      monogramBg: '#059669',
      monogramBorder: '#34D399',
      monogramText: '#FFFFFF',
      tagColor: '#34D399',
      navActiveBg: '#059669',
      navActiveBorder: '#34D399',
      searchBorder: '#10B981',
      searchTagBg: 'rgba(16, 185, 129, 0.2)',
      searchTagColor: '#6EE7B7',
      searchTagBorder: '#10B981',
      scaleValColor: '#34D399',
      checkoutBg: 'rgba(13, 25, 19, 0.95)',
      checkoutBorder: 'rgba(16, 185, 129, 0.35)',
      grandTotalBg: '#040906',
      grandTotalBorder: '#10B981',
      gtAmountColor: '#6EE7B7',
      ctaBg: '#059669',
      ctaBorder: '#34D399',
      ctaColor: '#FFFFFF'
    },
    'pure_luxury_03_racing_green.png'
  );

  await browser.close();
  console.log('Zero-AI Real Luxury Palettes Rendered!');
}

generateZeroAiRealLuxuryThemes().catch(err => {
  console.error(err);
  process.exit(1);
});
