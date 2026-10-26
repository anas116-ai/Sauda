import fs from 'node:fs';
import { chromium } from 'playwright';

const OUT = 'brand/concepts-v2';
fs.mkdirSync(OUT, { recursive: true });

const ink = '#14110F';
const paper = '#F7F3EA';
const copper = '#A9714B';
const copperDeep = '#8A5A38';
const indigo = '#202853';
const sage = '#2F5D4E';

const S = (x, y, size, fill, weight = 600, family = 'Fraunces') =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="middle" dominant-baseline="central">S</text>`;

const marks = [
  // ---------- 01 Ledger family ----------
  {
    id: '01',
    name: 'Folded Leaf',
    family: 'Ledger',
    idea: 'An ink ledger tile with a copper page-fold and a serif S.',
    te: 'ఇంక్ లెడ్జర్ టైల్, రాగి మడత, సెరిఫ్ S.',
    rec: true,
    svg: `<rect x="20" y="20" width="160" height="160" rx="18" fill="${ink}"/>
      <path d="M122 20h58v58z" fill="${copper}"/>
      <path d="M122 20v58h58" fill="none" stroke="${paper}" stroke-opacity=".22" stroke-width="2"/>
      ${S(97, 103, 104, paper)}`,
  },
  {
    id: '02',
    name: 'Ruled S',
    family: 'Ledger',
    idea: 'Five ledger rules joined into one S. A copper dot closes the entry.',
    te: 'ఐదు లెడ్జర్ గీతలతో ఏర్పడిన S; రాగి చుక్క ముగింపు.',
    svg: `<rect x="52" y="54" width="98" height="16" rx="4" fill="${ink}"/>
      <rect x="134" y="54" width="16" height="44" fill="${ink}"/>
      <rect x="52" y="92" width="98" height="16" rx="4" fill="${ink}"/>
      <rect x="52" y="92" width="16" height="44" fill="${ink}"/>
      <rect x="52" y="130" width="98" height="16" rx="4" fill="${ink}"/>
      <circle cx="150" cy="48" r="8" fill="${copper}"/>`,
  },
  {
    id: '03',
    name: 'The Book',
    family: 'Ledger',
    idea: 'A khata book seen from the spine — copper binding, paper S.',
    te: 'ఖాతా పుస్తకం వెన్నెముక — రాగి బైండింగ్, కాగితపు S.',
    svg: `<rect x="56" y="30" width="88" height="140" rx="10" fill="${ink}"/>
      <rect x="56" y="30" width="15" height="140" rx="7" fill="${copperDeep}"/>
      ${S(106, 92, 62, paper)}
      <rect x="88" y="136" width="48" height="5" rx="2.5" fill="${copper}"/>`,
  },
  {
    id: '04',
    name: 'Counter Seal',
    family: 'Ledger',
    idea: 'A round counter stamp: ink disc, copper ring, paper S, one register tick.',
    te: 'గుండ్రని కౌంటర్ సీల్ — ఇంక్ డిస్క్, రాగి వలయం, కాగితపు S.',
    svg: `<circle cx="100" cy="100" r="80" fill="${ink}"/>
      <circle cx="100" cy="100" r="66" fill="none" stroke="${copper}" stroke-width="3"/>
      ${S(100, 99, 78, paper)}
      <rect x="94" y="158" width="12" height="12" rx="2" fill="${copper}"/>`,
  },

  // ---------- 05 Deal family ----------
  {
    id: '05',
    name: 'Tag Cut',
    family: 'Deal',
    idea: 'A price tag whose corner is shaved in copper; the hole is the counter eyelet.',
    te: 'ధర ట్యాగ్ — రాగి మూల కోత, రంధ్రం ఐలెట్.',
    svg: `<g transform="rotate(-8 100 100)">
        <path d="M64 36h58l42 42v78a8 8 0 0 1-8 8H64a8 8 0 0 1-8-8V44a8 8 0 0 1 8-8z" fill="${ink}"/>
        <path d="M122 36l42 42-9 9-42-42z" fill="${copper}"/>
        <circle cx="78" cy="58" r="8" fill="${paper}"/>
        ${S(110, 110, 66, paper)}
      </g>`,
  },
  {
    id: '06',
    name: 'Weigh Beam',
    family: 'Deal',
    idea: 'A hanging balance reduced to ring, beam and two pans. The oldest trust device in trade.',
    te: 'తూకం — వలయం, కడ్డీ, రెండు త్రాసులు. వ్యాపారంలో పురాతన నమ్మకం.',
    svg: `<circle cx="100" cy="34" r="11" fill="none" stroke="${ink}" stroke-width="7"/>
      <rect x="44" y="62" width="112" height="10" rx="5" fill="${ink}"/>
      <path d="M50 67v30M150 67v30" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
      <path d="M24 97h52a26 26 0 0 1-52 0z" fill="${copper}"/>
      <path d="M124 97h52a26 26 0 0 1-52 0z" fill="${copper}"/>
      <rect x="88" y="62" width="24" height="24" rx="4" fill="${copperDeep}"/>`,
  },
  {
    id: '07',
    name: 'Bazaar Token',
    family: 'Deal',
    idea: 'A trade token: hard diamond, counter-cut S, one copper pin.',
    te: 'వాణిజ్య టోకెన్ — డైమండ్, కౌంటర్-కట్ S, రాగి పిన్.',
    svg: `<path d="M100 18l82 82-82 82-82-82z" fill="${ink}"/>
      <path d="M100 44l56 56-56 56-56-56z" fill="none" stroke="${copper}" stroke-width="3"/>
      ${S(100, 100, 72, paper)}
      <circle cx="100" cy="160" r="6" fill="${copper}"/>`,
  },
  {
    id: '08',
    name: 'Paper Bill',
    family: 'Deal',
    idea: 'A torn-bottom receipt with the S pressed into the paper and a copper total rule.',
    te: 'కన్నం అంచు రసీదు — కాగితంలో నొక్కిన S, రాగి మొత్తం గీత.',
    svg: `<path d="M58 40a8 8 0 0 1 8-8h68a8 8 0 0 1 8 8v116l-12 9-12-9-12 9-12-9-12 9-12-9-12 9z" fill="${ink}"/>
      ${S(100, 86, 56, paper)}
      <rect x="80" y="118" width="40" height="5" rx="2.5" fill="${copper}"/>`,
  },

  // ---------- 09 Kirana family ----------
  {
    id: '09',
    name: 'Gunny Sack',
    family: 'Kirana',
    idea: 'The sack every kirana back room runs on — copper tie, paper S.',
    te: 'కిరాణా స్టోర్ గోనె సంచి — రాగి కట్టు, కాగితపు S.',
    svg: `<path d="M74 40c0 15-15 19-19 39l-7 66c-1 15 9 25 24 25h56c15 0 25-10 24-25l-7-66c-4-20-19-24-19-39z" fill="${ink}"/>
      <rect x="74" y="30" width="52" height="13" rx="6.5" fill="${copper}"/>
      ${S(100, 116, 58, paper)}`,
  },
  {
    id: '10',
    name: 'Grain',
    family: 'Kirana',
    idea: 'One grain of rice, split by a copper vein. The smallest unit of the shop.',
    te: 'ఒక బియ్యపు గింజ, రాగి ఈనెతో చీలిక. షాప్ చిన్న యూనిట్.',
    svg: `<path d="M100 26c40 30 50 76 0 148-50-72-40-118 0-148z" fill="${ink}"/>
      <path d="M100 58v92" stroke="${copper}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="100" cy="150" r="6" fill="${copper}"/>`,
  },
  {
    id: '11',
    name: 'Awning',
    family: 'Kirana',
    idea: 'A striped shop awning over an ink shopfront. Colour is the copper stripe.',
    te: 'చారల షాప్ పందిరి, ఇంక్ షాప్ ఫ్రంట్. రంగు రాగి చార.',
    svg: `<rect x="30" y="42" width="140" height="38" fill="${copper}"/>
      <rect x="54" y="42" width="14" height="38" fill="${paper}" fill-opacity=".85"/>
      <rect x="93" y="42" width="14" height="38" fill="${paper}" fill-opacity=".85"/>
      <rect x="132" y="42" width="14" height="38" fill="${paper}" fill-opacity=".85"/>
      <rect x="46" y="80" width="108" height="86" rx="4" fill="${ink}"/>
      ${S(100, 122, 56, paper)}`,
  },
  {
    id: '12',
    name: 'Shutter',
    family: 'Kirana',
    idea: 'The shop shutter at closing time; the S is left open on the slats.',
    te: 'షట్టర్ మూసే సమయం — స్లాట్లపై S తెరిచి ఉంది.',
    svg: `<rect x="42" y="34" width="116" height="132" rx="8" fill="${ink}"/>
      <g fill="${paper}" fill-opacity=".9">
        <rect x="42" y="62" width="116" height="5"/>
        <rect x="42" y="88" width="116" height="5"/>
        <rect x="42" y="114" width="116" height="5"/>
        <rect x="42" y="140" width="116" height="5"/>
      </g>
      ${S(100, 100, 74, copper)}`,
  },

  // ---------- 13 Monogram family ----------
  {
    id: '13',
    name: 'Ribbon S',
    family: 'Monogram',
    idea: 'A single ribbon folded into an S — no container, works at any size.',
    te: 'ఒకే రిబ్బన్ మడిచి S — కంటైనర్ లేదు, ఏ సైజులోనైనా.',
    svg: `<path d="M146 60H98a28 28 0 0 0 0 56h4a28 28 0 0 1 0 56H54" fill="none" stroke="${ink}" stroke-width="20" stroke-linecap="round"/>
      <circle cx="146" cy="60" r="10" fill="${copper}"/>`,
  },
  {
    id: '14',
    name: 'Cut Tile',
    family: 'Monogram',
    idea: 'A die-cut S through a solid ink tile — the mark is the hole, not the ink.',
    te: 'ఇంక్ టైల్‌లో డై-కట్ S — గుర్తు రంధ్రం, ఇంక్ కాదు.',
    svg: `<mask id="cut14"><rect width="200" height="200" fill="white"/>${S(100, 100, 108, 'black')}</mask>
      <rect x="22" y="22" width="156" height="156" rx="26" fill="${ink}" mask="url(#cut14)"/>
      <rect x="22" y="22" width="156" height="156" rx="26" fill="none" stroke="${copper}" stroke-width="2" stroke-opacity=".5"/>`,
  },
  {
    id: '15',
    name: 'Split Tile',
    family: 'Monogram',
    idea: 'Half ink, half copper — the ledger and the deal in one square.',
    te: 'సగం ఇంక్, సగం రాగి — ఖాతా మరియు ఒప్పందం ఒకే చతురస్రంలో.',
    svg: `<path d="M22 48a26 26 0 0 1 26-26h130v130H48a26 26 0 0 1-26-26z" fill="${ink}"/>
      <path d="M178 22v130H48a26 26 0 0 1-26-26V22z" fill="${copper}" fill-opacity=".18"/>
      ${S(100, 100, 104, paper)}`,
  },
  {
    id: '16',
    name: 'Inlay',
    family: 'Monogram',
    idea: 'Paper ground, ink S, one copper inlay across the middle stroke.',
    te: 'కాగితం నేపథ్యం, ఇంక్ S, మధ్యలో రాగి ఇన్‌లే.',
    svg: `<rect x="18" y="18" width="164" height="164" rx="20" fill="${paper}" stroke="${ink}" stroke-width="3"/>
      <rect x="66" y="86" width="68" height="28" fill="${copper}"/>
      ${S(100, 100, 100, ink)}`,
  },

  // ---------- 17 Indian modern ----------
  {
    id: '17',
    name: 'Kolam S',
    family: 'Indian',
    idea: 'A stepped S drawn between kolam dots — the rangoli grid under every South Indian shop.',
    te: 'కొలం చుక్కల మధ్య మెట్ల S — ప్రతి దుకాణం కింద రంగవల్లి గ్రిడ్.',
    svg: `<g fill="${copper}">
        <circle cx="56" cy="56" r="5"/><circle cx="100" cy="56" r="5"/><circle cx="144" cy="56" r="5"/>
        <circle cx="56" cy="100" r="5"/><circle cx="100" cy="100" r="5"/><circle cx="144" cy="100" r="5"/>
        <circle cx="56" cy="144" r="5"/><circle cx="100" cy="144" r="5"/><circle cx="144" cy="144" r="5"/>
      </g>
      <path d="M144 62H72v32h56v32H56" fill="none" stroke="${ink}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>`,
  },
  {
    id: '18',
    name: 'Arch',
    family: 'Indian',
    idea: 'The shop doorway arch, held by an S and grounded on a copper lintel.',
    te: 'షాప్ ద్వారం ఆర్చ్, S పట్టుతో, రాగి గడపపై.',
    svg: `<path d="M56 158V94a44 44 0 0 1 88 0v64" fill="none" stroke="${ink}" stroke-width="14"/>
      ${S(100, 108, 46, ink, 700)}
      <rect x="46" y="166" width="108" height="8" rx="4" fill="${copper}"/>`,
  },
  {
    id: '19',
    name: 'Jute Weave',
    family: 'Indian',
    idea: 'The weave of a jute bag: copper warp, ink weft, S laid over the cloth.',
    te: 'గోనె సంచి నేత — రాగి పోక, ఇంక్ వార్ప్, వస్త్రంపై S.',
    svg: `<g stroke="${copper}" stroke-width="5" stroke-opacity=".55">
        <path d="M62 40v120M100 40v120M138 40v120"/>
        <path d="M40 62h120M40 100h120M40 138h120"/>
      </g>
      ${S(100, 100, 82, ink, 700)}`,
  },
  {
    id: '20',
    name: 'Block Print',
    family: 'Indian',
    idea: 'A carved woodblock stamp: ink square, paper S, copper registration dots.',
    te: 'చెక్క బ్లాక్ స్టాంప్ — ఇంక్ చతురస్రం, కాగితపు S, రాగి చుక్కలు.',
    svg: `<g fill="${copper}">
        <circle cx="24" cy="24" r="5"/><circle cx="100" cy="24" r="5"/><circle cx="176" cy="24" r="5"/>
        <circle cx="24" cy="176" r="5"/><circle cx="100" cy="176" r="5"/><circle cx="176" cy="176" r="5"/>
      </g>
      <rect x="40" y="40" width="120" height="120" rx="10" fill="${ink}"/>
      ${S(100, 101, 76, paper)}`,
  },

  // ---------- 21 Wordmarks ----------
  {
    id: '21',
    name: 'Sauda Serif',
    family: 'Wordmark',
    idea: 'Fraunces wordmark with a swashed S and a copper ledger rule beneath.',
    te: 'ఫ్రాంసెస్ వర్డ్‌మార్క్, స్వాష్ S, కింద రాగి లెడ్జర్ గీత.',
    wide: true,
    svg: `<g font-family="Fraunces" font-weight="600">
        <text x="100" y="88" font-size="54" fill="${ink}" text-anchor="middle" letter-spacing="-1.5">sauda</text>
      </g>
      <circle cx="152" cy="104" r="5" fill="${copper}"/>
      <rect x="34" y="122" width="132" height="4" rx="2" fill="${copper}"/>
      <text x="100" y="146" font-family="IBM Plex Mono" font-size="11" fill="${ink}" fill-opacity=".55" text-anchor="middle" letter-spacing="5">KIRANA LEDGER</text>`,
  },
  {
    id: '22',
    name: 'Sauda Slab',
    family: 'Wordmark',
    idea: 'Uppercase slab wordmark on a tight grid — the signboard outside the shop.',
    te: 'అప్పర్‌కేస్ స్లాబ్ వర్డ్‌మార్క్ — షాప్ బయటి సైన్‌బోర్డ్.',
    wide: true,
    svg: `<text x="100" y="86" font-family="Fraunces" font-weight="700" font-size="40" fill="${ink}" text-anchor="middle" letter-spacing="3">SAUDA</text>
      <rect x="30" y="104" width="140" height="1.5" fill="${ink}"/>
      <text x="100" y="130" font-family="IBM Plex Mono" font-size="10" fill="${copperDeep}" text-anchor="middle" letter-spacing="3.4">THE KIRANA LEDGER</text>`,
  },
  {
    id: '23',
    name: 'Seal Mark',
    family: 'Wordmark',
    idea: 'Stacked seal: SAUDA over an S monogram, ruled like a receipt header.',
    te: 'సీల్ మార్క్ — SAUDA పైన, S మోనోగ్రామ్ కింద, రసీదు శీర్షికలా.',
    wide: true,
    svg: `<text x="100" y="56" font-family="Instrument Sans" font-weight="600" font-size="26" fill="${ink}" text-anchor="middle" letter-spacing="6">SAUDA</text>
      <rect x="46" y="70" width="108" height="1.5" fill="${copper}"/>
      ${S(100, 112, 62, ink)}
      <text x="100" y="152" font-family="IBM Plex Mono" font-size="9.5" fill="${ink}" fill-opacity=".5" text-anchor="middle" letter-spacing="3.2">EST. KIRANA</text>`,
  },
  {
    id: '24',
    name: 'Ledger Rule',
    family: 'Wordmark',
    idea: 'Lowercase wordmark sitting on a ledger line, closed with a copper stop.',
    te: 'చిన్న అక్షరాల వర్డ్‌మార్క్ లెడ్జర్ గీతపై, రాగి బిందువుతో ముగింపు.',
    wide: true,
    svg: `<text x="30" y="102" font-family="Fraunces" font-weight="500" font-size="56" fill="${ink}" letter-spacing="-2">sauda</text>
      <circle cx="170" cy="96" r="6" fill="${copper}"/>
      <rect x="30" y="120" width="140" height="3" rx="1.5" fill="${ink}"/>
      <rect x="30" y="132" width="92" height="3" rx="1.5" fill="${ink}" fill-opacity=".22"/>`,
  },
];

