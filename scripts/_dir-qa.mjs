import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const page = await ctx.newPage();

const base = `file:///${process.cwd().replace(/\\/g, '/')}/brand/concepts-v2/`;

for (const f of ['dir-type', 'dir-color']) {
  await page.goto(base + f + '.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const out = { problems: [], fonts: {}, scroll: '' };
    out.fonts = {
      bricolage: document.fonts.check('600 32px "Bricolage Grotesque"'),
      archivo: document.fonts.check('400 13px Archivo'),
      martian: document.fonts.check('500 40px "Martian Mono"'),
      anekTe: document.fonts.check('500 24px "Anek Telugu"'),
      gloock: document.fonts.check('400 32px Gloock'),
      spline: document.fonts.check('400 13px "Spline Sans"'),
      azeret: document.fonts.check('400 40px "Azeret Mono"'),
      ramaraja: document.fonts.check('400 24px Ramaraja'),
      unbounded: document.fonts.check('600 32px Unbounded'),
      anekLatin: document.fonts.check('400 13px "Anek Latin"'),
      spaceMono: document.fonts.check('400 40px "Space Mono"'),
      baloo: document.fonts.check('500 24px "Baloo Tammudu 2"'),
    };
    document.querySelectorAll('.sample, section > div').forEach((el, i) => {
      if (el.scrollWidth > el.clientWidth + 1) out.problems.push(`block ${i} h-overflow ${el.scrollWidth}/${el.clientWidth}`);
      if (el.scrollHeight > el.clientHeight + 1) out.problems.push(`block ${i} v-clip ${el.scrollHeight}/${el.clientHeight}`);
    });
    document.querySelectorAll('.te').forEach((el, i) => {
      const cs = getComputedStyle(el);
      const lh = parseFloat(cs.lineHeight);
      if (el.getBoundingClientRect().height < lh * 0.9) out.problems.push(`telugu line ${i} collapsed`);
    });
    const d = document.documentElement;
    out.scroll = d.scrollWidth > d.clientWidth ? `${d.scrollWidth}>${d.clientWidth}` : 'none';
    out.h = d.scrollHeight;
    return out;
  });
  console.log(f, JSON.stringify(r, null, 1));
}
await browser.close();
