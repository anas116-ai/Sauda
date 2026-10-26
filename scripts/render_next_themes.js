import { chromium } from 'playwright';

async function generateNextThemes() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  // ==========================================
  // THEME 05: Royal Malachite Obsidian & 24K Sovereign Gold
  // ==========================================
  const htmlTheme05 = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  body {
    background: #03150D radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.12), transparent 45%),
                radial-gradient(circle at 15% 85%, rgba(234, 179, 8, 0.08), transparent 50%);
    color: #F8FAFC;
    height: 100vh;
    display: flex;
    overflow: hidden;
  }
  .sidebar {
    width: 260px;
    background: rgba(6, 26, 18, 0.75);
    backdrop-filter: blur(28px);
    border-right: 1px solid rgba(234, 179, 8, 0.22);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: 4px 0 24px rgba(0,0,0,0.5);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .brand-logo {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.35), rgba(16, 185, 129, 0.2));
    border: 1px solid rgba(234, 179, 8, 0.6);
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.6), 0 8px 18px rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 900;
    color: #EAB308;
    text-shadow: 0 0 12px rgba(234, 179, 8, 0.6);
  }
  .brand-title { font-size: 19px; font-weight: 800; letter-spacing: 0.06em; color: #FFF; }
  .brand-sub { font-size: 11px; color: #EAB308; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #A7F3D0;
    transition: all 0.2s;
  }
  .nav-item.active {
    background: rgba(234, 179, 8, 0.16);
    border: 1px solid rgba(234, 179, 8, 0.45);
    color: #FFF;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(234, 179, 8, 0.2);
  }
  .nav-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
  }
  .nav-item.active .nav-icon {
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.5), rgba(16, 185, 129, 0.3));
    border-color: rgba(234, 179, 8, 0.7);
    color: #EAB308;
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
    background: rgba(8, 38, 26, 0.7);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(234, 179, 8, 0.25);
    border-radius: 16px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.35);
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
    padding: 5px 12px;
    border-radius: 9px;
    background: rgba(234, 179, 8, 0.2);
    border: 1px solid rgba(234, 179, 8, 0.5);
    color: #FACC15;
    letter-spacing: 0.05em;
  }

  .categories-row {
    display: flex;
    gap: 12px;
  }
  .cat-pill {
    padding: 10px 18px;
    border-radius: 12px;
    background: rgba(8, 38, 26, 0.65);
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 13px;
    font-weight: 600;
    color: #A7F3D0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cat-pill.active {
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.3), rgba(16, 185, 129, 0.2));
    border-color: rgba(234, 179, 8, 0.5);
    color: #FACC15;
    box-shadow: 0 4px 14px rgba(234, 179, 8, 0.2);
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    flex: 1;
  }
  .product-card {
    background: rgba(8, 38, 26, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 10px 24px rgba(0,0,0,0.35);
    position: relative;
    overflow: hidden;
  }
  .product-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(234, 179, 8, 0.6), transparent);
  }
  .prod-icon-box {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(16, 185, 129, 0.15));
    border: 1px solid rgba(234, 179, 8, 0.4);
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 12px;
  }
  .prod-name { font-size: 15px; font-weight: 700; color: #FFF; margin-bottom: 4px; }
  .prod-meta { font-size: 12px; color: #6EE7B7; }
  .prod-price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .prod-price { font-size: 19px; font-weight: 900; color: #FACC15; text-shadow: 0 0 12px rgba(250, 204, 21, 0.4); }
  .prod-add-btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(234, 179, 8, 0.25);
    border: 1px solid rgba(234, 179, 8, 0.5);
    color: #FACC15;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 18px;
    box-shadow: 0 2px 8px rgba(234, 179, 8, 0.25);
  }

  .cart-panel {
    width: 420px;
    background: rgba(6, 26, 18, 0.8);
    backdrop-filter: blur(32px);
    border: 1px solid rgba(234, 179, 8, 0.28);
    border-radius: 22px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.18), 0 20px 48px rgba(0,0,0,0.65);
  }
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .cart-title { font-size: 18px; font-weight: 800; color: #FFF; }
  .cart-count { font-size: 12px; padding: 4px 12px; border-radius: 8px; background: rgba(234, 179, 8, 0.2); border: 1px solid rgba(234, 179, 8, 0.35); color: #FACC15; font-weight: 700; }

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
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .ci-name { font-size: 14px; font-weight: 700; color: #FFF; }
  .ci-sub { font-size: 12px; color: #6EE7B7; }
  .ci-qty {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0,0,0,0.4);
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
  }
  .ci-price { font-size: 15px; font-weight: 800; color: #FACC15; }

  .summary-card {
    background: rgba(0,0,0,0.45);
    border-radius: 14px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .s-row { display: flex; justify-content: space-between; font-size: 13px; color: #6EE7B7; }
  .s-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    margin-top: 4px;
    border-top: 1px solid rgba(255,255,255,0.12);
  }
  .s-total-label { font-size: 16px; font-weight: 800; color: #FFF; }
  .s-total-val { font-size: 28px; font-weight: 900; color: #FACC15; text-shadow: 0 0 24px rgba(250, 204, 21, 0.45); }

  .cta-checkout {
    margin-top: 16px;
    background: linear-gradient(135deg, #EAB308, #CA8A04);
    border: 1px solid rgba(255,255,255,0.5);
    box-shadow: 0 10px 28px rgba(234, 179, 8, 0.45), inset 0 1px 2px rgba(255,255,255,0.7);
    color: #03150D;
    padding: 18px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 900;
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
      <div class="brand-logo">👑</div>
      <div>
        <div class="brand-title">SAUDA POS</div>
        <div class="brand-sub">Malachite & 24K Gold</div>
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
        <span style="font-size: 18px; color: #EAB308;">🔍</span>
        <input class="search-input" value="Scan Barcode or Search (F2)..." readonly />
        <span class="badge-60-30-10">60% Malachite Obsidian | 30% Smoked Jade Glass | 10% 24K Gold</span>
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
        <div class="s-row" style="color: #FACC15;">
          <span>Special Discount</span>
          <span>- ₹13.00</span>
        </div>
        <div class="s-total-row">
          <div class="s-total-label">Grand Total</div>
          <div class="s-total-val">₹1,180.00</div>
        </div>
      </div>

      <div class="cta-checkout">
        <span>👑 Pay & Print Bill (F12)</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  await page.setContent(htmlTheme05);
  const outPath05 = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_attractive_theme_05_malachite_24k_gold.png';
  await page.screenshot({ path: outPath05 });
  console.log('Saved Theme 05 to', outPath05);

  // ==========================================
  // THEME 06: Swiss Deep Cobalt & Arctic Diamond
  // ==========================================
  const htmlTheme06 = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  body {
    background: #060B14 radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.12), transparent 45%),
                radial-gradient(circle at 15% 85%, rgba(37, 99, 235, 0.1), transparent 50%);
    color: #F8FAFC;
    height: 100vh;
    display: flex;
    overflow: hidden;
  }
  .sidebar {
    width: 260px;
    background: rgba(9, 17, 32, 0.75);
    backdrop-filter: blur(28px);
    border-right: 1px solid rgba(56, 189, 248, 0.2);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: 4px 0 24px rgba(0,0,0,0.5);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .brand-logo {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.35), rgba(37, 99, 235, 0.2));
    border: 1px solid rgba(56, 189, 248, 0.6);
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.6), 0 8px 18px rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 900;
    color: #38BDF8;
    text-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
  }
  .brand-title { font-size: 19px; font-weight: 800; letter-spacing: 0.06em; color: #FFF; }
  .brand-sub { font-size: 11px; color: #38BDF8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #BAE6FD;
    transition: all 0.2s;
  }
  .nav-item.active {
    background: rgba(56, 189, 248, 0.16);
    border: 1px solid rgba(56, 189, 248, 0.45);
    color: #FFF;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(56, 189, 248, 0.2);
  }
  .nav-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
  }
  .nav-item.active .nav-icon {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.5), rgba(37, 99, 235, 0.3));
    border-color: rgba(56, 189, 248, 0.7);
    color: #38BDF8;
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
    background: rgba(13, 25, 48, 0.7);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 16px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.35);
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
    padding: 5px 12px;
    border-radius: 9px;
    background: rgba(56, 189, 248, 0.2);
    border: 1px solid rgba(56, 189, 248, 0.5);
    color: #38BDF8;
    letter-spacing: 0.05em;
  }

  .categories-row {
    display: flex;
    gap: 12px;
  }
  .cat-pill {
    padding: 10px 18px;
    border-radius: 12px;
    background: rgba(13, 25, 48, 0.65);
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 13px;
    font-weight: 600;
    color: #BAE6FD;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cat-pill.active {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.2));
    border-color: rgba(56, 189, 248, 0.5);
    color: #38BDF8;
    box-shadow: 0 4px 14px rgba(56, 189, 248, 0.2);
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    flex: 1;
  }
  .product-card {
    background: rgba(13, 25, 48, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 10px 24px rgba(0,0,0,0.35);
    position: relative;
    overflow: hidden;
  }
  .product-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.6), transparent);
  }
  .prod-icon-box {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(37, 99, 235, 0.15));
    border: 1px solid rgba(56, 189, 248, 0.4);
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 12px;
  }
  .prod-name { font-size: 15px; font-weight: 700; color: #FFF; margin-bottom: 4px; }
  .prod-meta { font-size: 12px; color: #7DD3FC; }
  .prod-price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .prod-price { font-size: 19px; font-weight: 900; color: #38BDF8; text-shadow: 0 0 12px rgba(56, 189, 248, 0.4); }
  .prod-add-btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(56, 189, 248, 0.25);
    border: 1px solid rgba(56, 189, 248, 0.5);
    color: #38BDF8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 18px;
    box-shadow: 0 2px 8px rgba(56, 189, 248, 0.25);
  }

  .cart-panel {
    width: 420px;
    background: rgba(9, 17, 32, 0.8);
    backdrop-filter: blur(32px);
    border: 1px solid rgba(56, 189, 248, 0.28);
    border-radius: 22px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.18), 0 20px 48px rgba(0,0,0,0.65);
  }
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .cart-title { font-size: 18px; font-weight: 800; color: #FFF; }
  .cart-count { font-size: 12px; padding: 4px 12px; border-radius: 8px; background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.35); color: #38BDF8; font-weight: 700; }

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
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .ci-name { font-size: 14px; font-weight: 700; color: #FFF; }
  .ci-sub { font-size: 12px; color: #7DD3FC; }
  .ci-qty {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0,0,0,0.4);
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
  }
  .ci-price { font-size: 15px; font-weight: 800; color: #38BDF8; }

  .summary-card {
    background: rgba(0,0,0,0.45);
    border-radius: 14px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .s-row { display: flex; justify-content: space-between; font-size: 13px; color: #7DD3FC; }
  .s-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    margin-top: 4px;
    border-top: 1px solid rgba(255,255,255,0.12);
  }
  .s-total-label { font-size: 16px; font-weight: 800; color: #FFF; }
  .s-total-val { font-size: 28px; font-weight: 900; color: #38BDF8; text-shadow: 0 0 24px rgba(56, 189, 248, 0.45); }

  .cta-checkout {
    margin-top: 16px;
    background: linear-gradient(135deg, #0284C7, #2563EB);
    border: 1px solid rgba(255,255,255,0.5);
    box-shadow: 0 10px 28px rgba(37, 99, 235, 0.45), inset 0 1px 2px rgba(255,255,255,0.7);
    color: #FFF;
    padding: 18px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 900;
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
      <div class="brand-logo">💎</div>
      <div>
        <div class="brand-title">SAUDA POS</div>
        <div class="brand-sub">Cobalt & Arctic Diamond</div>
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
        <span style="font-size: 18px; color: #38BDF8;">🔍</span>
        <input class="search-input" value="Scan Barcode or Search (F2)..." readonly />
        <span class="badge-60-30-10">60% Deep Cobalt Slate | 30% Sapphire Optical Glass | 10% Diamond Ice</span>
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
        <div class="s-row" style="color: #38BDF8;">
          <span>Special Discount</span>
          <span>- ₹13.00</span>
        </div>
        <div class="s-total-row">
          <div class="s-total-label">Grand Total</div>
          <div class="s-total-val">₹1,180.00</div>
        </div>
      </div>

      <div class="cta-checkout">
        <span>⚡ Quick Pay & Print Bill (F12)</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  await page.setContent(htmlTheme06);
  const outPath06 = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_attractive_theme_06_swiss_cobalt_diamond.png';
  await page.screenshot({ path: outPath06 });
  console.log('Saved Theme 06 to', outPath06);

  // ==========================================
  // THEME 07: Royal Velvet Indigo & Golden Topaz
  // ==========================================
  const htmlTheme07 = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  body {
    background: #090A1A radial-gradient(circle at 85% 15%, rgba(245, 158, 11, 0.12), transparent 45%),
                radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.1), transparent 50%);
    color: #F8FAFC;
    height: 100vh;
    display: flex;
    overflow: hidden;
  }
  .sidebar {
    width: 260px;
    background: rgba(15, 17, 38, 0.75);
    backdrop-filter: blur(28px);
    border-right: 1px solid rgba(245, 158, 11, 0.22);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: 4px 0 24px rgba(0,0,0,0.5);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .brand-logo {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(99, 102, 241, 0.2));
    border: 1px solid rgba(245, 158, 11, 0.6);
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.6), 0 8px 18px rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 900;
    color: #F59E0B;
    text-shadow: 0 0 12px rgba(245, 158, 11, 0.6);
  }
  .brand-title { font-size: 19px; font-weight: 800; letter-spacing: 0.06em; color: #FFF; }
  .brand-sub { font-size: 11px; color: #F59E0B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #C7D2FE;
    transition: all 0.2s;
  }
  .nav-item.active {
    background: rgba(245, 158, 11, 0.16);
    border: 1px solid rgba(245, 158, 11, 0.45);
    color: #FFF;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(245, 158, 11, 0.2);
  }
  .nav-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
  }
  .nav-item.active .nav-icon {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.5), rgba(99, 102, 241, 0.3));
    border-color: rgba(245, 158, 11, 0.7);
    color: #F59E0B;
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
    background: rgba(22, 25, 54, 0.7);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 16px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.35);
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
    padding: 5px 12px;
    border-radius: 9px;
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid rgba(245, 158, 11, 0.5);
    color: #FBBF24;
    letter-spacing: 0.05em;
  }

  .categories-row {
    display: flex;
    gap: 12px;
  }
  .cat-pill {
    padding: 10px 18px;
    border-radius: 12px;
    background: rgba(22, 25, 54, 0.65);
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 13px;
    font-weight: 600;
    color: #C7D2FE;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cat-pill.active {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(99, 102, 241, 0.2));
    border-color: rgba(245, 158, 11, 0.5);
    color: #FBBF24;
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.2);
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    flex: 1;
  }
  .product-card {
    background: rgba(22, 25, 54, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 10px 24px rgba(0,0,0,0.35);
    position: relative;
    overflow: hidden;
  }
  .product-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.6), transparent);
  }
  .prod-icon-box {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(99, 102, 241, 0.15));
    border: 1px solid rgba(245, 158, 11, 0.4);
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 12px;
  }
  .prod-name { font-size: 15px; font-weight: 700; color: #FFF; margin-bottom: 4px; }
  .prod-meta { font-size: 12px; color: #A5B4FC; }
  .prod-price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .prod-price { font-size: 19px; font-weight: 900; color: #FBBF24; text-shadow: 0 0 12px rgba(251, 191, 36, 0.4); }
  .prod-add-btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(245, 158, 11, 0.25);
    border: 1px solid rgba(245, 158, 11, 0.5);
    color: #FBBF24;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 18px;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
  }

  .cart-panel {
    width: 420px;
    background: rgba(15, 17, 38, 0.8);
    backdrop-filter: blur(32px);
    border: 1px solid rgba(245, 158, 11, 0.28);
    border-radius: 22px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.18), 0 20px 48px rgba(0,0,0,0.65);
  }
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .cart-title { font-size: 18px; font-weight: 800; color: #FFF; }
  .cart-count { font-size: 12px; padding: 4px 12px; border-radius: 8px; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.35); color: #FBBF24; font-weight: 700; }

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
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .ci-name { font-size: 14px; font-weight: 700; color: #FFF; }
  .ci-sub { font-size: 12px; color: #A5B4FC; }
  .ci-qty {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0,0,0,0.4);
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
  }
  .ci-price { font-size: 15px; font-weight: 800; color: #FBBF24; }

  .summary-card {
    background: rgba(0,0,0,0.45);
    border-radius: 14px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .s-row { display: flex; justify-content: space-between; font-size: 13px; color: #A5B4FC; }
  .s-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    margin-top: 4px;
    border-top: 1px solid rgba(255,255,255,0.12);
  }
  .s-total-label { font-size: 16px; font-weight: 800; color: #FFF; }
  .s-total-val { font-size: 28px; font-weight: 900; color: #FBBF24; text-shadow: 0 0 24px rgba(251, 191, 36, 0.45); }

  .cta-checkout {
    margin-top: 16px;
    background: linear-gradient(135deg, #F59E0B, #D97706);
    border: 1px solid rgba(255,255,255,0.5);
    box-shadow: 0 10px 28px rgba(245, 158, 11, 0.45), inset 0 1px 2px rgba(255,255,255,0.7);
    color: #090A1A;
    padding: 18px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 900;
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
      <div class="brand-logo">✨</div>
      <div>
        <div class="brand-title">SAUDA POS</div>
        <div class="brand-sub">Indigo & Golden Topaz</div>
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
        <span style="font-size: 18px; color: #F59E0B;">🔍</span>
        <input class="search-input" value="Scan Barcode or Search (F2)..." readonly />
        <span class="badge-60-30-10">60% Velvet Indigo | 30% Smoked Crystal Glass | 10% Golden Topaz</span>
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
        <div class="s-row" style="color: #FBBF24;">
          <span>Special Discount</span>
          <span>- ₹13.00</span>
        </div>
        <div class="s-total-row">
          <div class="s-total-label">Grand Total</div>
          <div class="s-total-val">₹1,180.00</div>
        </div>
      </div>

      <div class="cta-checkout">
        <span>✨ Pay & Print Bill (F12)</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  await page.setContent(htmlTheme07);
  const outPath07 = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13/sauda_attractive_theme_07_indigo_golden_topaz.png';
  await page.screenshot({ path: outPath07 });
  console.log('Saved Theme 07 to', outPath07);

  await browser.close();
}

generateNextThemes().catch(err => {
  console.error(err);
  process.exit(1);
});
