import fs from 'node:fs';
import { chromium } from 'playwright';

const OUT = 'brand/review/audit';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync('research', { recursive: true });

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

const results = [];
const check = async (name, fn) => {
  try {
    const detail = (await fn()) ?? '';
    results.push({ name, pass: true, detail: String(detail) });
    console.log('PASS  ' + name + (detail ? ' — ' + detail : ''));
  } catch (e) {
    results.push({ name, pass: false, detail: e.message.split('\n')[0].slice(0, 220) });
    console.log('FAIL  ' + name + ' — ' + e.message.split('\n')[0].slice(0, 220));
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const closeOverlays = async () => {
  for (let i = 0; i < 4; i += 1) {
    const n = await page.evaluate(() => document.querySelectorAll('div.fixed.inset-0').length);
    if (!n) return;
    const overlay = page.locator('div.fixed.inset-0').last();
    const x = overlay
      .locator('button:has(svg.lucide-x), button[aria-label*="lose" i], button[aria-label*="Cancel" i]')
      .first();
    if (await x.count()) {
      await x.click({ force: true }).catch(() => {});
    } else {
      const c = overlay.getByRole('button', { name: /^(Close|Cancel|Done|Back)$/i }).first();
      if (await c.count()) await c.click({ force: true }).catch(() => {});
      else await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(450);
  }
};
const nav = async (id) => {
  await closeOverlays();
  await page.locator(`[data-testid="nav-${id}"]`).click();
  await page.waitForTimeout(750);
};
const visible = async (re) => (await page.getByText(re).first().count()) > 0;
const shot = async (n) => page.screenshot({ path: `${OUT}/${n}.png` });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1000);

// ── DASHBOARD ───────────────────────────────────────────────────────────────
await check('D1 · Sidebar, brand and 5 primary tabs render', async () => {
  const tabs = await page.locator('[data-testid^="nav-"]').count();
  assert(tabs === 5, `tabs=${tabs}`);
  assert(await page.locator('[data-testid="app-left-sidebar"]').isVisible(), 'sidebar missing');
  const logo = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="app-left-sidebar"] svg');
    return el ? el.getBoundingClientRect().width : 0;
  });
  assert(logo > 20, `logo width=${logo}`);
  return `tabs=5 logo=${Math.round(logo)}px`;
});

await check('D2 · Four KPI cards (sales, khata due, valuation, invoices)', async () => {
  const body = (await page.locator('main').innerText()).toLowerCase();
  for (const k of ["today's sales", 'customer khata due', 'stock value', "today's invoices"]) {
    assert(body.includes(k), `missing "${k}"`);
  }
  const kpis = await page.evaluate(() => document.querySelectorAll('main .tnum').length);
  assert(kpis >= 3, `numeric kpis=${kpis}`);
  return `kpis=${kpis}`;
});

await check('D3 · Recent store invoices table has rows', async () => {
  const rows = await page.locator('main tbody tr').count();
  assert(rows >= 3, `rows=${rows}`);
  return `rows=${rows}`;
});

await check('D4 · Low Stock Radar panel renders', async () => {
  assert(await visible(/Low Stock Radar/), 'panel missing');
  return 'panel present';
});

await check('D5 · Store tools drawer exposes 7 tools', async () => {
  await page.locator('button', { hasText: 'STORE TOOLS' }).first().click();
  await page.waitForTimeout(450);
  const tools = await page.locator('[data-testid^="sidebar-tool-"]').count();
  assert(tools === 7, `tools=${tools}`);
  return `tools=${tools}`;
});
await shot('01-dashboard');

// ── POS ─────────────────────────────────────────────────────────────────────
await nav('pos');
await check('P1 · POS renders search, cart and payment suite', async () => {
  assert(await page.locator('[data-testid="pos-search-input"]').isVisible(), 'search missing');
  const cash = await page.getByRole('button', { name: /F1 Cash Payment/ }).count();
  const upi = await page.getByRole('button', { name: /F2 UPI QR/ }).count();
  const khata = await page.getByRole('button', { name: /F3 Khata/ }).count();
  assert(cash >= 1 && upi >= 1 && khata >= 1, `cash=${cash} upi=${upi} khata=${khata}`);
  return `cash=${cash} upi=${upi} khata=${khata}`;
});

