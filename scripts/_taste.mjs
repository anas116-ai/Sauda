import fs from 'fs';
const base = 'C:/Users/shaik/.agents/skills/ui-ux-pro-max/data/';

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c === '\r') { /* skip */ }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.length > 1).map((r) => {
    const o = {};
    head.forEach((k, i) => (o[k] = (r[i] || '').trim()));
    return o;
  });
}

const rows = (f) => parseCsv(fs.readFileSync(base + f + '.csv', 'utf8'));
const q = ['serif', 'editorial', 'luxury', 'retail', 'grocer', 'warm', 'unique', 'distinctive', 'indian', 'heritage', 'mono', 'ledger'];
const hit = (s) => q.some((k) => s.toLowerCase().includes(k));

const typ = rows('typography');
const out = [];
out.push('=== TYPOGRAPHY (' + typ.length + ' pairings) ===');
typ.forEach((t) => {
  const s = [t['Font Pairing Name'], t['Mood/Style Keywords'], t['Best For'], t['Category'], t['Heading Font'], t['Body Font']].join(' ');
  if (hit(s)) out.push(`${t['Font Pairing Name']}  ·  ${t['Heading Font']} / ${t['Body Font']}  ·  ${t['Category']}  ·  ${t['Mood/Style Keywords']}  ·  Best: ${t['Best For']}`);
});

const col = rows('colors');
out.push('');
out.push('=== COLOR (' + col.length + ') ===');
col.forEach((c) => {
  const s = [c['Product Type'], c['Notes']].join(' ');
  if (hit(s)) out.push(`${c['Product Type']}  ·  P ${c['Primary']}  BG ${c['Background']}  ACC ${c['Accent']}  ·  ${c['Notes']}`);
});

const st = rows('styles');
out.push('');
out.push('=== STYLES (' + st.length + ') ===');
st.filter((s) => (s['Status'] || '').toLowerCase() !== 'inactive').forEach((s) => {
  const k = [s['Style Category'], s['Keywords'], s['Best For']].join(' ');
  if (hit(k)) out.push(`${s['Style Category']}  ·  ${s['Primary Colors']}  ·  ${s['Keywords']}  ·  Best: ${s['Best For']}`);
});

const pf = rows('google-fonts');
out.push('');
out.push('=== FONTS trending/top unique serif+mono ===');
const picked = pf.filter((f) => {
  const fam = f.Family || '';
  return ['Fraunces', 'Instrument Serif', 'Bricolage Grotesque', 'Newsreader', 'Gambetta', 'Spectral', 'Literata', 'Source Serif 4', 'Young Serif', 'Bodoni Moda', 'DM Serif Display', 'Cormorant Garamond', 'Martian Mono', 'Space Mono', 'IBM Plex Mono', 'JetBrains Mono', 'Azeret Mono', 'Familjen Grotesk', 'General Sans', 'Satoshi', 'Chivo', 'Archivo', 'Public Sans', 'Manrope', 'Outfit', 'Sora', 'Unbounded', 'Syne', 'Bricolage Grotesque', 'Gabarito', 'Geist', 'Schibsted Grotesk', 'Instrument Sans', 'Hanken Grotesk', 'Onest', 'Figtree', 'Epilogue', 'Red Hat Display', 'Bricolage'].includes(fam);
});
picked.forEach((f) => out.push(`${f.Family}  ·  ${f.Category}  ·  ${f.Strokes || f['Stroke']}  ·  pop ${f['Popularity Rank']}  ·  ${f.Keywords.split(' ').slice(0, 6).join(', ')}`));

fs.writeFileSync('scripts/_taste.txt', out.join('\n'), 'utf8');
console.log('rows', out.length);
