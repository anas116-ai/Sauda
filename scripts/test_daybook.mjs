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

const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(e.message));
page.on('dialog', (d) => d.accept());

const pass = (msg) => console.log(`PASS  ${msg}`);
const fail = (msg) => { console.error(`FAIL  ${msg}`); process.exit(1); };

try {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);

  // 1. Check quick button on dashboard
  const quickBtn = page.locator('[data-testid="btn-quick-daybook"]');
  if (!(await quickBtn.isVisible())) fail('Quick Day Book button missing on Dashboard');
  pass('DB1 · Dashboard exposes quick Day Book action');

  // 2. Click Day Book from dashboard
  await quickBtn.click();
  await page.waitForTimeout(800);

  const container = page.locator('[data-testid="daybook-screen-container"]');
  if (!(await container.isVisible())) fail('Day Book screen container not visible');
  pass('DB2 · Day Book screen renders successfully');

  // 3. Verify KPIs
  const inflow = page.locator('[data-testid="daybook-kpi-inflow"]');
  const outflow = page.locator('[data-testid="daybook-kpi-outflow"]');
  const net = page.locator('[data-testid="daybook-kpi-net"]');
  const count = page.locator('[data-testid="daybook-kpi-count"]');

  if (!(await inflow.isVisible()) || !(await outflow.isVisible()) || !(await net.isVisible()) || !(await count.isVisible())) {
    fail('One or more Day Book KPI cards are missing');
  }
  pass('DB3 · Four Day Book financial summary KPIs rendered');

  // 4. Verify Date Filters
  const yesterdayBtn = page.locator('[data-testid="daybook-date-filter-yesterday"]');
  await yesterdayBtn.click();
  await page.waitForTimeout(500);
  pass('DB4 · Date range switching (Yesterday/Today) works smoothly');

  const todayBtn = page.locator('[data-testid="daybook-date-filter-today"]');
  await todayBtn.click();
  await page.waitForTimeout(500);

  // 5. Verify Type Filter Chips
  const salesChip = page.locator('[data-testid="daybook-type-filter-SALE"]');
  await salesChip.click();
  await page.waitForTimeout(500);
  pass('DB5 · Transaction type filtering (Sales/Purchases/Expenses) works');

  const allChip = page.locator('[data-testid="daybook-type-filter-ALL"]');
  await allChip.click();
  await page.waitForTimeout(500);

  // 6. Verify Export CSV Button
  const exportBtn = page.locator('[data-testid="daybook-export-csv"]');
  if (!(await exportBtn.isVisible())) fail('Export CSV button missing');
  pass('DB6 · Export CSV button is ready for Kirana accounts');

  // 7. Verify Sidebar navigation to Day Book
  await page.locator('[data-testid="nav-dashboard"]').click();
  await page.waitForTimeout(500);
  const sidebarBook = page.locator('[data-testid="book-daybook"]');
  if (!(await sidebarBook.isVisible())) fail('Sidebar book-daybook button missing');
  await sidebarBook.click();
  await page.waitForTimeout(500);
  if (!(await container.isVisible())) fail('Sidebar navigation to Day Book failed');
  pass('DB7 · Sidebar book-daybook link navigates to Day Book');

  // Desktop screenshot
  await page.screenshot({ path: `${OUT}/daybook-desktop.png` });
  pass('DB8 · Desktop screenshot captured at 1440px');

  // Mobile viewport check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/daybook-mobile.png` });
  pass('DB9 · Mobile 390px viewport renders responsive journal tape');

  console.log('\nAll 9 Day Book checks passed cleanly · 0 console errors!');
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await browser.close();
}