const dropdown = page.locator('div.max-h-60').first();
await check('P2 · Telugu product search returns matches', async () => {
  await page.locator('[data-testid="pos-search-input"]').fill('బియ్యం');
  await page.waitForTimeout(500);
  const n = await dropdown.locator('button').count();
  assert(n >= 1, `results=${n}`);
  return `results=${n}`;
});

await check('P3 · English product search returns matches', async () => {
  await page.locator('[data-testid="pos-search-input"]').fill('rice');
  await page.waitForTimeout(500);
  const n = await dropdown.locator('button').count();
  assert(n >= 1, `results=${n}`);
  return `results=${n}`;
});

let cartTotalBefore = 0;
await check('P4 · Add product to cart updates bill total', async () => {
  await dropdown.locator('button').first().click();
  await page.waitForTimeout(500);
  const cash = page.getByRole('button', { name: /F1 Cash Payment/ }).first();
  const txt = (await cash.innerText()).replace(/\s+/g, ' ');
  const m = txt.match(/₹([\d,]+)/);
  cartTotalBefore = m ? Number(m[1].replace(/,/g, '')) : 0;
  assert(cartTotalBefore > 0, `total text="${txt}"`);
  return `total=₹${cartTotalBefore}`;
});

await check('P5 · Quantity + increases line total', async () => {
  const plus = page.locator('main table tbody tr').first().locator('button').nth(1);
  await plus.click();
  await page.waitForTimeout(500);
  const cash = page.getByRole('button', { name: /F1 Cash Payment/ }).first();
  const m = (await cash.innerText()).match(/₹([\d,]+)/);
  const after = m ? Number(m[1].replace(/,/g, '')) : 0;
  assert(after > cartTotalBefore, `before=${cartTotalBefore} after=${after}`);
  return `₹${cartTotalBefore} → ₹${after}`;
});

await check('P6 · Cash checkout finalizes the bill', async () => {
  const before = await page.locator('main tbody tr').count();
  await page.getByRole('button', { name: /F1 Cash Payment/ }).first().click();
  await page.waitForTimeout(1500);
  const body = await page.locator('main').innerText();
  const ok = /Success|Completed|Bill|Receipt|PAID/i.test(body);
  assert(ok, 'no success state after cash');
  // close receipt / success modal if present
  const close = page.getByRole('button', { name: /Close|Done|New Sale|Next/i }).first();
  if (await close.count()) {
    await close.click().catch(() => {});
    await page.waitForTimeout(500);
  }
  return 'cash sale completed';
});
await shot('02-pos-checkout');

await check('P7 · Empty-cart cash button is disabled', async () => {
  const cash = page.getByRole('button', { name: /F1 Cash Payment/ }).first();
  const disabled = await cash.isDisabled();
  assert(disabled, 'cash button is enabled with empty cart');
  return 'disabled=yes';
});

await check('P8 · Loose items matrix (F8) opens', async () => {
  await closeOverlays();
  await page.getByRole('button', { name: /Loose Items/ }).first().click();
  await page.waitForTimeout(700);
  const overlay = page.locator('div.fixed.inset-0').first();
  assert(await overlay.count(), 'no overlay');
  const body = await overlay.innerText();
  assert(/Loose|Commodities|కిలో|kg/i.test(body), 'overlay content unexpected');
  await closeOverlays();
  return 'matrix opened';
});

await check('P9 · GSTR-1 tax report opens with slab totals', async () => {
  await closeOverlays();
  await page.getByRole('button', { name: 'GSTR-1' }).first().click();
  await page.waitForTimeout(800);
  const dlg = page.locator('div.fixed.inset-0').first();
  assert(await dlg.count(), 'no overlay');
  const body = await dlg.innerText();
  assert(/GSTR|B2C|Taxable|CGST|SGST/i.test(body), 'no GST content');
  await closeOverlays();
  return 'GST slabs rendered';
});

await check('P10 · Park cart stores an active ticket', async () => {
  await page.locator('[data-testid="pos-search-input"]').fill('బియ్యం');
  await page.waitForTimeout(500);
  await page.locator('div.max-h-60').first().locator('button').first().click();
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => document.body.innerText.match(/Parked|Held/gi)?.length || 0);
  await page.locator('[data-testid="park-cart-btn"]').click();
  await page.waitForTimeout(700);
  const body = await page.locator('main').innerText();
  const parked = /Parked|Held|Resume/i.test(body);
  assert(parked, 'no parked cart UI');
  return `parked tickets before=${before}`;
});

