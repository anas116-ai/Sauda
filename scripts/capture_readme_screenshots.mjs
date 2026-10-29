import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('docs/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to Sauda app in English...');
  await page.goto('http://localhost:5173/');
  
  // Force English from the very beginning
  await page.evaluate(() => {
    localStorage.setItem('sauda_lang', 'en');
    localStorage.removeItem('sauda_gateway_dismissed'); // Ensure gateway is visible for hero shot
  });
  await page.reload();
  await page.waitForTimeout(2000);

  // 1. Capture Landing / Gateway Screen (in pure English)
  console.log('Capturing Hero Gateway (English)...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_hero_gateway.png') });

  // Now dismiss gateway to enter the store dashboard in English
  await page.evaluate(() => {
    localStorage.setItem('sauda_gateway_dismissed', 'true');
    localStorage.setItem('sauda_current_shop_id', 'demo-shop-001');
    localStorage.setItem('sauda_lang', 'en');
  });
  await page.reload();
  await page.waitForTimeout(2000);

  // 2. Dashboard in English
  console.log('Capturing Dashboard (English)...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_store_dashboard.png') });

  // 3. POS Billing in English
  console.log('Capturing POS Billing (English)...');
  const posBtn = page.locator('[data-testid="nav-pos"]').first();
  if (await posBtn.isVisible()) {
    await posBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_pos_terminal.png') });
  }

  // 4. Products Catalog in English
  console.log('Capturing Products Catalog (English)...');
  const prodBtn = page.locator('[data-testid="nav-products"]').first();
  if (await prodBtn.isVisible()) {
    await prodBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_product_catalog.png') });
  }

  // 5. Khata Ledger in English
  console.log('Capturing Khata Ledger (English)...');
  const khataBtn = page.locator('[data-testid="nav-khata"]').first();
  if (await khataBtn.isVisible()) {
    await khataBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_khata_ledger.png') });
  }

  // 6. Balance Sheet in English
  console.log('Capturing Balance Sheet (English)...');
  const bsBtn = page.locator('[data-testid="book-balancesheet"]').first();
  if (await bsBtn.isVisible()) {
    await bsBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_balance_sheet.png') });
  }

  await browser.close();
  console.log('✅ All screenshots captured in English successfully in docs/screenshots!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
