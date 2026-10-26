import { chromium } from 'playwright';

async function generateFigmaPrinciplesThemes() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  // Master Template strictly adhering to the 7 Figma Principles:
  // 1. Hierarchy (Clear font weights, sizes, and focal actions)
  // 2. Contrast & Accessibility (WCAG compliant sharp foreground vs background)
  // 3. Proximity & Alignment (Strict 8pt grid, related buttons grouped)
  // 4. Progressive Disclosure (Uncluttered, intuitive flows)
  const renderTheme = async (themeName, cfg, filename) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  body {
    background: ${cfg.bg};
    color: #FFFFFF;
    height: 100vh;
    display: flex;
    overflow: hidden;
  }
  
  /* Sidebar - Principle 6: Proximity & Principle 7: Alignment */
  .sidebar {
    width: 260px;
    background: ${cfg.sidebarBg};
    backdrop-filter: blur(28px);
    border-right: 1px solid ${cfg.sidebarBorder};
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 4px 0 30px rgba(0,0,0,0.6);
  }
  .brand-logo {
    width: 44px; height: 44px; border-radius: 14px;
    background: ${cfg.logoBg};
    border: 1.5px solid ${cfg.accent};
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.7), 0 8px 20px ${cfg.accentGlow};
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 900; color: ${cfg.accentText};
  }
  .nav-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; border-radius: 14px;
    font-size: 13px; font-weight: 700; color: #94A3B8;
    margin-bottom: 6px; transition: all 0.2s;
  }
  .nav-btn.active {
    background: ${cfg.navActiveBg};
    color: #FFFFFF;
    border: 1.5px solid ${cfg.navActiveBorder};
    box-shadow: 0 8px 20px ${cfg.navActiveGlow};
  }
  
  /* Main Canvas */
  .main-canvas {
    flex: 1; padding: 24px; display: flex; gap: 24px;
  }
  
  /* Left Billing Grid - Principle 1: Hierarchy & Principle 4: Contrast */
  .left-pane {
    flex: 7; display: flex; flex-direction: column; gap: 18px;
  }
  
  /* Search Bar - Highest contrast in top zone */
  .search-card {
    background: ${cfg.cardBg};
    backdrop-filter: blur(24px);
    border: 2px solid ${cfg.searchBorder};
    border-radius: 18px;
    padding: 14px 20px;
    display: flex; align-items: center; gap: 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }
  .search-input {
    background: transparent; border: none; outline: none;
    font-size: 16px; font-weight: 700; color: #FFFFFF; flex: 1;
  }
  .search-badge {
    background: ${cfg.badgeBg};
    color: ${cfg.accent};
    border: 1px solid ${cfg.accent};
    padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800;
  }
  
  /* Hardware Scale Bar - Principle 3: Consistency & Principle 6: Proximity */
  .scale-strip {
    background: ${cfg.scaleBg};
    backdrop-filter: blur(20px);
    border: 1px solid ${cfg.cardBorder};
    border-radius: 16px; padding: 12px 18px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .scale-weight {
    font-size: 20px; font-weight: 900; font-family: monospace; color: ${cfg.scaleWeightColor};
  }
  
  /* Cart Table - Principle 1: Font Size & Spacing for Hierarchy */
  .cart-table-card {
    flex: 1;
    background: ${cfg.cardBg};
    backdrop-filter: blur(24px);
    border: 1px solid ${cfg.cardBorder};
    border-radius: 20px;
    padding: 20px;
    display: flex; flex-direction: column;
    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
  }
  .table-head {
    display: flex; justify-content: space-between;
    padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.12);
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8;
  }
  .table-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .item-name { font-size: 15px; font-weight: 800; color: #FFFFFF; }
  .item-meta { font-size: 12px; font-weight: 600; color: #94A3B8; margin-top: 2px; }
  .item-qty-badge {
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
    padding: 6px 14px; border-radius: 10px; font-size: 14px; font-weight: 800;
  }
  .item-price { font-size: 16px; font-weight: 900; color: #FFFFFF; font-family: monospace; }
  
  /* Right Checkout Folio - Principle 1: Hierarchy (Grand Total is King) */
  .right-pane {
    flex: 5;
    background: ${cfg.checkoutBg};
    backdrop-filter: blur(28px);
    border: 2px solid ${cfg.checkoutBorder};
    border-radius: 24px;
    padding: 24px;
    display: flex; flex-direction: column; justify-content: space-between;
    box-shadow: 0 20px 50px rgba(0,0,0,0.7);
  }
  
  .customer-card {
    background: ${cfg.innerBoxBg};
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; padding: 14px 18px;
    display: flex; justify-content: space-between; align-items: center;
  }
  
  /* Grand Total Box - High visual weight, zero ambiguity */
  .total-display-card {
    background: ${cfg.totalBoxBg};
    border: 2px solid ${cfg.totalBorder};
    border-radius: 18px; padding: 18px 22px;
    display: flex; justify-content: space-between; align-items: baseline;
    box-shadow: 0 10px 30px ${cfg.totalGlow};
    margin: 16px 0;
  }
  .total-label { font-size: 14px; font-weight: 800; color: #CBD5E1; text-transform: uppercase; letter-spacing: 0.05em; }
  .total-amount { font-size: 38px; font-weight: 900; color: ${cfg.totalAmountColor}; font-family: monospace; letter-spacing: -0.02em; }
  
  /* Principle 1 & 4: Primary Hero Action (Enter / F1) */
  .hero-cta {
    background: ${cfg.ctaBg};
    border: 2px solid ${cfg.ctaBorder};
    color: ${cfg.ctaTextColor};
    padding: 18px 22px; border-radius: 16px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 16px; font-weight: 900;
    box-shadow: 0 12px 35px ${cfg.ctaGlow};
    cursor: pointer; transition: transform 0.15s;
  }
  
  /* Secondary Payment Methods Grid - Principle 6: Proximity */
  .quick-pay-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px;
  }
  .pay-btn {
    background: ${cfg.payBtnBg};
    border: 1px solid ${cfg.payBtnBorder};
    padding: 12px 8px; border-radius: 14px;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    font-size: 12px; font-weight: 800; color: #FFFFFF;
  }
  .pay-shortcut {
    font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 6px;
    background: ${cfg.payShortcutBg}; color: ${cfg.payShortcutColor};
  }
</style>
</head>
<body>
  <div class="sidebar">
    <div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
        <div class="brand-logo">S</div>
        <div>
          <div style="font-size: 18px; font-weight: 900; color: #FFFFFF;">SAUDA POS</div>
          <div style="font-size: 11px; font-weight: 800; color: ${cfg.accent}; text-transform: uppercase; letter-spacing: 0.1em;">${themeName}</div>
        </div>
      </div>
      
      <div class="nav-btn active">
        <span>⚡ POS Billing</span>
        <span style="font-size: 11px; padding: 2px 6px; background: rgba(0,0,0,0.3); border-radius: 6px;">F1</span>
      </div>
      <div class="nav-btn">
        <span>📦 Inventory & Stock</span>
        <span>F2</span>
      </div>
      <div class="nav-btn">
        <span>📖 Customer Khata</span>
        <span>F3</span>
      </div>
      <div class="nav-btn">
        <span>📊 Analytics & P&L</span>
        <span>F4</span>
      </div>
      <div class="nav-btn">
        <span>⚙️ Settings & Hardware</span>
        <span>F5</span>
      </div>
    </div>
    
    <div style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 14px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="font-size: 12px; font-weight: 800; color: #FFF;">Sri Lakshmi General Store</div>
      <div style="font-size: 10px; color: ${cfg.accent}; font-weight: 700; margin-top: 2px;">● OFFLINE-FIRST LIVE CORE</div>
    </div>
  </div>

  <div class="main-canvas">
    <div class="left-pane">
      <div class="search-card">
        <span style="font-size: 20px; color: ${cfg.accent};">🔍</span>
        <input class="search-input" value="Scan Barcode or Search Item (F8 for Loose Groceries)..." readonly />
        <span class="search-badge">PROXIMITY & CONTRAST</span>
      </div>

      <div class="scale-strip">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 16px;">⚖️</span>
          <span style="font-size: 13px; font-weight: 800; color: #E2E8F0;">Digital Weighing Scale:</span>
          <span class="scale-weight">1.480 kg</span>
          <span style="background: rgba(16,185,129,0.2); color: #34D399; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; border: 1px solid #10B981;">STABLE</span>
        </div>
        <button style="padding: 6px 14px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #FFF; font-size: 11px; font-weight: 800;">TARE (Zero)</button>
      </div>

      <div class="cart-table-card">
        <div class="table-head">
          <span style="width: 45%;">Item / Description</span>
          <span style="width: 25%; text-align: center;">Qty / Weight</span>
          <span style="width: 30%; text-align: right;">Line Total</span>
        </div>

        <div class="table-row">
          <div style="width: 45%;">
            <div class="item-name">Aashirvaad Superior MP Atta 10kg</div>
            <div class="item-meta">SKU: ASH-ATT-10K • Whole Wheat</div>
          </div>
          <div style="width: 25%; text-align: center;">
            <span class="item-qty-badge">1 bag</span>
          </div>
          <div style="width: 30%; text-align: right;">
            <span class="item-price">₹485.00</span>
          </div>
        </div>

        <div class="table-row">
          <div style="width: 45%;">
            <div class="item-name">Freedom Refined Sunflower Oil 1L</div>
            <div class="item-meta">SKU: FRD-OIL-1L • Refined Pouch</div>
          </div>
          <div style="width: 25%; text-align: center;">
            <span class="item-qty-badge">2 pouches</span>
          </div>
          <div style="width: 30%; text-align: right;">
            <span class="item-price">₹284.00</span>
          </div>
        </div>

        <div class="table-row">
          <div style="width: 45%;">
            <div class="item-name">Tata Vacuum Evaporated Salt 1kg</div>
            <div class="item-meta">SKU: TAT-SLT-1K • Iodized Salt</div>
          </div>
          <div style="width: 25%; text-align: center;">
            <span class="item-qty-badge">3 pkts</span>
          </div>
          <div style="width: 30%; text-align: right;">
            <span class="item-price">₹84.00</span>
          </div>
        </div>

        <div class="table-row">
          <div style="width: 45%;">
            <div class="item-name">Kandipappu (Toor Dal First Grade)</div>
            <div class="item-meta">Loose Commodity • Scale Weighed</div>
          </div>
          <div style="width: 25%; text-align: center;">
            <span class="item-qty-badge" style="color: ${cfg.accent}; border-color: ${cfg.accent};">1.480 kg</span>
          </div>
          <div style="width: 30%; text-align: right;">
            <span class="item-price">₹236.80</span>
          </div>
        </div>
      </div>
    </div>

    <div class="right-pane">
      <div>
        <div style="font-size: 13px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Customer Ledger & Billing</div>
        
        <div class="customer-card">
          <div>
            <div style="font-size: 14px; font-weight: 900; color: #FFF;">రమేష్ గారు (Ramesh Ji)</div>
            <div style="font-size: 11px; color: #94A3B8; font-weight: 600;">Ph: +91 98480 22338 • CUS-0142</div>
          </div>
          <span style="background: rgba(59,130,246,0.2); border: 1px solid #3B82F6; color: #60A5FA; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800;">REGULAR KHATA</span>
        </div>

        <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94A3B8; font-weight: 600;">
            <span>Subtotal (4 items)</span>
            <span style="color: #FFF; font-weight: 800;">₹1,089.80</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #94A3B8; font-weight: 600;">
            <span>Store GST Tax</span>
            <span style="color: #FFF; font-weight: 800;">₹42.50</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: ${cfg.accent}; font-weight: 800;">
            <span>Festive Store Discount</span>
            <span>- ₹22.30</span>
          </div>
        </div>

        <div class="total-display-card">
          <span class="total-label">Grand Total</span>
          <span class="total-amount">₹1,110.00</span>
        </div>
      </div>

      <div>
        <div class="hero-cta">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.4); padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 900;">F1</span>
            <span>Complete Cash Sale</span>
          </div>
          <span>₹1,110.00 →</span>
        </div>

        <div class="quick-pay-grid">
          <div class="pay-btn">
            <span class="pay-shortcut">F2</span>
            <span>UPI QR</span>
          </div>
          <div class="pay-btn">
            <span class="pay-shortcut">F3</span>
            <span>Khata</span>
          </div>
          <div class="pay-btn">
            <span class="pay-shortcut">F5</span>
            <span>Split Pay</span>
          </div>
          <div class="pay-btn">
            <span class="pay-shortcut">F7</span>
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

  // PALETTE 1: High-Contrast Royal Obsidian & Sovereign Amber
  await renderTheme(
    'Obsidian & Sovereign Gold',
    {
      bg: '#0A0E17 radial-gradient(circle at 85% 15%, rgba(245, 158, 11, 0.15), transparent 45%), radial-gradient(circle at 10% 80%, rgba(37, 99, 235, 0.12), transparent 50%)',
      sidebarBg: 'rgba(15, 23, 42, 0.9)',
      sidebarBorder: 'rgba(245, 158, 11, 0.3)',
      logoBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(0,0,0,0.4))',
      accent: '#F59E0B',
      accentText: '#F59E0B',
      accentGlow: 'rgba(245, 158, 11, 0.5)',
      navActiveBg: 'linear-gradient(135deg, #D97706, #B45309)',
      navActiveBorder: '#FDE68A',
      navActiveGlow: 'rgba(245, 158, 11, 0.4)',
      cardBg: 'rgba(15, 23, 42, 0.85)',
      cardBorder: 'rgba(255, 255, 255, 0.18)',
      searchBorder: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      scaleBg: 'rgba(30, 41, 59, 0.7)',
      scaleWeightColor: '#38BDF8',
      checkoutBg: 'rgba(15, 23, 42, 0.95)',
      checkoutBorder: 'rgba(245, 158, 11, 0.4)',
      innerBoxBg: 'rgba(30, 41, 59, 0.7)',
      totalBoxBg: 'rgba(10, 14, 23, 0.95)',
      totalBorder: '#F59E0B',
      totalGlow: 'rgba(245, 158, 11, 0.25)',
      totalAmountColor: '#F59E0B',
      ctaBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
      ctaBorder: '#FEF08A',
      ctaTextColor: '#0A0E17',
      ctaGlow: 'rgba(245, 158, 11, 0.5)',
      payBtnBg: 'rgba(30, 41, 59, 0.8)',
      payBtnBorder: 'rgba(255, 255, 255, 0.15)',
      payShortcutBg: 'rgba(245, 158, 11, 0.2)',
      payShortcutColor: '#FDE68A'
    },
    'figma_palette_01_obsidian_gold.png'
  );

  // PALETTE 2: Ultra-Vibrant Electric Cobalt & Arctic Diamond
  await renderTheme(
    'Electric Cobalt & Diamond',
    {
      bg: '#060B18 radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.18), transparent 45%), radial-gradient(circle at 10% 80%, rgba(99, 102, 241, 0.15), transparent 50%)',
      sidebarBg: 'rgba(10, 18, 36, 0.92)',
      sidebarBorder: 'rgba(56, 189, 248, 0.35)',
      logoBg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.5), rgba(56, 189, 248, 0.3))',
      accent: '#38BDF8',
      accentText: '#FFFFFF',
      accentGlow: 'rgba(56, 189, 248, 0.6)',
      navActiveBg: 'linear-gradient(135deg, #0284C7, #2563EB)',
      navActiveBorder: '#BAE6FD',
      navActiveGlow: 'rgba(37, 99, 235, 0.5)',
      cardBg: 'rgba(10, 20, 42, 0.85)',
      cardBorder: 'rgba(255, 255, 255, 0.2)',
      searchBorder: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      scaleBg: 'rgba(15, 30, 60, 0.7)',
      scaleWeightColor: '#38BDF8',
      checkoutBg: 'rgba(10, 20, 44, 0.95)',
      checkoutBorder: 'rgba(56, 189, 248, 0.45)',
      innerBoxBg: 'rgba(15, 30, 65, 0.7)',
      totalBoxBg: 'rgba(6, 11, 24, 0.95)',
      totalBorder: '#38BDF8',
      totalGlow: 'rgba(56, 189, 248, 0.3)',
      totalAmountColor: '#38BDF8',
      ctaBg: 'linear-gradient(135deg, #0284C7, #2563EB)',
      ctaBorder: '#BAE6FD',
      ctaTextColor: '#FFFFFF',
      ctaGlow: 'rgba(37, 99, 235, 0.5)',
      payBtnBg: 'rgba(15, 30, 65, 0.85)',
      payBtnBorder: 'rgba(255, 255, 255, 0.18)',
      payShortcutBg: 'rgba(56, 189, 248, 0.25)',
      payShortcutColor: '#E0F2FE'
    },
    'figma_palette_02_electric_cobalt.png'
  );

  // PALETTE 3: Pure Emerald Neon & Dark Slate (Retail Green Master)
  await renderTheme(
    'Hyper-Emerald & Pitch Slate',
    {
      bg: '#07100D radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.2), transparent 45%), radial-gradient(circle at 10% 80%, rgba(6, 182, 212, 0.12), transparent 50%)',
      sidebarBg: 'rgba(9, 24, 18, 0.92)',
      sidebarBorder: 'rgba(16, 185, 129, 0.35)',
      logoBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.5), rgba(5, 150, 105, 0.3))',
      accent: '#10B981',
      accentText: '#FFFFFF',
      accentGlow: 'rgba(16, 185, 129, 0.6)',
      navActiveBg: 'linear-gradient(135deg, #10B981, #059669)',
      navActiveBorder: '#A7F3D0',
      navActiveGlow: 'rgba(16, 185, 129, 0.5)',
      cardBg: 'rgba(9, 24, 18, 0.85)',
      cardBorder: 'rgba(255, 255, 255, 0.2)',
      searchBorder: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      scaleBg: 'rgba(15, 36, 28, 0.7)',
      scaleWeightColor: '#34D399',
      checkoutBg: 'rgba(9, 25, 19, 0.95)',
      checkoutBorder: 'rgba(16, 185, 129, 0.45)',
      innerBoxBg: 'rgba(15, 38, 29, 0.7)',
      totalBoxBg: 'rgba(5, 15, 11, 0.95)',
      totalBorder: '#10B981',
      totalGlow: 'rgba(16, 185, 129, 0.3)',
      totalAmountColor: '#34D399',
      ctaBg: 'linear-gradient(135deg, #10B981, #059669)',
      ctaBorder: '#A7F3D0',
      ctaTextColor: '#FFFFFF',
      ctaGlow: 'rgba(16, 185, 129, 0.5)',
      payBtnBg: 'rgba(15, 38, 29, 0.85)',
      payBtnBorder: 'rgba(255, 255, 255, 0.18)',
      payShortcutBg: 'rgba(16, 185, 129, 0.25)',
      payShortcutColor: '#D1FAE5'
    },
    'figma_palette_03_hyper_emerald.png'
  );

  // PALETTE 4: High-Contrast Royal Amethyst & Rose Gold
  await renderTheme(
    'Royal Amethyst & Sunset Rose',
    {
      bg: '#0E0916 radial-gradient(circle at 85% 15%, rgba(244, 63, 94, 0.18), transparent 45%), radial-gradient(circle at 10% 80%, rgba(168, 85, 247, 0.15), transparent 50%)',
      sidebarBg: 'rgba(22, 14, 36, 0.92)',
      sidebarBorder: 'rgba(244, 63, 94, 0.35)',
      logoBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.5), rgba(168, 85, 247, 0.3))',
      accent: '#FB7185',
      accentText: '#FFFFFF',
      accentGlow: 'rgba(244, 63, 94, 0.6)',
      navActiveBg: 'linear-gradient(135deg, #E11D48, #9333EA)',
      navActiveBorder: '#FECDD3',
      navActiveGlow: 'rgba(244, 63, 94, 0.5)',
      cardBg: 'rgba(24, 15, 40, 0.85)',
      cardBorder: 'rgba(255, 255, 255, 0.2)',
      searchBorder: '#FB7185',
      badgeBg: 'rgba(244, 63, 94, 0.15)',
      scaleBg: 'rgba(35, 22, 58, 0.7)',
      scaleWeightColor: '#FB7185',
      checkoutBg: 'rgba(24, 15, 42, 0.95)',
      checkoutBorder: 'rgba(244, 63, 94, 0.45)',
      innerBoxBg: 'rgba(35, 22, 60, 0.7)',
      totalBoxBg: 'rgba(12, 7, 20, 0.95)',
      totalBorder: '#FB7185',
      totalGlow: 'rgba(244, 63, 94, 0.3)',
      totalAmountColor: '#FDA4AF',
      ctaBg: 'linear-gradient(135deg, #F43F5E, #E11D48)',
      ctaBorder: '#FECDD3',
      ctaTextColor: '#FFFFFF',
      ctaGlow: 'rgba(244, 63, 94, 0.5)',
      payBtnBg: 'rgba(35, 22, 60, 0.85)',
      payBtnBorder: 'rgba(255, 255, 255, 0.18)',
      payShortcutBg: 'rgba(244, 63, 94, 0.25)',
      payShortcutColor: '#FFE4E6'
    },
    'figma_palette_04_royal_amethyst.png'
  );

  await browser.close();
  console.log('All 4 Figma Principles High-Contrast Palettes Rendered Successfully!');
}

generateFigmaPrinciplesThemes().catch(err => {
  console.error(err);
  process.exit(1);
});