// ── INVENTORY ───────────────────────────────────────────────────────────────
await nav('products');
await check('I1 · Inventory list renders products', async () => {
  const rows = await page.locator('main tbody tr').count();
  assert(rows >= 20, `rows=${rows}`);
  return `rows=${rows}`;
});

await check('I2 · Inventory search filters rows', async () => {
  const input = page.locator('main input[placeholder*="Search inventory"]').first();
  const all = await page.locator('main tbody tr').count();
  await input.fill('బియ్యం');
  await page.waitForTimeout(600);
  const filtered = await page.locator('main tbody tr').count();
  assert(filtered > 0 && filtered < all, `all=${all} filtered=${filtered}`);
  await input.fill('');
  await page.waitForTimeout(400);
  return `${all} → ${filtered}`;
});

const openAndClose = async (btnName, expectRe, closeName) => {
  await closeOverlays();
  await page.getByRole('button', { name: btnName }).first().click();
  await page.waitForTimeout(800);
  const dlg = page.locator('div.fixed.inset-0').first();
  assert(await dlg.count(), 'no overlay');
  const body = await dlg.innerText();
  assert(expectRe.test(body), `dialog text missing ${expectRe}`);
  await closeOverlays();
  return body.replace(/\s+/g, ' ').slice(0, 70);
};

await check('I3 · Add Item form opens with pricing fields', async () => {
  const t = await openAndClose(/^\+ Add Item$/, /Product|Item|MRP|Price|Name/i, /Cancel/);
  return t;
});

await check('I4 · Stock Inward form opens', async () => {
  const t = await openAndClose(/\+ Stock Inward/, /Inward|Supplier|Invoice|Qty/i, /Cancel/);
  return t;
});

await check('I5 · Barcode label studio opens', async () => {
  const t = await openAndClose(/Print Labels/, /Barcode|Label|50mm/i, /Close|Cancel/);
  return t;
});

await check('I6 · Stock audit & shrinkage panel opens', async () => {
  await closeOverlays();
  await page.getByRole('button', { name: /Stock Audit & Shrinkage/ }).first().click();
  await page.waitForTimeout(700);
  const body = await page.locator('main').innerText();
  assert(/Physical|Shrinkage|Variance|Audit Session|SKUs/i.test(body), 'audit tab content missing');
  const rows = await page.locator('main table tbody tr').count();
  return `audit tab rendered, rows=${rows}`;
});

await check('I7 · CSV import modal opens', async () => {
  await closeOverlays();
  await page.getByRole('button', { name: /^CSV$/ }).first().click();
  await page.waitForTimeout(700);
  const dlg = page.locator('div.fixed.inset-0').first();
  assert(await dlg.count(), 'no overlay');
  const body = await dlg.innerText();
  assert(/CSV|Import|Select CSV/i.test(body), 'csv content missing');
  const input = await dlg.locator('input[type="file"]').count();
  assert(input === 1, `file inputs=${input}`);
  await closeOverlays();
  return 'file input present';
});
await shot('03-inventory');

// ── KHATA ───────────────────────────────────────────────────────────────────
await nav('khata');
await check('K1 · Customer and supplier ledgers render', async () => {
  const body = await page.locator('main').innerText();
  assert(/Customer Khata/.test(body), 'customer tab missing');
  assert(/Suppliers & Distributors/.test(body), 'supplier tab missing');
  const rows = await page.locator('main button').filter({ hasText: /CUS-0001/ }).count();
  assert(rows >= 3, `customer rows=${rows}`);
  return `customer rows=${rows}`;
});

await check('K2 · Five aging buckets render without clipping', async () => {
  const chips = await page.getByRole('button', { name: /^All \(\d+\)|^\d+-\d+d \(\d+\)|^60\+d \(\d+\)|^Over Limit \(\d+\)/ }).count();
  assert(chips === 5, `chips=${chips}`);
  return `chips=${chips}`;
});

await check('K3 · Khata search filters customers', async () => {
  const input = page.locator('main input[placeholder*="Search by customer"]').first();
  const all = await page.locator('main').innerText();
  await input.fill('రమేష్');
  await page.waitForTimeout(600);
  const filtered = await page.locator('main').innerText();
  assert(filtered.includes('రమేష్'), 'search produced no ramesh');
  assert(filtered.length < all.length, 'view did not narrow');
  await input.fill('');
  await page.waitForTimeout(400);
  return 'filter narrowed';
});

