import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function renderThemes() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  // THEME 03: Espresso Truffle & Tuscan Rose-Gold
  const htmlTheme03 = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  body {
    background: #181311 radial-gradient(circle at 80% 20%, rgba(251, 146, 60, 0.08), transparent 40%),
                radial-gradient(circle at 10% 80%, rgba(225, 29, 72, 0.06), transparent 50%);
    color: #F8FAFC;
    height: 100vh;
    display: flex;
    overflow: hidden;
  }
  .sidebar {
    width: 260px;
    background: rgba(30, 22, 19, 0.65);
    backdrop-filter: blur(24px);
    border-right: 1px solid rgba(251, 146, 60, 0.15);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .brand-logo {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(225, 29, 72, 0.1));
    border: 1px solid rgba(251, 146, 60, 0.4);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    color: #FB923C;
  }
  .brand-title { font-size: 18px; font-weight: 700; letter-spacing: 0.05em; color: #FFF; }
  .brand-sub { font-size: 11px; color: #FB923C; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #A8A29E;
    transition: all 0.2s;
  }
  .nav-item.active {
    background: rgba(251, 146, 60, 0.15);
    border: 1px solid rgba(251, 146, 60, 0.35);
    color: #FFF;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(251, 146, 60, 0.1);
  }
  .nav-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  .nav-item.active .nav-icon {
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.4), rgba(225, 29, 72, 0.2));
    border-color: rgba(251, 146, 60, 0.5);
    color: #FB923C;
  }

  .main-content {
    flex: 1;
    padding: 24px;
    display: flex;
    gap: 20px;
  }
  .pos-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .top-search-bar {
    background: rgba(38, 28, 24, 0.65);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(251, 146, 60, 0.18);
    border-radius: 16px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  }
  .search-input {
    background: transparent;
    border: none;
    color: #FFF;
    font-size: 15px;
    outline: none;
    flex: 1;
  }
  .badge-60-30-10 {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(251, 146, 60, 0.2);
    border: 1px solid rgba(251, 146, 60, 0.4);
    color: #FB923C;
    letter-spacing: 0.05em;
  }

  .categories-row {
    display: flex;
    gap: 12px;
  }
  .cat-pill {
    padding: 10px 18px;
    border-radius: 12px;
    background: rgba(38, 28, 24, 0.6);
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 13px;
    font-weight: 600;
    color: #D6D3D1;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cat-pill.active {
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.25), rgba(225, 29, 72, 0.15));
    border-color: rgba(251, 146, 60, 0.4);
    color: #FB923C;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    flex: 1;
  }
  .product-card {
    background: rgba(38, 28, 24, 0.65);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.08), 0 8px 20px rgba(0,0,0,0.25);
    position: relative;
    overflow: hidden;
  }
  .product-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(251, 146, 60, 0.4), transparent);
  }
  .prod-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(255,255,255,0.05));
    border: 1px solid rgba(251, 146, 60, 0.3);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin-bottom: 12px;
  }
  .prod-name { font-size: 15px; font-weight: 700; color: #FFF; margin-bottom: 4px; }
  .prod-meta { font-size: 12px; color: #A8A29E; }
  .prod-price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .prod-price { font-size: 18px; font-weight: 800; color: #FB923C; }
  .prod-add-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: rgba(251, 146, 60, 0.2);
    border: 1px solid rgba(251, 146, 60, 0.4);
    color: #FB923C;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 18px;
  }

  .cart-panel {
    width: 420px;
    background: rgba(30, 22, 19, 0.7);
    backdrop-filter: blur(28px);
    border: 1px solid rgba(251, 146, 60, 0.2);
    border-radius: 20px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 16px 36px rgba(0,0,0,0.5);
  }
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .cart-title { font-size: 17px; font-weight: 800; color: #FFF; }
  .cart-count { font-size: 12px; padding: 4px 10px; border-radius: 8px; background: rgba(255,255,255,0.08); color: #D6D3D1; }

  .cart-items {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 0;
  }
  .cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
  }
  .ci-name { font-size: 14px; font-weight: 700; color: #FFF; }
  .ci-sub { font-size: 12px; color: #A8A29E; }
  .ci-qty {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0,0,0,0.3);
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
  }
  .ci-price { font-size: 15px; font-weight: 800; color: #FB923C; }

  .summary-card {
    background: rgba(0,0,0,0.35);
    border-radius: 14px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .s-row { display: flex; justify-content: space-between; font-size: 13px; color: #A8A29E; }
  .s-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    margin-top: 4px;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .s-total-label { font-size: 16px; font-weight: 800; color: #FFF; }
  .s-total-val { font-size: 26px; font-weight: 900; color: #FB923C; text-shadow: 0 0 20px rgba(251, 146, 60, 0.3); }

  .cta-checkout {
    margin-top: 16px;
    background: linear-gradient(135deg, #FB923C, #EA580C);
    border: 1px solid rgba(255,255,255,0.4);
    box-shadow: 0 10px 24px rgba(234, 88, 12, 0.4), inset 0 1px 1px rgba(255,255,255,0.6);
    color: #FFF;
    padding: 18px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 800;
    text-align: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
</style>
</head>
<body>
  <div class="sidebar">
    <div class="brand">
      <div class="brand-logo">S</div>
      <div>
        <div class="brand-title">SAUDA POS</div>
        <div class="brand-sub">Truffle & Rose Gold</div>
      </div>
    </div>
    <div class="nav-item active">
      <div class="nav-icon">⚡</div>
      <span>POS Billing (F1)</span>
    </div>
    <div class="nav-item">
      <div class="nav-icon">📦</div>
      <span>Inventory / స్టాక్</span>
    </div>
    <div class="nav-item">
      <div class="nav-icon">📖</div>
      <span>Khata / ఉధార్</span>
    </div>
    <div class="nav-item">
      <div class="nav-icon">📊</div>
      <span>Analytics</span>
    </div>
    <div class="nav-item">
      <div class="nav-icon">⚙️</div>
      <span>Settings</span>
    </div>
  </div>

  <div class="main-content">
    <div class="pos-left">
      <div class="top-search-bar">
        <span style="font-size: 18px; color: #FB923C;">🔍</span>
        <input class="search-input" value="Scan Barcode or Search (F2)..." readonly />
        <span class="badge-60-30-10">60% Espresso | 30% Bronze Glass | 10% Rose-Gold</span>
      </div>

      <div class="categories-row">
        <div class="cat-pill active">⚡ All Groceries</div>
        <div class="cat-pill">🌾 Rice & Dals</div>
        <div class="cat-pill">🫒 Edible Oils</div>
        <div class="cat-pill">🧼 FMCG / Soaps</div>
        <div class="cat-pill">🍪 Biscuits & Snacks</div>
      </div>

      <div class="products-grid">
        <div class="product-card">
          <div>
            <div class="prod-icon-box">🌾</div>
            <div class="prod-name">Aashirvaad Atta 10kg</div>
            <div class="prod-meta">Whole Wheat • Stock: 42 bags</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹485.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>

        <div class="product-card">
          <div>
            <div class="prod-icon-box">🫒</div>
            <div class="prod-name">Freedom Sunflower Oil 1L</div>
            <div class="prod-meta">Refined Oil • Stock: 88 pouches</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹142.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>

        <div class="product-card">
          <div>
            <div class="prod-icon-box">🧂</div>
            <div class="prod-name">Tata Salt Vacuum 1kg</div>
            <div class="prod-meta">Iodized Salt • Stock: 120 pkts</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹28.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>

        <div class="product-card">
          <div>
            <div class="prod-icon-box">🍵</div>
            <div class="prod-name">Red Label Tea 500g</div>
            <div class="prod-meta">Natural Care • Stock: 24 pkts</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹260.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>

        <div class="product-card">
          <div>
            <div class="prod-icon-box">🧼</div>
            <div class="prod-name">Surf Excel Matic 2kg</div>
            <div class="prod-meta">Detergent Powder • Stock: 18 units</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹340.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>

        <div class="product-card">
          <div>
            <div class="prod-icon-box">🍯</div>
            <div class="prod-name">Dabur Honey 500g</div>
            <div class="prod-meta">Pure Honey • Stock: 15 bottles</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹199.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>
      </div>
    </div>

    <div class="cart-panel">
      <div class="cart-header">
        <div class="cart-title">Active Cart / కౌంటర్ బిల్</div>
        <div class="cart-count">4 Items</div>
      </div>

      <div class="cart-items">
        <div class="cart-item">
          <div>
            <div class="ci-name">Aashirvaad Atta 10kg</div>
            <div class="ci-sub">₹485.00 × 1</div>
          </div>
          <div class="ci-qty">1</div>
          <div class="ci-price">₹485.00</div>
        </div>

        <div class="cart-item">
          <div>
            <div class="ci-name">Freedom Sunflower Oil 1L</div>
            <div class="ci-sub">₹142.00 × 2</div>
          </div>
          <div class="ci-qty">2</div>
          <div class="ci-price">₹284.00</div>
        </div>

        <div class="cart-item">
          <div>
            <div class="ci-name">Tata Salt Vacuum 1kg</div>
            <div class="ci-sub">₹28.00 × 3</div>
          </div>
          <div class="ci-qty">3</div>
          <div class="ci-price">₹84.00</div>
        </div>

        <div class="cart-item">
          <div>
            <div class="ci-name">Surf Excel Matic 2kg</div>
            <div class="ci-sub">₹340.00 × 1</div>
          </div>
          <div class="ci-qty">1</div>
          <div class="ci-price">₹340.00</div>
        </div>
      </div>

      <div class="summary-card">
        <div class="s-row">
          <span>Items Subtotal</span>
          <span>₹1,193.00</span>
        </div>
        <div class="s-row">
          <span>Store GST (Included)</span>
          <span>₹48.50</span>
        </div>
        <div class="s-row" style="color: #FB923C;">
          <span>Special Discount</span>
          <span>- ₹13.00</span>
        </div>
        <div class="s-total-row">
          <div class="s-total-label">Grand Total</div>
          <div class="s-total-val">₹1,180.00</div>
        </div>
      </div>

      <div class="cta-checkout">
        <span>⚡ Quick Pay & Print (F12)</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  await page.setContent(htmlTheme03);
  const outPath03 = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_attractive_theme_03_espresso_truffle_rose_gold_preview.png';
  await page.screenshot({ path: outPath03 });
  console.log('Saved Theme 03 to', outPath03);

  // THEME 04: Nordic Charcoal Slate & Arctic Mint
  const htmlTheme04 = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  body {
    background: #0E1318 radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.08), transparent 45%),
                radial-gradient(circle at 10% 80%, rgba(6, 182, 212, 0.06), transparent 50%);
    color: #F8FAFC;
    height: 100vh;
    display: flex;
    overflow: hidden;
  }
  .sidebar {
    width: 260px;
    background: rgba(14, 23, 29, 0.65);
    backdrop-filter: blur(24px);
    border-right: 1px solid rgba(16, 185, 129, 0.18);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .brand-logo {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(6, 182, 212, 0.15));
    border: 1px solid rgba(16, 185, 129, 0.4);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    color: #10B981;
  }
  .brand-title { font-size: 18px; font-weight: 700; letter-spacing: 0.05em; color: #FFF; }
  .brand-sub { font-size: 11px; color: #10B981; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #94A3B8;
    transition: all 0.2s;
  }
  .nav-item.active {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #FFF;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(16, 185, 129, 0.15);
  }
  .nav-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  .nav-item.active .nav-icon {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(6, 182, 212, 0.2));
    border-color: rgba(16, 185, 129, 0.5);
    color: #10B981;
  }

  .main-content {
    flex: 1;
    padding: 24px;
    display: flex;
    gap: 20px;
  }
  .pos-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .top-search-bar {
    background: rgba(19, 29, 36, 0.65);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(16, 185, 129, 0.22);
    border-radius: 16px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  }
  .search-input {
    background: transparent;
    border: none;
    color: #FFF;
    font-size: 15px;
    outline: none;
    flex: 1;
  }
  .badge-60-30-10 {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #10B981;
    letter-spacing: 0.05em;
  }

  .categories-row {
    display: flex;
    gap: 12px;
  }
  .cat-pill {
    padding: 10px 18px;
    border-radius: 12px;
    background: rgba(19, 29, 36, 0.6);
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 13px;
    font-weight: 600;
    color: #94A3B8;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cat-pill.active {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.15));
    border-color: rgba(16, 185, 129, 0.45);
    color: #10B981;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    flex: 1;
  }
  .product-card {
    background: rgba(19, 29, 36, 0.65);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.08), 0 8px 20px rgba(0,0,0,0.25);
    position: relative;
    overflow: hidden;
  }
  .product-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent);
  }
  .prod-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.1));
    border: 1px solid rgba(16, 185, 129, 0.35);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin-bottom: 12px;
  }
  .prod-name { font-size: 15px; font-weight: 700; color: #FFF; margin-bottom: 4px; }
  .prod-meta { font-size: 12px; color: #94A3B8; }
  .prod-price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .prod-price { font-size: 18px; font-weight: 800; color: #10B981; }
  .prod-add-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #10B981;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 18px;
  }

  .cart-panel {
    width: 420px;
    background: rgba(14, 23, 29, 0.72);
    backdrop-filter: blur(28px);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 20px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 16px 36px rgba(0,0,0,0.5);
  }
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .cart-title { font-size: 17px; font-weight: 800; color: #FFF; }
  .cart-count { font-size: 12px; padding: 4px 10px; border-radius: 8px; background: rgba(255,255,255,0.08); color: #94A3B8; }

  .cart-items {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 0;
  }
  .cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
  }
  .ci-name { font-size: 14px; font-weight: 700; color: #FFF; }
  .ci-sub { font-size: 12px; color: #94A3B8; }
  .ci-qty {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0,0,0,0.3);
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
  }
  .ci-price { font-size: 15px; font-weight: 800; color: #10B981; }

  .summary-card {
    background: rgba(0,0,0,0.35);
    border-radius: 14px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .s-row { display: flex; justify-content: space-between; font-size: 13px; color: #94A3B8; }
  .s-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    margin-top: 4px;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .s-total-label { font-size: 16px; font-weight: 800; color: #FFF; }
  .s-total-val { font-size: 26px; font-weight: 900; color: #10B981; text-shadow: 0 0 20px rgba(16, 185, 129, 0.35); }

  .cta-checkout {
    margin-top: 16px;
    background: linear-gradient(135deg, #10B981, #059669);
    border: 1px solid rgba(255,255,255,0.4);
    box-shadow: 0 10px 24px rgba(16, 185, 129, 0.4), inset 0 1px 1px rgba(255,255,255,0.6);
    color: #FFF;
    padding: 18px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 800;
    text-align: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
</style>
</head>
<body>
  <div class="sidebar">
    <div class="brand">
      <div class="brand-logo">S</div>
      <div>
        <div class="brand-title">SAUDA POS</div>
        <div class="brand-sub">Nordic Mint</div>
      </div>
    </div>
    <div class="nav-item active">
      <div class="nav-icon">⚡</div>
      <span>POS Billing (F1)</span>
    </div>
    <div class="nav-item">
      <div class="nav-icon">📦</div>
      <span>Inventory / స్టాక్</span>
    </div>
    <div class="nav-item">
      <div class="nav-icon">📖</div>
      <span>Khata / ఉధార్</span>
    </div>
    <div class="nav-item">
      <div class="nav-icon">📊</div>
      <span>Analytics</span>
    </div>
    <div class="nav-item">
      <div class="nav-icon">⚙️</div>
      <span>Settings</span>
    </div>
  </div>

  <div class="main-content">
    <div class="pos-left">
      <div class="top-search-bar">
        <span style="font-size: 18px; color: #10B981;">🔍</span>
        <input class="search-input" value="Scan Barcode or Search (F2)..." readonly />
        <span class="badge-60-30-10">60% Charcoal | 30% Arctic Glass | 10% Mint</span>
      </div>

      <div class="categories-row">
        <div class="cat-pill active">⚡ All Groceries</div>
        <div class="cat-pill">🌾 Rice & Dals</div>
        <div class="cat-pill">🫒 Edible Oils</div>
        <div class="cat-pill">🧼 FMCG / Soaps</div>
        <div class="cat-pill">🍪 Biscuits & Snacks</div>
      </div>

      <div class="products-grid">
        <div class="product-card">
          <div>
            <div class="prod-icon-box">🌾</div>
            <div class="prod-name">Aashirvaad Atta 10kg</div>
            <div class="prod-meta">Whole Wheat • Stock: 42 bags</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹485.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>

        <div class="product-card">
          <div>
            <div class="prod-icon-box">🫒</div>
            <div class="prod-name">Freedom Sunflower Oil 1L</div>
            <div class="prod-meta">Refined Oil • Stock: 88 pouches</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹142.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>

        <div class="product-card">
          <div>
            <div class="prod-icon-box">🧂</div>
            <div class="prod-name">Tata Salt Vacuum 1kg</div>
            <div class="prod-meta">Iodized Salt • Stock: 120 pkts</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹28.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>

        <div class="product-card">
          <div>
            <div class="prod-icon-box">🍵</div>
            <div class="prod-name">Red Label Tea 500g</div>
            <div class="prod-meta">Natural Care • Stock: 24 pkts</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹260.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>

        <div class="product-card">
          <div>
            <div class="prod-icon-box">🧼</div>
            <div class="prod-name">Surf Excel Matic 2kg</div>
            <div class="prod-meta">Detergent Powder • Stock: 18 units</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹340.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>

        <div class="product-card">
          <div>
            <div class="prod-icon-box">🍯</div>
            <div class="prod-name">Dabur Honey 500g</div>
            <div class="prod-meta">Pure Honey • Stock: 15 bottles</div>
          </div>
          <div class="prod-price-row">
            <div class="prod-price">₹199.00</div>
            <div class="prod-add-btn">+</div>
          </div>
        </div>
      </div>
    </div>

    <div class="cart-panel">
      <div class="cart-header">
        <div class="cart-title">Active Cart / కౌంటర్ బిల్</div>
        <div class="cart-count">4 Items</div>
      </div>

      <div class="cart-items">
        <div class="cart-item">
          <div>
            <div class="ci-name">Aashirvaad Atta 10kg</div>
            <div class="ci-sub">₹485.00 × 1</div>
          </div>
          <div class="ci-qty">1</div>
          <div class="ci-price">₹485.00</div>
        </div>

        <div class="cart-item">
          <div>
            <div class="ci-name">Freedom Sunflower Oil 1L</div>
            <div class="ci-sub">₹142.00 × 2</div>
          </div>
          <div class="ci-qty">2</div>
          <div class="ci-price">₹284.00</div>
        </div>

        <div class="cart-item">
          <div>
            <div class="ci-name">Tata Salt Vacuum 1kg</div>
            <div class="ci-sub">₹28.00 × 3</div>
          </div>
          <div class="ci-qty">3</div>
          <div class="ci-price">₹84.00</div>
        </div>

        <div class="cart-item">
          <div>
            <div class="ci-name">Surf Excel Matic 2kg</div>
            <div class="ci-sub">₹340.00 × 1</div>
          </div>
          <div class="ci-qty">1</div>
          <div class="ci-price">₹340.00</div>
        </div>
      </div>

      <div class="summary-card">
        <div class="s-row">
          <span>Items Subtotal</span>
          <span>₹1,193.00</span>
        </div>
        <div class="s-row">
          <span>Store GST (Included)</span>
          <span>₹48.50</span>
        </div>
        <div class="s-row" style="color: #10B981;">
          <span>Special Discount</span>
          <span>- ₹13.00</span>
        </div>
        <div class="s-total-row">
          <div class="s-total-label">Grand Total</div>
          <div class="s-total-val">₹1,180.00</div>
        </div>
      </div>

      <div class="cta-checkout">
        <span>⚡ Quick Pay & Print (F12)</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  await page.setContent(htmlTheme04);
  const outPath04 = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_attractive_theme_04_nordic_aurora_mint_preview.png';
  await page.screenshot({ path: outPath04 });
  console.log('Saved Theme 04 to', outPath04);

  await browser.close();
}

renderThemes().catch(err => {
  console.error(err);
  process.exit(1);
});
