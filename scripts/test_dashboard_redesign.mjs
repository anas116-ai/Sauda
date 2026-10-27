import { chromium } from 'playwright';

const SCREENSHOTS_DIR = 'C:/Users/shaik/.gemini/antigravity-ide/brain/829f1c37-c95a-4123-aada-09c28787d219/screenshots';

async function run() {
  console.log('🚀 Testing Redesigned White-Canvas Dashboard...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();

  // Set gateway dismissed so we land directly on Dashboard
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
    localStorage.setItem('sauda_gateway_dismissed', 'true');
  });
  await page.reload();
  await page.waitForTimeout(2000);

  // Take full dashboard screenshot
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/dashboard_white_fullview.png`, fullPage: true });
  console.log('📸 Captured dashboard_white_fullview.png');

  // Take top hero & stats screenshot
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/dashboard_white_hero.png` });
  console.log('📸 Captured dashboard_white_hero.png');

  // Verify low stock radar and smart reorder button presence
  const reorderBtn = page.locator('[data-testid="btn-open-smart-reorder"]');
  const isReorderVisible = await reorderBtn.isVisible();
  console.log(`✅ Low Stock Radar Re-order Button Visible: ${isReorderVisible}`);

  // Click Smart Re-orders button to test modal opening
  if (isReorderVisible) {
    await reorderBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/dashboard_smart_reorder_modal.png` });
    console.log('📸 Captured dashboard_smart_reorder_modal.png');

    // Close modal
    const closeBtn = page.locator('button:has-text("మూసివేయి"), button:has-text("Close"), button[aria-label="Close"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // Click View Receipt on first bill if available
  const viewReceiptBtn = page.locator('table button[title="View Receipt"]').first();
  if (await viewReceiptBtn.isVisible()) {
    await viewReceiptBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/dashboard_thermal_receipt_modal.png` });
    console.log('📸 Captured dashboard_thermal_receipt_modal.png');
  }

  console.log('🎉 ALL DASHBOARD CHECKS COMPLETED!');
  await browser.close();
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
