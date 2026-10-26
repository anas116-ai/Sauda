import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/shaik/.gemini/antigravity/brain/b3cacd93-2903-4fbc-b703-de35ac042d13';
const BRANDING_DIR = 'c:/Project/Lekvya/assets/branding';

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to Sauda at http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Dashboard (Default tab)
  await page.screenshot({ path: path.join(BRANDING_DIR, 'sauda_dashboard_live.png') });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sauda_dashboard_live.png') });
  console.log('✓ Captured Sauda Cool Classic Dashboard');

  // 2. Test Command Palette launcher (Ctrl+K)
  await page.keyboard.press('Control+KeyK');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(BRANDING_DIR, 'sauda_command_palette_live.png') });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sauda_command_palette_live.png') });
  console.log('✓ Captured Sauda Linear/Stripe-tier Command Palette (Ctrl+K)');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 3. POS Billing Screen
  await page.click('button:has-text("POS బిల్లింగ్"), button:has-text("Fast Billing")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(BRANDING_DIR, 'sauda_pos_live.png') });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sauda_pos_live.png') });
  console.log('✓ Captured Sauda Cool Classic POS Billing');

  // 4. Products Inventory Screen
  await page.click('button:has-text("ఇన్వెంటరీ"), button:has-text("Inventory")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(BRANDING_DIR, 'sauda_products_live.png') });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sauda_products_live.png') });
  console.log('✓ Captured Sauda Cool Classic Inventory Catalog');

  // 5. Khata Ledger Screen
  await page.click('button:has-text("ఖాతా లెడ్జర్"), button:has-text("Khata Ledger")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(BRANDING_DIR, 'sauda_khata_live.png') });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sauda_khata_live.png') });
  console.log('✓ Captured Sauda Cool Classic Customer Khata');

  // 6. Settings Screen
  await page.click('button:has-text("సెట్టింగ్స్"), button:has-text("Settings")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(BRANDING_DIR, 'sauda_settings_live.png') });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sauda_settings_live.png') });
  console.log('✓ Captured Sauda Cool Classic Shop Settings');

  await browser.close();

  if (errors.length > 0) {
    console.error('❌ Browser errors detected:', errors);
    process.exit(1);
  } else {
    console.log('💎 ALL 6 SAUDA AWWWARDS-TIER SCREENS VERIFIED WITH 0 CONSOLE ERRORS!');
  }
}

captureScreenshots().catch(err => {
  console.error(err);
  process.exit(1);
});
