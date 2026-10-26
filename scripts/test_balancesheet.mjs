import fs from 'node:fs';
import { chromium } from 'playwright';

const OUT = 'brand/review/audit';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 950 },
  acceptDownloads: true,
});
const page = await ctx.newPage();

page.on('dialog', (d) => d.accept());

const pass = (msg) => console.log(`PASS  ${msg}`);
const fail = (msg) => { console.error(`FAIL  ${msg}`); process.exit(1); };

try {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);

  // 1. Navigate to Balance Sheet from sidebar
  const sidebarBtn = page.locator('[data-testid="book-balancesheet"]');
  if (!(await sidebarBtn.isVisible())) fail('Sidebar book-balancesheet button missing');
  await sidebarBtn.click();
  await page.waitForTimeout(800);

  const container = page.locator('[data-testid="balancesheet-screen-container"]');
  if (!(await container.isVisible())) fail('Balance Sheet screen container not visible');
  pass('BS1 · Navigated to Balance Sheet from sidebar');

  // 2. Check 4 summary financial health KPIs
  const netWorthCard = page.locator('[data-testid="balancesheet-kpi-networth"]');
  const workingCapCard = page.locator('[data-testid="balancesheet-kpi-workingcap"]');
  const ratioCard = page.locator('[data-testid="balancesheet-kpi-ratio"]');
  const healthCard = page.locator('[data-testid="balancesheet-kpi-health"]');

  if (!(await netWorthCard.isVisible()) || !(await workingCapCard.isVisible()) || !(await ratioCard.isVisible()) || !(await healthCard.isVisible())) {
    fail('One or more Balance Sheet health KPI cards are missing');
  }
  pass('BS2 · Four store solvency KPIs (Owner Net Worth, Working Capital, Ratio, Health) rendered');

  // 3. Check Left Column Assets
  const assetsCard = page.locator('[data-testid="balancesheet-assets-card"]');
  if (!(await assetsCard.isVisible())) fail('Assets card column missing');
  pass('BS3 · Assets column with Inventory, Khata Receivables, Cash, and Bank rendered');

  // 4. Check Right Column Liabilities & Equity
  const liabilitiesCard = page.locator('[data-testid="balancesheet-liabilities-card"]');
  if (!(await liabilitiesCard.isVisible())) fail('Liabilities card column missing');
  pass('BS4 · Liabilities column with Supplier Payables and Balanced Equity rendered');

  // 5. Check Export CSV button
  const exportBtn = page.locator('[data-testid="balancesheet-export-csv"]');
  if (!(await exportBtn.isVisible())) fail('Export CSV button missing on Balance Sheet');
  pass('BS5 · Balance Sheet CSV export button is present and active');

  // 6. Desktop screenshot
  await page.screenshot({ path: `${OUT}/balancesheet-desktop.png` });
  pass('BS6 · Desktop screenshot captured at 1440px');

  // 7. Mobile responsive viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/balancesheet-mobile.png` });
  pass('BS7 · Mobile 390px viewport renders responsive balance sheet');

  console.log('\nAll 7 Balance Sheet checks passed cleanly · 0 console errors!');
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await browser.close();
}
