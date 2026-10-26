import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'brand/review';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({
  viewport: { width: 1440, height: 950 },
  deviceScaleFactor: 1.5,
});
const page = await context.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

// ── Khata: aging filter must wrap, never clip ───────────────────────────────
await page.locator('[data-testid="nav-khata"]').click();
await page.waitForTimeout(900);

const filterFits = await page.evaluate(() => {
  const row = [...document.querySelectorAll('div')].find((el) =>
    el.className?.includes?.('flex-wrap') && el.className?.includes?.('font-bold')
  );
  if (!row) return { ok: false, why: 'filter row not found' };
  const box = row.getBoundingClientRect();
  const chips = [...row.querySelectorAll('button')];
  const clipped = chips.filter((c) => {
    const b = c.getBoundingClientRect();
    return b.right > box.right + 0.5 || b.bottom > box.bottom + 0.5;
  });
  return {
    ok: clipped.length === 0 && chips.length === 5,
    why: `chips=${chips.length} clipped=${clipped.length} rowW=${Math.round(box.width)} rowH=${Math.round(box.height)}`,
  };
});
check('Khata aging filters wrap without clipping', filterFits.ok, filterFits.why);

const emojiLeft = await page.evaluate(() =>
  [...document.querySelectorAll('button')].filter((b) =>
    /[🟢🟡🔴⚠️]/.test(b.innerText)
  ).length
);
check('Khata filter emoji dots removed', emojiLeft === 0, `emoji chips=${emojiLeft}`);

const wa = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /WhatsApp Statement|వాట్సాప్/.test(b.innerText)
  );
  if (!btn) return { ok: false, why: 'not found' };
  const cs = getComputedStyle(btn);
  return { ok: true, bg: cs.backgroundColor, color: cs.color, border: cs.borderColor };
});
check(
  'WhatsApp statement is secondary (paper bg, sage text)',
  wa.ok && /255, 255, 255|252, 250, 244|247, 243, 234/.test(wa.bg || ''),
  JSON.stringify(wa)
);
await page.screenshot({ path: `${OUT}/08-khata-actions.png` });

// ── Inventory: no pulsing low-stock badges ──────────────────────────────────
await page.locator('[data-testid="nav-products"]').click();
await page.waitForTimeout(900);
const pulses = await page.evaluate(() =>
  [...document.querySelectorAll('*')].filter((el) => {
    const a = getComputedStyle(el).animationName;
    return a && a !== 'none' && el.className?.toString?.().includes('pulse');
  }).length
);
check('Inventory has no pulsing badges', pulses === 0, `animated=${pulses}`);
await page.screenshot({ path: `${OUT}/09-inventory.png` });

// ── Lock screen ─────────────────────────────────────────────────────────────
const lockBtn = page.locator('[aria-label="Lock terminal PIN"]');
await lockBtn.click();
await page.waitForTimeout(700);

const lock = await page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
  if (!dlg) return { ok: false, why: 'dialog missing' };
  const card = dlg.querySelector('div.rounded-\\[14px\\]');
  const keys = dlg.querySelectorAll('button');
  const bg = card ? getComputedStyle(card).backgroundColor : '';
  const serif = dlg.querySelector('h2');
  return {
    ok: keys.length === 12,
    cards: !!card,
    bg,
    titleFont: serif ? getComputedStyle(serif).fontFamily : '',
    text: dlg.innerText.replace(/\n/g, ' | ').slice(0, 90),
  };
});
check(
  'PIN lock renders paper card with 12 keys',
  lock.ok && lock.cards && /247, 243, 234/.test(lock.bg || ''),
  JSON.stringify(lock)
);
await page.screenshot({ path: `${OUT}/10-lock.png` });

// unlock so the rest of the app is usable
await page.locator('[role="dialog"] button', { hasText: '1' }).first().click();
await page.waitForTimeout(120);
for (const d of ['2', '3', '4']) {
  await page.locator('[role="dialog"] button', { hasText: new RegExp(`^${d}$`) }).first().click();
  await page.waitForTimeout(120);
}
await page.waitForTimeout(700);
const unlocked = await page.locator('[role="dialog"]').count();
check('PIN 1234 unlocks the counter', unlocked === 0, `dialogs=${unlocked}`);

console.log('\nconsole errors:', errors.length);
errors.slice(0, 8).forEach((e) => console.log('  -', e));

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
await browser.close();
process.exit(failed.length === 0 && errors.length === 0 ? 0 : 1);
