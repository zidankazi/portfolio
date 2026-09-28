import assert from 'node:assert/strict';
import test from 'node:test';
import { brighten, saturation_of, tame } from '../build/dev/javascript/portfolio/lib/palette.mjs';

test('preserves the existing album-art colors across black, gray, bright, and dark palettes', () => {
  const samples = [
    { color: [0, 0, 0], saturation: 0, wash: [0, 0, 0], accent: [0, 0, 0] },
    { color: [128, 128, 128], saturation: 0, wash: [155, 155, 155], accent: [225, 225, 225] },
    { color: [255, 255, 255], saturation: 0, wash: [155, 155, 155], accent: [255, 255, 255] },
    { color: [255, 0, 0], saturation: 1, wash: [155, 18, 18], accent: [255, 0, 0] },
    { color: [0, 255, 0], saturation: 1, wash: [31, 155, 31], accent: [0, 255, 0] },
    { color: [0, 0, 255], saturation: 1, wash: [7, 7, 155], accent: [0, 0, 255] },
    { color: [1, 2, 3], saturation: 2 / 3, wash: [4, 6, 8], accent: [75, 150, 225] },
    { color: [64, 128, 192], saturation: 2 / 3, wash: [73, 114, 155], accent: [75, 150, 225] },
  ];

  for (const { color, saturation, wash, accent } of samples) {
    const input = Object.freeze(color);
    assert.equal(saturation_of(input), saturation);
    assert.deepEqual(tame(input), wash);
    assert.deepEqual(brighten(input, 225), accent);
  }

  assert.deepEqual(brighten([64, 128, 192], 100), [64, 128, 192]);
  assert.deepEqual(brighten([64, 128, 192], 300), [100, 200, 255]);
});
