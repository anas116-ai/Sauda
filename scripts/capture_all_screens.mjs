import { chromium } from 'playwright';

const TABS = [
  'dashboard',
  'pos',
  'products',
  'khata',
  'daybook',
  'cashbank',
  'balancesheet',
  'estimates',
  'purchaseorders',
  'challans',
  'gst',
  'loyalty',
  'audit',
  'export',
  'settings'
];

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
    localStorage.setItem('sauda_gateway_dismissed', 'true');
    localStorage.setItem('sauda_current_shop_id', 'demo-shop-001');
    localStorage.setItem('sauda_lang', 'en'); // set English to test the user's issue
  });
  await page.reload();
  await page.waitForTimeout(2000);

  for (const tab of TABS) {
    console.log(`Navigating to tab: ${tab}...`);
    // Find nav button
    let btn = page.locator(`[data-testid="nav-${tab}"]`);
    if (!(await btn.isVisible())) {
      btn = page.locator(`[data-testid="book-${tab}"]`);
    }
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `C:/Users/shaik/.gemini/antigravity-ide/brain/829f1c37-c95a-4123-aada-09c28787d219/screenshots/screen_${tab}.png` });
      console.log(`📸 Captured screen_${tab}.png`);
    } else {
      console.warn(`Could not find button for tab ${tab}`);
    }
  }

  await browser.close();
  console.log('All tabs captured!');
}

run().catch(console.error);
