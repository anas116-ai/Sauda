import fs from 'node:fs';
import { chromium } from 'playwright';

const OUT = 'brand/concepts-v2';
fs.mkdirSync(OUT, { recursive: true });

const head = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anek+Latin:wght@400;500;600&family=Anek+Telugu:wght@400;500;600&family=Archivo:wght@400;500;600;700&family=Azeret+Mono:wght@400;500;600&family=Baloo+Tammudu+2:wght@400;500;600&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Gloock&family=Martian+Mono:wght@400;500;600&family=Ramaraja&family=Space+Mono:wght@400;700&family=Spline+Sans:wght@400;500;600&family=Unbounded:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #eceae4; font-family: system-ui, sans-serif; }
  .sheet { width: 1440px; padding: 56px 64px 72px; background: #eceae4; }
  .kicker { font: 500 11px/1 "Martian Mono", monospace; letter-spacing: .18em; text-transform: uppercase; color: #6b6257; }
  h1 { font: 600 40px/1.05 "Bricolage Grotesque", sans-serif; color: #191512; letter-spacing: -0.02em; margin-top: 10px; }
  .sub { font: 400 14px/1.6 Archivo, sans-serif; color: #4A423A; margin-top: 8px; max-width: 720px; }
  .route { margin-top: 34px; border-top: 1px solid rgba(25,21,18,.18); padding-top: 26px; display: grid; grid-template-columns: 250px 1fr; gap: 40px; }
  .route-no { font: 600 13px/1 "Martian Mono", monospace; color: #A23A19; letter-spacing: .06em; }
  .route h2 { font-size: 26px; margin: 8px 0 4px; line-height: 1.1; letter-spacing: -0.01em; }
  .route .meta { font: 400 12px/1.7 Archivo, sans-serif; color: #4A423A; }
  .route .meta b { color: #191512; font-weight: 600; }
  .rec { display: inline-block; margin-top: 10px; font: 600 10px/1 "Martian Mono", monospace; letter-spacing: .1em; text-transform: uppercase; padding: 6px 9px; border: 1px solid #2B5A44; color: #2B5A44; border-radius: 3px; }
  .sample { background: #F2EBDD; border: 1px solid rgba(25,21,18,.12); padding: 26px 28px 22px; }
  .sample .store { font-size: 32px; line-height: 1.1; letter-spacing: -0.02em; color: #191512; }
  .sample .te { font-size: 24px; line-height: 1.45; letter-spacing: 0; color: #191512; margin-top: 6px; }
  .sample .money { margin-top: 18px; display: flex; align-items: baseline; gap: 14px; }
  .sample .money .val { font-size: 46px; line-height: 1; letter-spacing: -0.02em; color: #191512; font-variant-numeric: tabular-nums; }
  .sample .money .lab { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #6B6257; }
  .sample .row { margin-top: 18px; display: flex; justify-content: space-between; font-size: 13px; color: #191512; border-top: 1px solid rgba(25,21,18,.12); padding-top: 9px; }
  .sample .row span:last-child { font-variant-numeric: tabular-nums; }
  .sample .tiny { margin-top: 14px; font-size: 11px; color: #6B6257; }
  .fonts-inline { display: flex; gap: 22px; margin-top: 14px; flex-wrap: wrap; font-size: 11px; color: #4A423A; }
  .fonts-inline b { display: block; font-size: 12px; color: #191512; font-weight: 600; margin-bottom: 3px; }
</style>`;

const routes = [
  {
    no: 'ROUTE 01',
    name: 'Bazaar Modern',
    rec: true,
    fonts: [
      ['Display', 'Bricolage Grotesque', '600'],
      ['UI / body', 'Archivo', '400 / 500'],
      ['Numerals', 'Martian Mono', '500'],
      ['Telugu', 'Anek Telugu', '400 / 500'],
    ],
    display: 'Bricolage Grotesque',
    ui: 'Archivo',
    mono: 'Martian Mono',
    te: 'Anek Telugu',
    note: 'Variable grotesque with wonky shoulders — shop-signage modern, not a startup template.',
  },
  {
    no: 'ROUTE 02',
    name: 'Ledger Press',
    rec: false,
    fonts: [
      ['Display', 'Gloock', '400'],
      ['UI / body', 'Spline Sans', '400 / 500'],
      ['Numerals', 'Azeret Mono', '400'],
      ['Telugu', 'Ramaraja', '400'],
    ],
    display: 'Gloock',
    ui: 'Spline Sans',
    mono: 'Azeret Mono',
    te: 'Ramaraja',
    note: 'High-contrast serif like a 1960s bill-book cover. Most premium, least fast-counter.',
  },
  {
    no: 'ROUTE 03',
    name: 'Signal Slab',
    rec: false,
    fonts: [
      ['Display', 'Unbounded', '600'],
      ['UI / body', 'Anek Latin', '400 / 500'],
      ['Numerals', 'Space Mono', '400'],
      ['Telugu', 'Baloo Tammudu 2', '400 / 500'],
    ],
    display: 'Unbounded',
    ui: 'Anek Latin',
    mono: 'Space Mono',
    te: 'Baloo Tammudu 2',
    note: 'Wide geometric display, poster-loud. Great on a shutter, tiring inside a dense POS.',
  },
];

const typeHtml = `<!doctype html><html><head><meta charset="utf-8">${head}</head><body><div class="sheet">
  <div class="kicker">Sauda · rebrand round 02 · type</div>
  <h1>Three type routes</h1>
  <p class="sub">Same content set in all three so you can compare at real size: a store name, a Telugu label, a big rupee figure and a dense line item. Nothing here is final until you pick.</p>
  ${routes
    .map(
      (r) => `
  <section class="route">
    <div>
      <div class="route-no">${r.no}</div>
      <h2 style="font-family:'${r.display}'; font-weight:${r.display === 'Gloock' ? 400 : 600};">${r.name}</h2>
      <div class="meta">${r.note}</div>
      ${r.rec ? '<div class="rec">recommended</div>' : ''}
      <div class="fonts-inline">
        ${r.fonts
          .map(
            ([role, fam, wt]) =>
              `<div><b style="font-family:'${fam}'">${fam}</b>${role} · ${wt}</div>`
          )
          .join('')}
      </div>
    </div>
    <div class="sample">
      <div class="store" style="font-family:'${r.display}'; font-weight:${r.display === 'Gloock' ? 400 : 600};">Sri Lakshmi General Store</div>
      <div class="te" style="font-family:'${r.te}'; font-weight:500;">సౌదా ఖాతా పుస్తకం · నేటి అమ్మకం</div>
      <div class="money">
        <div class="val" style="font-family:'${r.mono}'; font-weight:500;">₹18,450.00</div>
        <div class="lab" style="font-family:'${r.ui}';">Today · 26 Oct</div>
      </div>
      <div class="row" style="font-family:'${r.ui}';"><span>కందిపప్పు Toor Dal 1 kg</span><span style="font-family:'${r.mono}'">₹170.00</span></div>
      <div class="row" style="font-family:'${r.ui}';"><span>సోనా బియ్యం Sona Rice 25 kg</span><span style="font-family:'${r.mono}'">₹1,550.00</span></div>
      <div class="tiny" style="font-family:'${r.ui}';">Cash ₹9,120 · UPI ₹5,830 · Khata ₹3,500 — tabular figures keep the column straight.</div>
    </div>
  </section>`
    )
    .join('')}
</div></body></html>`;

const palettes = [
  {
    id: 'A',
    name: 'Chilli & Neel',
    rec: true,
    paper: '#F2EBDD',
    ink: '#191512',
    inkSoft: '#4A423A',
    muted: '#6B6257',
    accent: '#A23A19',
    accentRaw: '#C0431F',
    in: '#23306B',
    ok: '#2B5A44',
    warn: '#7A5510',
    swatches: [
      ['Ink', '#191512', '15.30'],
      ['Paper', '#F2EBDD', '—'],
      ['Chilli text', '#A23A19', '5.61'],
      ['Chilli graphic', '#C0431F', '4.36'],
      ['Neel', '#23306B', '10.37'],
      ['Paan', '#2B5A44', '6.68'],
      ['Haldi', '#7A5510', '5.65'],
      ['Muted', '#6B6257', '5.04'],
    ],
    line: 'Mirchi red + indigo. Red means money owed, never decoration.',
  },
  {
    id: 'B',
    name: 'Haldi & Jamun',
    rec: false,
    paper: '#F6EFDF',
    ink: '#2A1C2E',
    inkSoft: '#4B3A4F',
    muted: '#6E5C72',
    accent: '#3A2344',
    accentRaw: '#3A2344',
    in: '#3A2344',
    ok: '#2F5A46',
    warn: '#8F6410',
    swatches: [
      ['Plum ink', '#2A1C2E', '14.06'],
      ['Warm paper', '#F6EFDF', '—'],
      ['Jamun', '#3A2344', '12.19'],
      ['Haldi', '#8F6410', '4.58'],
      ['Plum soft', '#4B3A4F', '7.10'],
      ['Muted', '#6E5C72', '4.90'],
    ],
    line: 'Turmeric and black plum — a mithai box. Warmer, softer, no red urgency.',
  },
  {
    id: 'C',
    name: 'Paan & Chalk',
    rec: false,
    paper: '#EDE9DA',
    ink: '#14201B',
    inkSoft: '#3E4A44',
    muted: '#5F6B64',
    accent: '#93401F',
    accentRaw: '#B4552F',
    in: '#1E4E3A',
    ok: '#1E4E3A',
    warn: '#6F5A18',
    swatches: [
      ['Green-black', '#14201B', '13.79'],
      ['Chalk', '#EDE9DA', '—'],
      ['Paan', '#1E4E3A', '7.83'],
      ['Clay text', '#93401F', '5.77'],
      ['Clay graphic', '#B4552F', '4.03'],
      ['Muted', '#5F6B64', '4.86'],
    ],
    line: 'Betel leaf on chalkboard — calm, village rate-board. Green is the expected money colour.',
  },
  {
    id: 'D',
    name: 'Neel & Brass',
    rec: false,
    paper: '#F1E8D2',
    ink: '#1B1A17',
    inkSoft: '#46433B',
    muted: '#6A665C',
    accent: '#8B3A2E',
    accentRaw: '#8B3A2E',
    in: '#1C2A56',
    ok: '#2A5343',
    warn: '#7C5E18',
    swatches: [
      ['Ink', '#1B1A17', '14.26'],
      ['Sand', '#F1E8D2', '—'],
      ['Indigo', '#1C2A56', '11.36'],
      ['Madder', '#8B3A2E', '6.28'],
      ['Ink soft', '#46433B', '8.09'],
      ['Muted', '#6A665C', '4.76'],
    ],
    line: 'Closest to the rejected copper direction — listed for comparison, not recommended.',
  },
];

const colorHtml = `<!doctype html><html><head><meta charset="utf-8">${head}</head><body><div class="sheet">
  <div class="kicker">Sauda · rebrand round 02 · colour</div>
  <h1>Four palettes, in context</h1>
  <p class="sub">Each palette is shown as a real dashboard fragment, not chips on white. Contrast ratios are measured on that palette's paper. Route A is what I would ship.</p>
  ${palettes
    .map((p) => {
      const dark = p.paper === '#F2EBDD' ? false : false;
      return `
  <section class="route" style="grid-template-columns: 250px 1fr;">
    <div>
      <div class="route-no" style="color:${p.accent}">PALETTE ${p.id}</div>
      <h2 style="font-family:'Bricolage Grotesque'; font-weight:600; color:${p.ink};">${p.name}</h2>
      <div class="meta" style="color:${p.inkSoft}">${p.line}</div>
      ${p.rec ? `<div class="rec" style="border-color:${p.ok}; color:${p.ok}">recommended</div>` : ''}
      <div style="margin-top:14px; display:grid; grid-template-columns:1fr 1fr; gap:6px 10px;">
        ${p.swatches
          .map(
            ([n, hex, ratio]) => `<div style="display:flex; align-items:center; gap:7px;">
              <span style="width:14px;height:14px;border-radius:2px;background:${hex};border:1px solid rgba(0,0,0,.18);display:inline-block;"></span>
              <span style="font:500 10px/1.4 'Martian Mono',monospace; color:${p.inkSoft}">${hex}<br><span style="color:${p.muted}">${n} ${ratio}</span></span>
            </div>`
          )
          .join('')}
      </div>
    </div>
    <div style="background:${p.paper}; border:1px solid rgba(0,0,0,.12); padding:0;">
      <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 22px; border-bottom:1px solid ${p.ink}22;">
        <div style="font:600 12px/1 'Bricolage Grotesque'; letter-spacing:.02em; color:${p.ink};">SAUDA <span style="font:400 11px/1 'Martian Mono'; color:${p.muted}; letter-spacing:.1em;">KIRANA LEDGER</span></div>
        <div style="font:400 11px/1 'Martian Mono'; color:${p.muted};">26 OCT · 17:26</div>
      </div>
      <div style="padding:20px 22px 18px;">
        <div style="font:400 11px/1 'Martian Mono'; letter-spacing:.16em; color:${p.muted}; text-transform:uppercase;">The day tape · sales</div>
        <div style="display:flex; align-items:baseline; gap:12px; margin-top:8px;">
          <div style="font:500 40px/1 'Martian Mono'; color:${p.ink}; font-variant-numeric:tabular-nums;">₹18,450</div>
          <div style="font:500 11px/1 'Archivo'; color:${p.ok};">▲ ₹340 vs yesterday</div>
        </div>
        <div style="display:flex; gap:8px; margin-top:14px;">
          <span style="font:500 10px/1 'Archivo'; padding:6px 9px; border:1px solid ${p.in}55; color:${p.in}; border-radius:3px;">UPI ₹5,830</span>
          <span style="font:500 10px/1 'Archivo'; padding:6px 9px; border:1px solid ${p.accent}55; color:${p.accent}; border-radius:3px;">Khata ₹3,500</span>
          <span style="font:500 10px/1 'Archivo'; padding:6px 9px; border:1px solid ${p.warn}66; color:${p.warn}; border-radius:3px;">Watch · Toor dal 2d</span>
          <span style="font:500 10px/1 'Archivo'; padding:6px 9px; border:1px solid ${p.ok}55; color:${p.ok}; border-radius:3px;">Settled · 41 bills</span>
        </div>
        <div style="margin-top:18px;">
          <div style="display:flex; justify-content:space-between; font:400 12px/1.9 'Archivo'; color:${p.ink}; border-top:1px solid ${p.ink}18;">
            <span>Ramesh Ji · 42 days</span><span style="font-family:'Martian Mono'; font-variant-numeric:tabular-nums; color:${p.accent};">₹780 due</span>
          </div>
          <div style="display:flex; justify-content:space-between; font:400 12px/1.9 'Archivo'; color:${p.ink}; border-top:1px solid ${p.ink}18;">
            <span>#004 · Counter cash</span><span style="font-family:'Martian Mono'; font-variant-numeric:tabular-nums;">₹380</span>
          </div>
          <div style="display:flex; justify-content:space-between; font:400 12px/1.9 'Archivo'; color:${p.ink}; border-top:1px solid ${p.ink}18;">
            <span>#003 · Ramesh Ji · Cash</span><span style="font-family:'Martian Mono'; font-variant-numeric:tabular-nums; color:${p.ok};">₹780 paid</span>
          </div>
        </div>
      </div>
    </div>
  </section>`;
    })
    .join('')}
</div></body></html>`;

fs.writeFileSync(`${OUT}/dir-type.html`, typeHtml, 'utf8');
fs.writeFileSync(`${OUT}/dir-color.html`, colorHtml, 'utf8');

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();

for (const [file, png] of [
  ['dir-type', 'type-routes.png'],
  ['dir-color', 'palettes.png'],
]) {
  await page.goto(`file:///${process.cwd().replace(/\\/g, '/')}/${OUT}/${file}.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(file, 'height', h);
  await page.screenshot({ path: `${OUT}/${png}`, fullPage: true });
}

await browser.close();
