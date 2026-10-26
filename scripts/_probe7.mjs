import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE ERR:', m.text()));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const state = async (label) => {
  const s = await page.evaluate(() => ({
    overlays: document.querySelectorAll('div.fixed.inset-0').length,
    tools: document.querySelectorAll('[data-testid^="sidebar-tool-"]').length,
    texts: [...document.querySelectorAll('div.fixed.inset-0')].map((d) => d.innerText.replace(/\s+/g, ' ').slice(0, 100)),
  }));
  console.log(label, JSON.stringify(s));
};

await state('initial');
const drawer = page.locator('button', { hasText: 'STORE TOOLS' }).first();
await drawer.click();
await page.waitForTimeout(500);
await state('drawer open');

await page.locator('[data-testid="sidebar-tool-health"]').click();
await page.waitForTimeout(900);
await state('health open');

await page.locator('[data-testid="store-health-close-footer-btn"]').click().catch(() => {});
await page.waitForTimeout(600);
await state('health closed');

const dayBtn = page.locator('[data-testid="sidebar-tool-dayend"]');
console.log('dayend btn count', await dayBtn.count(), 'visible', await dayBtn.isVisible().catch(() => false));
await dayBtn.click({ timeout: 6000 }).catch((e) => console.log('dayend click err', e.message.split('\n')[0]));
await page.waitForTimeout(1200);
await state('dayend clicked');

await browser.close();
