import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.locator('[data-testid="nav-pos"]').click();
await page.waitForTimeout(700);

for (const q of ['బియ్యం', 'నూనె', 'సోనా', 'deter', '890']) {
  await page.locator('[data-testid="pos-search-input"]').fill(q);
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => {
    const input = document.querySelector('[data-testid="pos-search-input"]');
    const box = input.getBoundingClientRect();
    const below = [...document.querySelectorAll('div,button')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= box.bottom - 2 && r.top < box.bottom + 40 && r.width > 200 && r.height > 20;
    }).slice(0, 8).map((el) => ({ tag: el.tagName, cls: el.className.toString().slice(0, 80), txt: el.innerText.replace(/\s+/g, ' ').slice(0, 120) }));
    return { below, noMatch: document.body.innerText.includes('No items found matching search') };
  });
  console.log('\nQUERY:', q, JSON.stringify(info, null, 1));
}

await browser.close();
