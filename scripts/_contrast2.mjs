const pairs = [
  ['chilli #C0431F / paper', '#C0431F', '#F2EBDD'],
  ['chilli-text #A23A19 / paper', '#A23A19', '#F2EBDD'],
  ['chilli #A83A1B / paper', '#A83A1B', '#F2EBDD'],
  ['white / chilli-text #A23A19', '#FFFFFF', '#A23A19'],
  ['clay #B4552F / chalk', '#B4552F', '#EDE9DA'],
  ['clay-text #93401F / chalk', '#93401F', '#EDE9DA'],
  ['white / paan #1E4E3A', '#FFFFFF', '#1E4E3A'],
  ['white / neel #23306B', '#FFFFFF', '#23306B'],
  ['white / jamun #3A2344', '#FFFFFF', '#3A2344'],
  ['haldi-text #7A5510 / paper', '#7A5510', '#F2EBDD'],
  ['ink-soft #4A423A / paper', '#4A423A', '#F2EBDD'],
  ['ink-soft #453E37 / chalk', '#453E37', '#EDE9DA'],
  ['muted #6B6257 / paper', '#6B6257', '#F2EBDD'],
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
pairs.forEach(([n, a, b]) => console.log(n.padEnd(30), ratio(a, b)));
