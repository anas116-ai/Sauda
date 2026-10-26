import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

console.log('--- DASH main text ---');
console.log((await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 1400));

console.log('\n--- STORE TOOLS button ---');
console.log(await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /STORE TOOLS/i.test(x.innerText));
  return b ? b.outerHTML.slice(0, 400) : 'none';
}));

await page.locator('[data-testid="nav-pos"]').click();
await page.waitForTimeout(900);
await page.locator('[data-testid="pos-search-input"]').fill('బియ్యం');
await page.waitForTimeout(600);
await page.locator('div.max-h-60').first().locator('button').first().click();
await page.waitForTimeout(700);

console.log('\n--- CART row / steppers ---');
console.log(await page.evaluate(() => {
  const tbody = document.querySelector('tbody');
  const plus = [...document.querySelectorAll('button')].filter((b) => b.querySelector('svg.lucide-plus, svg.lucide-minus'));
  return {
    tbody: tbody ? tbody.innerText.replace(/\s+/g, ' ').slice(0, 300) : 'no tbody',
    steppers: plus.map((b) => b.outerHTML.slice(0, 160)),
    allSmallButtons: [...document.querySelectorAll('table button')].map((b) => b.outerHTML.slice(0, 100)).slice(0, 12),
  };
}));

console.log('\n--- LOOSE modal ---');
await page.getByRole('button', { name: /Loose Items/ }).first().click();
await page.waitForTimeout(800);
console.log(await page.evaluate(() => {
  const overlays = [...document.querySelectorAll('div')].filter((d) => /fixed inset-0/.test(d.className.toString()));
  return overlays.map((o) => ({ cls: o.className.toString().slice(0, 120), role: o.getAttribute('role'), txt: o.innerText.replace(/\s+/g, ' ').slice(0, 200) }));
}));
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
console.log('after esc overlays:', await page.evaluate(() => [...document.querySelectorAll('div')].filter((d) => /fixed inset-0/.test(d.className.toString())).length));

await browser.close();
