import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Landing Page Showcase Section (where the user had the issue)
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // Scroll down to the 6 core pillars
  await page.evaluate(() => window.scrollBy(0, 750));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'public/audit_evidence/new_showcase_section_clean.png', fullPage: false });
  console.log('1. Captured new_showcase_section_clean.png');

  // Full landing top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'public/audit_evidence/new_landing_page_clean.png', fullPage: false });
  console.log('2. Captured new_landing_page_clean.png');

  // Go to Dashboard
  const dashBtn = page.locator('[data-testid="gateway-goto-dashboard-btn"]');
  if (await dashBtn.isVisible()) {
    await dashBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'public/audit_evidence/new_dashboard_clean.png', fullPage: false });
    console.log('3. Captured new_dashboard_clean.png');
  }

  await browser.close();
}

verify().catch(console.error);