const card = (m) => {
  const [a, b] = m.wide ? ['0 0 200 170', 'wide'] : ['0 0 200 200', 'square'];
  return `
  <article class="card">
    <header>
      <span class="num">${m.id}</span>
      <span class="fam">${m.family}</span>
      ${m.rec ? '<span class="pick">editor pick</span>' : ''}
    </header>
    <div class="stage ${b}">
      <svg viewBox="${a}" role="img" aria-label="${m.name}">${m.svg}</svg>
    </div>
    <div class="sizes">
      <span class="sz64"><svg viewBox="${a}">${m.svg}</svg></span>
      <span class="sz32"><svg viewBox="${a}">${m.svg}</svg></span>
      <span class="sz16"><svg viewBox="${a}">${m.svg}</svg></span>
      <span class="sizelabel">64 · 32 · 16</span>
    </div>
    <h3>${m.name}</h3>
    <p>${m.idea}</p>
    <p class="te">${m.te}</p>
  </article>`;
};

const head = (page, total) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Sauda — Identity Concepts ${page}/2</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Telugu:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{--ink:${ink};--paper:${paper};--copper:${copper};--rule:#DBD2BE;--card:#FBF7EE;--stone:#6B6357}
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--paper);color:var(--ink)}
  body{font-family:'Instrument Sans',system-ui,sans-serif;padding:44px 44px 56px;width:1440px}
  .hdr{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--ink);padding-bottom:14px}
  .hdr h1{font-family:'Fraunces',serif;font-weight:600;font-size:40px;letter-spacing:-1.2px;margin:0;line-height:1}
  .hdr .sub{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--stone);margin-top:10px}
  .hdr .meta{text-align:right;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;color:var(--stone);line-height:1.9}
  .strip{display:flex;gap:0;margin:18px 0 26px;border:1px solid var(--rule)}
  .strip div{flex:1;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;border-right:1px solid var(--rule);color:var(--stone)}
  .strip div:last-child{border-right:0}
  .strip b{color:var(--ink);font-weight:500}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .card{background:var(--card);border:1px solid var(--rule);padding:16px 16px 18px;display:flex;flex-direction:column;min-height:352px}
  .card header{display:flex;align-items:center;gap:9px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--stone)}
  .card .num{color:var(--copper);font-size:11px}
  .card .fam{padding-left:9px;border-left:1px solid var(--rule)}
  .card .pick{margin-left:auto;color:var(--copper);border:1px solid rgba(169,113,75,.45);padding:2px 6px;font-size:8px;letter-spacing:.12em}
  .stage{height:170px;display:flex;align-items:center;justify-content:center;margin:10px 0 6px}
  .stage svg{width:132px;height:132px;overflow:visible}
  .stage.wide svg{width:200px;height:150px}
  .sizes{display:flex;align-items:center;gap:14px;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:8px 2px;margin-bottom:12px;min-height:52px}
  .sizes svg{display:block}
  .sz64 svg{width:46px;height:46px}
  .sz32 svg{width:28px;height:28px}
  .sz16 svg{width:16px;height:16px}
  .sizelabel{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:.14em;color:#9A9184}
  .card h3{font-family:'Fraunces',serif;font-weight:600;font-size:19px;margin:0 0 4px;letter-spacing:-.2px}
  .card p{margin:0;font-size:11.5px;line-height:1.5;color:var(--stone)}
  .card .te{font-family:'Noto Sans Telugu',sans-serif;font-size:11px;line-height:1.75;color:#7B7264;margin-top:5px}
  .foot{display:flex;justify-content:space-between;margin-top:26px;padding-top:12px;border-top:1px solid var(--rule);font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.16em;color:var(--stone)}
</style></head><body>
<div class="hdr">
  <div><h1>Sauda — Identity Concepts</h1><div class="sub">Round 02 · 24 marks · ledger · deal · kirana · monogram · indian · wordmark</div></div>
  <div class="meta">SAUDA / సౌదా<br>KIRANA LEDGER &amp; POS<br>SHEET ${page} OF 2 · ${total} CONCEPTS</div>
</div>
<div class="strip">
  <div>INK <b>#14110F</b></div><div>PAPER <b>#F7F3EA</b></div><div>COPPER <b>#A9714B</b></div><div>INDIGO <b>#202853</b></div><div>KIRANA RED <b>#7A2E35</b></div>
</div>
<div class="grid">`;

const foot = (page) => `</div>
<div class="foot"><span>SAUDA IDENTITY · CONCEPT SHEET ${page}/2</span><span>ALL MARKS SHOWN AT 64 / 32 / 16 PX</span><span>SELECT ONE OR MIX ELEMENTS</span></div>
</body></html>`;

const p1 = marks.slice(0, 12);
const p2 = marks.slice(12);
fs.writeFileSync(`${OUT}/page1.html`, head(1, 24) + p1.map(card).join('\n') + foot(1), 'utf8');
fs.writeFileSync(`${OUT}/page2.html`, head(2, 24) + p2.map(card).join('\n') + foot(2), 'utf8');

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
for (const [file, name] of [['page1', 'sheet-1'], ['page2', 'sheet-2']]) {
  await page.goto(`file://${process.cwd().replace(/\\/g, '/')}/${OUT}/${file}.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  const box = await page.locator('.grid').boundingBox();
  console.log(name, 'grid', box?.width, box?.height);
}
await browser.close();
console.log('concepts', marks.length);
