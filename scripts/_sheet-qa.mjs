import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const base = `file:///${process.cwd().replace(/\\/g, '/')}/brand/concepts-v2/`;

for (const f of ['page1', 'page2']) {
  await page.goto(base + f + '.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const report = await page.evaluate(() => {
    const out = {};
    out.fonts = {
      fraunces: document.fonts.check('600 40px Fraunces'),
      instrument: document.fonts.check('400 14px "Instrument Sans"'),
      mono: document.fonts.check('400 12px "IBM Plex Mono"'),
      telugu: document.fonts.check('400 12px "Noto Sans Telugu"'),
    };
    const cards = [...document.querySelectorAll('.card')];
    out.cards = cards.length;
    out.cols = getComputedStyle(document.querySelector('.grid')).gridTemplateColumns;
    out.problems = [];

    cards.forEach((c, i) => {
      const stage = c.querySelector('.stage');
      const svg = stage.querySelector('svg');
      const sb = svg.getBoundingClientRect();
      const st = stage.getBoundingClientRect();
      if (sb.left < st.left - 1 || sb.right > st.right + 1 || sb.top < st.top - 1 || sb.bottom > st.bottom + 1) {
        out.problems.push(`card ${i + 1}: svg overflows stage (${Math.round(sb.width)}x${Math.round(sb.height)})`);
      }
      const h3 = c.querySelector('h3');
      if (h3.scrollWidth > h3.clientWidth + 1) out.problems.push(`card ${i + 1}: title overflow`);
      const te = c.querySelector('.te');
      if (te.scrollHeight > te.clientHeight + 1) out.problems.push(`card ${i + 1}: telugu clipped`);
      if (sb.width < 60) out.problems.push(`card ${i + 1}: svg too small ${Math.round(sb.width)}px`);
    });

    const doc = document.documentElement;
    out.hScroll = doc.scrollWidth > doc.clientWidth ? `${doc.scrollWidth} > ${doc.clientWidth}` : 'none';
    out.height = doc.scrollHeight;

    // tiny-size legibility: marks at 16px must have non-empty paint
    out.tiny = [...document.querySelectorAll('.sz16 svg')].map((s, i) => {
      const b = s.getBoundingClientRect();
      return `${i + 1}:${Math.round(b.width)}x${Math.round(b.height)}`;
    });
    return out;
  });

  console.log('---', f);
  console.log(JSON.stringify(report, null, 2));
}
await browser.close();