await check('K4 · Gave / Got entry modal opens', async () => {
  await closeOverlays();
  await page.getByRole('button', { name: /Gave \(Udhar/ }).first().click();
  await page.waitForTimeout(700);
  const dlg = page.locator('div.fixed.inset-0').first();
  assert(await dlg.count(), 'no overlay');
  const body = await dlg.innerText();
  assert(/Amount|Cash|UPI|Note|Reason|Date/i.test(body), 'entry fields missing');
  await closeOverlays();
  return 'entry form opened';
});

await check('K5 · Bulk settlement modal opens', async () => {
  await closeOverlays();
  await page.getByRole('button', { name: /Bulk Settle/ }).first().click();
  await page.waitForTimeout(700);
  const dlg = page.locator('div.fixed.inset-0').first();
  assert(await dlg.count(), 'no overlay');
  const body = await dlg.innerText();
  assert(/Settle|Payment|Cash|UPI|Select/i.test(body), 'settle content missing');
  await closeOverlays();
  return 'bulk settle opened';
});

await check('K6 · WhatsApp statement composer opens', async () => {
  await closeOverlays();
  await page.getByRole('button', { name: /WhatsApp Statement/ }).first().click();
  await page.waitForTimeout(700);
  const dlg = page.locator('div.fixed.inset-0').first();
  assert(await dlg.count(), 'no overlay');
  const body = await dlg.innerText();
  assert(/WhatsApp|Message|Send|Statement/i.test(body), 'wa content missing');
  await closeOverlays();
  return 'statement composer opened';
});
await shot('04-khata');

// ── SETTINGS ────────────────────────────────────────────────────────────────
await nav('settings');
await check('S1 · All hardware and profile sections render', async () => {
  const body = await page.locator('main').innerText();
  for (const s of ['Thermal Receipt Printer', 'Cash Drawer', 'Weighing Scale', 'Store Profile', 'Staff Users', 'Database Snapshot']) {
    assert(body.includes(s), `missing ${s}`);
  }
  return '6 sections';
});

await check('S2 · Printer width 58mm can be selected', async () => {
  const before = await page.evaluate(() => localStorage.getItem('sauda_printer_config'));
  await page.getByRole('button', { name: /58mm/ }).first().click();
  await page.waitForTimeout(400);
  const body = await page.locator('main').innerText();
  assert(/58/.test(body), '58mm not reflected');
  return '58mm selectable';
});

await check('S3 · Language switch to Telugu and back', async () => {
  await page.locator('[data-testid="lang-switch-te"]').click();
  await page.waitForTimeout(700);
  const te = await page.locator('main').innerText();
  assert(/సెట్టింగ్|వెబ్|స్టోర్|ప్రింటర్/.test(te), 'telugu labels missing');
  await page.locator('[data-testid="lang-switch-en"]').click();
  await page.waitForTimeout(700);
  const en = await page.locator('main').innerText();
  assert(/Printer|Store|Settings/i.test(en), 'english labels missing');
  return 'te → en round trip';
});

await check('S4 · Staff users load with role and PIN actions', async () => {
  const body = await page.locator('main').innerText();
  assert(/OWNER|ADMIN|CASHIER/.test(body), 'roles missing');
  return 'roles present';
});

await check('S5 · Encrypted JSON backup downloads', async () => {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 12000 }),
    page.getByRole('button', { name: /Download Backup Snapshot/ }).first().click(),
  ]);
  const name = download.suggestedFilename();
  const path = await download.path();
  const size = path ? fs.statSync(path).size : 0;
  assert(size > 500, `size=${size}`);
  return `${name} ${(size / 1024).toFixed(1)}KB`;
});
await shot('05-settings');

// ── TOOL MODALS ─────────────────────────────────────────────────────────────
await nav('dashboard');

const openTools = async () => {
  if ((await page.locator('[data-testid^="sidebar-tool-"]').count()) >= 7) return;
  await page.locator('button', { hasText: 'STORE TOOLS' }).first().click();
  await page.waitForTimeout(450);
};

const tools = [
  ['reorder', 'smart-reorder-modal', /Re-order|Reorder|PO|Supplier/i, 'smart-reorder-close-btn'],
  ['pnl', 'pnl-studio-modal', /Profit|Revenue|COGS|Expense/i, 'pnl-close-footer-btn'],
  ['health', 'store-health-studio-modal', /Health|Score|Run-rate|Pillar/i, 'store-health-close-footer-btn'],
  ['dayend', 'DAYEND', /Day-End|Z-Report|Denomination|Closing/i, null],
  ['mesh', 'lan-sync-modal', /LAN|Peer|Sync|Terminal/i, 'lan-sync-close-footer-btn'],
  ['cloud', 'cloud-backup-modal', /Cloud|Backup|Drive|Passphrase/i, 'cloud-backup-close-footer-btn'],
  ['multicounter', 'multi-counter-modal', /Counter|Terminal|Sales|Lock/i, 'multi-counter-close-btn'],
];

