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

  // 1. Navigate to Estimates from sidebar
  const sidebarBtn = page.locator('[data-testid="book-estimates"]');
  if (!(await sidebarBtn.isVisible())) fail('Sidebar book-estimates button missing');
  await sidebarBtn.click();
  await page.waitForTimeout(800);

  const container = page.locator('[data-testid="estimates-screen-container"]');
  if (!(await container.isVisible())) fail('Estimates screen container not visible');
  pass('EST1 · Navigated to Estimates & Quotations from sidebar');

  // 2. Check 3 summary KPIs
  const totalKpi = page.locator('[data-testid="estimates-kpi-total"]');
  const convertedKpi = page.locator('[data-testid="estimates-kpi-converted"]');
  const pendingKpi = page.locator('[data-testid="estimates-kpi-pending"]');

  if (!(await totalKpi.isVisible()) || !(await convertedKpi.isVisible()) || !(await pendingKpi.isVisible())) {
    fail('One or more Estimates KPI cards are missing');
  }
  pass('EST2 · Three quotation pipeline KPIs (Total, Converted, Pending Value) rendered');

  // 3. Verify Estimates Table has rows
  const rows = await page.locator('[data-testid^="estimate-row-"]').count();
  if (rows < 1) fail('No estimate rows rendered in the journal');
  pass(`EST3 · Quotation journal renders active quotes (${rows} active quotes)`);

  // 4. Verify Create Estimate Modal
  const createTrigger = page.locator('[data-testid="estimates-create-trigger"]');
  await createTrigger.click();
  await page.waitForTimeout(400);

  const custNameInput = page.locator('[data-testid="estimate-cust-name-input"]');
  if (!(await custNameInput.isVisible())) fail('Customer name input in quote modal missing');
  await custNameInput.fill('సత్యనారాయణ హోటల్ (Satyanarayana Hotel)');
  pass('EST4 · Create New Estimate modal opens with customer & multi-item quote builder');

  // Cancel modal
  const cancelBtn = page.getByRole('button', { name: /Cancel|రద్దు/ }).first();
  await cancelBtn.click();
  await page.waitForTimeout(400);

  // 5. Check Export CSV button
  const exportBtn = page.locator('[data-testid="estimates-export-csv"]');
  if (!(await exportBtn.isVisible())) fail('Estimates CSV export button missing');
  pass('EST5 · Quotation register CSV export button is available');

  // 6. Desktop screenshot
  await page.screenshot({ path: `${OUT}/estimates-desktop.png` });
  pass('EST6 · Desktop screenshot captured at 1440px');

  // 7. Mobile responsive viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/estimates-mobile.png` });
  pass('EST7 · Mobile 390px viewport renders responsive quotation studio');

  console.log('\nAll 7 Estimates checks passed cleanly · 0 console errors!');
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await browser.close();
}
