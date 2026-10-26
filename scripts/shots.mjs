import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'brand/review';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1.5 });
const page = await context.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') console.log('console error:', m.text());
});
page.on('pageerror', (e) => console.log('page error:', e.message));
page.on('dialog', (d) => d.accept());

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

const shot = async (name, fullPage = false) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log('shot', name);
};

// Dashboard is the landing screen
await shot('01-dashboard');

await page.locator('[data-testid="nav-pos"]').click();
await page.waitForTimeout(900);
await shot('01-pos');

await page.locator('[data-testid="nav-dashboard"]').click();
await page.waitForTimeout(900);
await shot('02-dashboard');

// dashboard lower half
await page.locator('main').evaluate((el) => el.scrollTo({ top: 620, behavior: 'instant' }));
await page.waitForTimeout(400);
await shot('03-dashboard-lower');

await page.locator('[data-testid="nav-pos"]').click();
await page.waitForTimeout(800);
const add = async (label) => {
  const btn = page.locator('button', { hasText: label }).first();
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(250);
  }
};
await add('సబ్బు');
await add('టాటా ఉప్పు');
await add('ఆటా');
await shot('04-pos-cart');

await page.locator('[data-testid="nav-products"]').click();
await page.waitForTimeout(900);
await shot('05-inventory');

await page.locator('[data-testid="nav-khata"]').click();
await page.waitForTimeout(900);
await shot('06-khata');

await page.locator('[data-testid="nav-settings"]').click();
await page.waitForTimeout(900);
await shot('07-settings');

await browser.close();
console.log('done');
