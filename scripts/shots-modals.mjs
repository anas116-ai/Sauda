import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'brand/review/modals';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1.5 });

const tools = ['reorder', 'pnl', 'health', 'dayend', 'mesh', 'cloud', 'multicounter'];

for (const tool of tools) {
  const page = await context.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Store tools/i }).click();
  await page.waitForTimeout(300);
  const btn = page.locator(`[data-testid="sidebar-tool-${tool}"]`);
  if (!(await btn.count())) {
    console.log('missing', tool);
    await page.close();
    continue;
  }
  await btn.click();
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${OUT}/tool-${tool}.png` });
  console.log('shot', tool);
  await page.close();
}

await browser.close();
