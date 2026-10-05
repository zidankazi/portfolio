// Convert the engraved source into aligned ASCII tone layers. The bitmap is a
// build input only; the page renders letters, not an image of letters.
import {writeLayers,writeWraps} from './art.mjs';
import sharp from 'sharp';

const COLS = 100;
const ROWS = 60;
const FONT_SIZE = 4;
const CELL_WIDTH = FONT_SIZE * 0.6;
const source = new URL('../assets/puppet/chrome-hand.png', import.meta.url);
const pixels = await sharp(source.pathname)
  .flatten({ background: '#000000' })
  .resize(COLS, ROWS, { fit: 'fill', kernel: 'lanczos3' })
  .greyscale()
  .linear(1.35, -30)
  .raw()
  .toBuffer();

function encode(mirror = false) {
  const layers = [[], [], []];
  for (let y = 0; y < ROWS; y++) {
    const rows = ['', '', ''];
    for (let x = 0; x < COLS; x++) {
      const value = pixels[y * COLS + (mirror ? COLS - x - 1 : x)] / 255;
      let glyph = ' ';
      let layer = 0;
      if (value > 0.055) {
        const ramp = 'iltvzxcakdmw';
        glyph = ramp[Math.min(ramp.length - 1, Math.floor(value * ramp.length))];
        layer = value > 0.66 ? 2 : value > 0.3 ? 1 : 0;
      }
      for (let i = 0; i < 3; i++) rows[i] += i === layer ? glyph : ' ';
    }
    rows.forEach((row, i) => layers[i].push(row));
  }
  return layers.map(rows => rows.map(row => row.trimEnd()).join('\n'));
}

// String coils sit above the nails, from the little finger to the index.
const bindings = [
  { x: 0.124, y: 0.705, rx: 0.047, ry: 0.014 },
  { x: 0.315, y: 0.787, rx: 0.051, ry: 0.015 },
  { x: 0.512, y: 0.820, rx: 0.051, ry: 0.015 },
  { x: 0.719, y: 0.752, rx: 0.050, ry: 0.015 },
];
const width = COLS * CELL_WIDTH;
const height = ROWS * FONT_SIZE;
const wraps = bindings.map(({ x, y, rx, ry }) => ({
  x: Number((x * width).toFixed(2)), y: Number((y * height).toFixed(2)),
  rx: Number((rx * width).toFixed(2)), ry: Number((ry * height).toFixed(2)),
}));
writeLayers('hand_left',encode());
writeLayers('hand_right',encode(true));
writeWraps(wraps);
console.log(`Wrote ${COLS} × ${ROWS} ASCII hands with three registered tone layers.`);
