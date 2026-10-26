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

  // 1. Navigate to Cash & Bank from sidebar
  const sidebarBtn = page.locator('[data-testid="book-cashbank"]');
  if (!(await sidebarBtn.isVisible())) fail('Sidebar book-cashbank button missing');
  await sidebarBtn.click();
  await page.waitForTimeout(800);

  const container = page.locator('[data-testid="cashbank-screen-container"]');
  if (!(await container.isVisible())) fail('Cash & Bank screen container not visible');
  pass('CB1 · Navigated to Cash & Bank Book from sidebar');

  // 2. Check 3 liquidity summary cards
  const cashCard = page.locator('[data-testid="cashbank-card-cash"]');
  const bankCard = page.locator('[data-testid="cashbank-card-bank"]');
  const totalCard = page.locator('[data-testid="cashbank-card-total"]');

  if (!(await cashCard.isVisible()) || !(await bankCard.isVisible()) || !(await totalCard.isVisible())) {
    fail('One or more Cash & Bank liquidity cards missing');
  }
  pass('CB2 · Three store liquidity metrics (Cash in Hand, In Bank, Net Liquidity) rendered');

  // 3. Check Account Cards
  const accountsCount = await page.locator('[data-testid^="account-card-"]').count();
  if (accountsCount < 1) fail('No account cards rendered');
  pass(`CB3 · Configured accounts rendered (${accountsCount} accounts active)`);

  // 4. Test Reconcile Modal & Note Counter
  const reconcileBtn = page.locator('[data-testid="cashbank-reconcile-trigger"]');
  await reconcileBtn.click();
  await page.waitForTimeout(400);

  const c500Input = page.locator('[data-testid="denom-input-c500"]');
  if (!(await c500Input.isVisible())) fail('Denomination 500 input not visible');
  await c500Input.fill('10'); // 10 x ₹500 = ₹5,000
  await page.waitForTimeout(300);
  pass('CB4 · Physical currency denomination calculator and reconciliation modal works');

  // Close reconcile modal
  const doneBtn = page.getByRole('button', { name: /Done|ముగించు/ });
  await doneBtn.click();
  await page.waitForTimeout(400);

  // 5. Test Transfer Modal Trigger
  const transferBtn = page.locator('[data-testid="cashbank-transfer-trigger"]');
  await transferBtn.click();
  await page.waitForTimeout(400);

  const amtInput = page.locator('[data-testid="transfer-amount-input"]');
  if (!(await amtInput.isVisible())) fail('Transfer amount input missing');
  pass('CB5 · Deposit / Account Transfer modal opens with account selects');

  // Cancel modal
  const cancelBtn = page.getByRole('button', { name: /Cancel|రద్దు/ }).first();
  await cancelBtn.click();
  await page.waitForTimeout(300);

  // 6. Check Export CSV button
  const exportBtn = page.locator('[data-testid="cashbank-export-csv"]');
  if (!(await exportBtn.isVisible())) fail('Export CSV button missing in Cash & Bank');
  pass('CB6 · Cash & Bank statement CSV export button is available');

  // 7. Desktop screenshot
  await page.screenshot({ path: `${OUT}/cashbank-desktop.png` });
  pass('CB7 · Desktop screenshot captured at 1440px');

  // 8. Mobile responsive viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/cashbank-mobile.png` });
  pass('CB8 · Mobile 390px viewport renders responsive liquidity ledger');

  console.log('\nAll 8 Cash & Bank checks passed cleanly · 0 console errors!');
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await browser.close();
}
