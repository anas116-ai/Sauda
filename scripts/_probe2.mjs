import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE ERR:', m.text()));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

await page.locator('[data-testid="nav-pos"]').click();
await page.waitForTimeout(700);
await page.locator('[data-testid="pos-search-input"]').fill('rice');
await page.waitForTimeout(500);

const first = page.locator('button', { hasText: '₹' }).filter({ hasText: /kg|PCS|pack/i }).first();
console.log('first result:', (await first.innerText()).replace(/\s+/g, ' '));
await first.click();
await page.waitForTimeout(600);

const afterAdd = await page.evaluate(() => ({
  cash: [...document.querySelectorAll('button')].filter((b) => /F1/.test(b.innerText)).map((b) => b.innerText.replace(/\s+/g, ' ')),
  cartRows: document.querySelectorAll('table tbody tr').length,
}));
console.log('after add:', JSON.stringify(afterAdd));

await page.locator('button', { hasText: /F1/ }).first().click();
await page.waitForTimeout(1400);
const afterPay = await page.evaluate(() => ({
  headings: [...document.querySelectorAll('h1,h2,h3')].map((h) => h.innerText.replace(/\s+/g, ' ')).filter(Boolean),
  dialogs: [...document.querySelectorAll('[role="dialog"]')].map((d) => d.innerText.replace(/\s+/g, ' ').slice(0, 300)),
  bodyTail: document.body.innerText.replace(/\s+/g, ' ').slice(-500),
}));
console.log('after pay:', JSON.stringify(afterPay, null, 2));
await page.screenshot({ path: 'brand/review/probe-after-pay.png' });

console.log('--- products add modal');
await page.locator('[data-testid="nav-products"]').click();
await page.waitForTimeout(700);
await page.locator('button', { hasText: '+ Add Item' }).first().click();
await page.waitForTimeout(600);
const addModal = await page.evaluate(() => ({
  inputs: [...document.querySelectorAll('input,select,textarea')].map((i) => i.getAttribute('placeholder') || i.name || i.type),
  buttons: [...document.querySelectorAll('[role="dialog"] button, .fixed button')].map((b) => b.innerText.replace(/\s+/g, ' ')).filter(Boolean).slice(0, 25),
}));
console.log(JSON.stringify(addModal, null, 2));

await browser.close();
