import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.setItem('sauda_gateway_dismissed', 'true'));
  await page.reload();
  await page.waitForTimeout(2000);

  console.log('Clicking POS tab...');
  const posBtn = page.locator('[data-testid="nav-pos"]');
  await posBtn.click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'C:/Users/shaik/.gemini/antigravity-ide/brain/829f1c37-c95a-4123-aada-09c28787d219/screenshots/test_pos_click.png' });
  console.log('📸 Screenshot test_pos_click.png saved');

  await browser.close();
}

run().catch(console.error);
