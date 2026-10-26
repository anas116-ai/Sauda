const pairs = [
  ['A ink/paper', '#191512', '#F2EBDD'],
  ['A paper/ink', '#F2EBDD', '#191512'],
  ['A neel/paper', '#23306B', '#F2EBDD'],
  ['A chilli/paper', '#C0431F', '#F2EBDD'],
  ['A white/chilli', '#FFFFFF', '#C0431F'],
  ['A paan/paper', '#2B5A44', '#F2EBDD'],
  ['A haldi/paper', '#8A6414', '#F2EBDD'],
  ['B ink/paper', '#2A1C2E', '#F6EFDF'],
  ['B jamun/paper', '#3A2344', '#F6EFDF'],
  ['B haldi/paper', '#8F6410', '#F6EFDF'],
  ['C ink/paper', '#14201B', '#EDE9DA'],
  ['C paan/paper', '#1E4E3A', '#EDE9DA'],
  ['C clay/paper', '#B4552F', '#EDE9DA'],
  ['D ink/paper', '#1B1A17', '#F1E8D2'],
  ['D indigo/paper', '#1C2A56', '#F1E8D2'],
  ['D madder/paper', '#8B3A2E', '#F1E8D2'],
];
const lum = (hex) => {
  const c = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const l = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((l1 + 0.05) / (l2 + 0.05)).toFixed(2);
};
pairs.forEach(([n, a, b]) => console.log(n.padEnd(20), ratio(a, b)));
