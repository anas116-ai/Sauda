import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const dump = async (label) => {
  const info = await page.evaluate(() => ({
    buttons: [...document.querySelectorAll('button')]
      .map((b) => b.innerText.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 60),
    headings: [...document.querySelectorAll('h1,h2,h3')]
      .map((h) => h.innerText.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 30),
    inputs: [...document.querySelectorAll('input,select,textarea')].map((i) => ({
      ph: i.getAttribute('placeholder') || '',
      tid: i.getAttribute('data-testid') || '',
      type: i.type,
    })),
  }));
  console.log('\n##### ' + label);
  console.log('H:', JSON.stringify(info.headings));
  console.log('B:', JSON.stringify(info.buttons));
  console.log('I:', JSON.stringify(info.inputs));
};

await dump('dashboard');
await page.locator('[data-testid="nav-pos"]').click();
await page.waitForTimeout(900);
await dump('pos');

await page.locator('[data-testid="pos-search-input"]').fill('rice');
await page.waitForTimeout(500);
const results = await page.evaluate(() =>
  [...document.querySelectorAll('button')].filter((b) => b.innerText.includes('₹')).length
);
console.log('\nsearch result buttons with ₹:', results);

await page.locator('[data-testid="nav-products"]').click();
await page.waitForTimeout(900);
await dump('products');

await page.locator('[data-testid="nav-khata"]').click();
await page.waitForTimeout(900);
await dump('khata');

await page.locator('[data-testid="nav-settings"]').click();
await page.waitForTimeout(900);
await dump('settings');

await browser.close();
