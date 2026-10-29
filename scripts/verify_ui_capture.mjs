import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(800);

  // Click Go to Dashboard button in header
  const dashBtn = page.locator('[data-testid="gateway-goto-dashboard-btn"]');
  if (await dashBtn.isVisible()) {
    await dashBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'public/dashboard_revamp.png', fullPage: false });
    console.log('3. Captured dashboard_revamp.png');
  }

  await browser.close();
}

run().catch(console.error);
