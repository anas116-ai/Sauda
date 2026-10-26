import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.locator('[data-testid="nav-pos"]').click();
await page.waitForTimeout(700);

await page.locator('[data-testid="pos-search-input"]').fill('బియ్యం');
await page.waitForTimeout(600);

const info = await page.evaluate(() => {
  const cand = [...document.querySelectorAll('div')].filter((d) => /max-h-60|shadow-dropdown/.test(d.className.toString()));
  return {
    count: cand.length,
    items: cand.map((d) => ({ cls: d.className.toString().slice(0, 100), txt: d.innerText.replace(/\s+/g, ' ').slice(0, 300), rect: d.getBoundingClientRect().toJSON() })),
    searchValue: document.querySelector('[data-testid="pos-search-input"]').value,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'brand/review/probe-search.png' });
await browser.close();
