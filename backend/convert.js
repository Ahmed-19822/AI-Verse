import fs from 'fs';
const css = fs.readFileSync('../frontend/src/styles/index.css', 'utf8');

const hexToRgb = (hex) => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
};

const updatedCss = css.replace(/--color-([a-z-]+):\s*#([0-9a-fA-F]+);/g, (match, name, hex) => {
  return `--color-${name}: ${hexToRgb(hex)};`;
});

fs.writeFileSync('../frontend/src/styles/index.css', updatedCss);
console.log('Done!');
