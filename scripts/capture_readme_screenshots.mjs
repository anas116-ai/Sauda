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

  console.log('Navigating to Sauda app...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1500);

  // 1. Capture Landing / Gateway Screen
  console.log('Capturing Hero Gateway...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_hero_gateway.png') });

  // Dismiss gateway to get into dashboard
  await page.evaluate(() => {
    localStorage.setItem('sauda_gateway_dismissed', 'true');
    localStorage.setItem('sauda_current_shop_id', 'demo-shop-001');
    localStorage.setItem('sauda_lang', 'te'); // Bilingual Telugu / English
  });
  await page.reload();
  await page.waitForTimeout(2000);

  // 2. Dashboard
  console.log('Capturing Dashboard...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_store_dashboard.png') });

  // 3. POS Billing
  console.log('Capturing POS Billing...');
  const posBtn = page.locator('[data-testid="nav-pos"]').first();
  if (await posBtn.isVisible()) {
    await posBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_pos_terminal.png') });
  }

  // 4. Products Catalog
  console.log('Capturing Products Catalog...');
  const prodBtn = page.locator('[data-testid="nav-products"]').first();
  if (await prodBtn.isVisible()) {
    await prodBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_product_catalog.png') });
  }

  // 5. Khata Ledger
  console.log('Capturing Khata Ledger...');
  const khataBtn = page.locator('[data-testid="nav-khata"]').first();
  if (await khataBtn.isVisible()) {
    await khataBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_khata_ledger.png') });
  }

  // 6. Balance Sheet & GST
  console.log('Capturing Balance Sheet...');
  const bsBtn = page.locator('[data-testid="book-balancesheet"]').first();
  if (await bsBtn.isVisible()) {
    await bsBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_balance_sheet.png') });
  }

  await browser.close();
  console.log('✅ All screenshots captured successfully in docs/screenshots!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
