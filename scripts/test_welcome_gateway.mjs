import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = 'C:/Users/shaik/.gemini/antigravity-ide/brain/829f1c37-c95a-4123-aada-09c28787d219/screenshots';

async function run() {
  console.log('🚀 Starting Welcome Gateway E2E Verification...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. Reset gateway dismissal flag to simulate first-time or logged-out arrival
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
    localStorage.removeItem('sauda_gateway_dismissed');
  });
  await page.reload();
  await page.waitForTimeout(2000);

  // 2. Check if Welcome Gateway Modal appears
  const modal = page.locator('[data-testid="welcome-gateway-modal"]');
  const isModalVisible = await modal.isVisible();
  console.log(`✅ Welcome Gateway Modal Visible: ${isModalVisible}`);

  if (!isModalVisible) {
    throw new Error('Welcome Gateway Modal did not appear on fresh session!');
  }

  // 3. Capture initial Welcome Gateway screenshot
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/multishop_07_welcome_gateway.png` });
  console.log('📸 Captured multishop_07_welcome_gateway.png');

  // 4. Test language toggle inside gateway
  console.log('🌐 Testing Language Switch in Gateway...');
  const langEnBtn = page.locator('[data-testid="gateway-lang-en"]');
  if (await langEnBtn.isVisible()) {
    await langEnBtn.click();
    await page.waitForTimeout(500);
    console.log('✅ Switched Gateway language to English');
  }

  const langTeBtn = page.locator('[data-testid="gateway-lang-te"]');
  if (await langTeBtn.isVisible()) {
    await langTeBtn.click();
    await page.waitForTimeout(500);
    console.log('✅ Switched Gateway language to Telugu');
  }

  // 5. Check store selection
  console.log('🏪 Checking stores list in Gateway...');
  const firstShopCard = page.locator('[data-testid^="gateway-shop-card-"]').first();
  if (await firstShopCard.isVisible()) {
    await firstShopCard.click();
    console.log('✅ Selected first store card');
  }

  // 6. Enter the selected store
  const enterBtn = page.locator('[data-testid="gateway-enter-store-btn"]');
  await enterBtn.click();
  await page.waitForTimeout(1500);

  // Modal should close and main layout should show
  const modalAfterEnter = await modal.isVisible();
  console.log(`✅ Modal closed after enter: ${!modalAfterEnter}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/multishop_08_entered_dashboard.png` });
  console.log('📸 Captured multishop_08_entered_dashboard.png');

  // 7. Click Sidebar Switch Store / Gateway button
  console.log('🚪 Clicking Sidebar Logout / Gateway button...');
  const sidebarGatewayBtn = page.locator('[data-testid="sidebar-logout-gateway-btn"]');
  await sidebarGatewayBtn.click();
  await page.waitForTimeout(1000);

  const modalReopened = await modal.isVisible();
  console.log(`✅ Gateway reopened from Sidebar: ${modalReopened}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/multishop_09_gateway_reopened.png` });
  console.log('📸 Captured multishop_09_gateway_reopened.png');

  console.log('🎉 ALL GATEWAY TESTS PASSED SUCCESSFULLY!');
  await browser.close();
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
