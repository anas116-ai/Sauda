import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage();
page.on('console', m => console.log('BROWSER CONSOLE:', m.text()));
page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
await page.goto('http://localhost:5173/');
await page.waitForTimeout(2000);
const hasSwitcher = await page.locator('[data-testid="store-switcher-button"]').count();
console.log('hasSwitcher count:', hasSwitcher);
await page.screenshot({ path: 'brand/review/debug_page.png' });
await browser.close();
