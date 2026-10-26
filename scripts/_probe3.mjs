import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE ERR:', m.text()));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.locator('[data-testid="nav-pos"]').click();
await page.waitForTimeout(700);

for (const q of ['rice', 'sona', 'toor', 'atta', 'soap']) {
  await page.locator('[data-testid="pos-search-input"]').fill(q);
  await page.waitForTimeout(450);
  const items = await page.evaluate(() => {
    const input = document.querySelector('[data-testid="pos-search-input"]');
    const wrap = input.closest('.relative');
    const dd = wrap?.querySelector('.absolute');
    return dd ? [...dd.querySelectorAll('button')].map((b) => b.innerText.replace(/\s+/g, ' ')) : [];
  });
  console.log(q, '=>', JSON.stringify(items));
}

// add the first dropdown item
await page.locator('[data-testid="pos-search-input"]').fill('rice');
await page.waitForTimeout(450);
const ddBtn = page.locator('[data-testid="pos-search-input"]').locator('xpath=ancestor::div[contains(@class,"relative")]//div[contains(@class,"absolute")]//button').first();
console.log('clicking', (await ddBtn.innerText()).replace(/\s+/g, ' '));
await ddBtn.click();
await page.waitForTimeout(700);

const state = await page.evaluate(() => {
  const cartPanel = [...document.querySelectorAll('div')].find((d) => d.innerText?.includes('F1 Cash Payment'));
  return {
    cashBtn: [...document.querySelectorAll('button')].filter((b) => /F1 Cash Payment/.test(b.innerText)).map((b) => ({ text: b.innerText.replace(/\s+/g, ' '), disabled: b.disabled })),
    cart: cartPanel ? cartPanel.innerText.replace(/\s+/g, ' ').slice(0, 400) : null,
    bodyHasEmpty: document.body.innerText.includes('Cart is empty') || document.body.innerText.includes('No items'),
  };
});
console.log(JSON.stringify(state, null, 2));
await page.screenshot({ path: 'brand/review/probe-cart.png' });

await browser.close();