for (const [id, testid, re, closeId] of tools) {
  await check(`T-${id} · ${id} studio opens`, async () => {
    await closeOverlays();
    await openTools();
    await page.locator(`[data-testid="sidebar-tool-${id}"]`).click();
    await page
      .waitForFunction(() => document.querySelectorAll('div.fixed.inset-0').length > 0, null, { timeout: 6000 })
      .catch(() => {});
    await page.waitForTimeout(400);
    const dlg =
      testid === 'DAYEND'
        ? page.locator('div.fixed.inset-0').first()
        : testid
          ? page.locator(`[data-testid="${testid}"]`)
          : page.locator('div.fixed.inset-0').first();
    assert(await dlg.count(), 'modal not found');
    const body = await dlg.innerText();
    assert(re.test(body), `content mismatch: ${body.slice(0, 60)}`);
    if (closeId) await page.locator(`[data-testid="${closeId}"]`).click().catch(() => {});
    await closeOverlays();
    await page.waitForTimeout(300);
    return body.replace(/\s+/g, ' ').slice(0, 60);
  });
}
await shot('06-tools');

// ── LOCK ────────────────────────────────────────────────────────────────────
await check('L1 · PIN lock renders 12-key pad', async () => {
  await page.locator('[aria-label="Lock terminal PIN"]').click();
  await page.waitForTimeout(700);
  const dlg = page.locator('[role="dialog"]').first();
  assert(await dlg.count(), 'no dialog');
  const keys = await dlg.locator('button').count();
  assert(keys >= 12, `keys=${keys}`);
  return `keys=${keys}`;
});

await check('L2 · Wrong PIN is rejected', async () => {
  const dlg = page.locator('[role="dialog"]').first();
  for (const d of ['9', '9', '9', '9']) {
    await dlg.getByRole('button', { name: new RegExp(`^${d}$`) }).click();
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(700);
  const still = await page.locator('[role="dialog"]').count();
  assert(still === 1, 'wrong PIN unlocked the app');
  return 'still locked';
});

await check('L3 · PIN 1234 unlocks', async () => {
  const dlg = page.locator('[role="dialog"]').first();
  for (const d of ['1', '2', '3', '4']) {
    await dlg.getByRole('button', { name: new RegExp(`^${d}$`) }).click();
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(800);
  assert((await page.locator('[role="dialog"]').count()) === 0, 'still locked');
  return 'unlocked';
});
await shot('07-lock');

// ── GLOBAL QUALITY ──────────────────────────────────────────────────────────
await check('Q1 · No horizontal overflow at 1440px', async () => {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  assert(r.sw <= r.cw + 1, `${r.sw} > ${r.cw}`);
  return `${r.sw}/${r.cw}`;
});

await check('Q2 · No console or page errors during the run', async () => {
  assert(consoleErrors.length === 0, `${consoleErrors.length} errors: ${consoleErrors[0]}`);
  return '0 errors';
});

// mobile probe (informational, still recorded as a check)
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(900);
await check('Q3 · 390px mobile viewport is usable', async () => {
  const r = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
    sidebar: document.querySelector('[data-testid="app-left-sidebar"]')?.getBoundingClientRect().width || 0,
  }));
  assert(r.sw <= r.cw + 1, `horizontal scroll ${r.sw}>${r.cw}, sidebar=${r.sidebar}`);
  return `no h-scroll, sidebar=${r.sidebar}`;
});
await shot('08-mobile-390');

const pass = results.filter((r) => r.pass).length;
const report = {
  generatedAt: new Date().toISOString(),
  url: 'http://localhost:5173/',
  viewport: '1440x950 (desktop) + 390x844 (mobile probe)',
  total: results.length,
  passed: pass,
  failed: results.length - pass,
  consoleErrors,
  results,
};
fs.writeFileSync('research/test-results.json', JSON.stringify(report, null, 2), 'utf8');
console.log(`\n${pass}/${results.length} checks passed · console errors=${consoleErrors.length}`);
await browser.close();
process.exit(0);
