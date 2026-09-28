import assert from 'node:assert/strict';
import test from 'node:test';
import { Bounds, Point, Size, place } from '../build/dev/javascript/portfolio/lib/preview_position.mjs';

test('previews use available margins, flip near edges, and fit small viewports', () => {
  const samples = [
    { name: 'right margin with cursor drift', cursor: [600, 500], row: [460, 980], viewport: [1440, 1000], size: [280, 210], expected: [1003.5, 395, 280, 210] },
    { name: 'left margin', cursor: [600, 500], row: [450, 950], viewport: [1100, 1000], size: [280, 210], expected: [150, 395, 280, 210] },
    { name: 'flip left and clamp top', cursor: [650, 10], row: [200, 700], viewport: [800, 800], size: [280, 210], expected: [350, 16, 280, 210] },
    { name: 'follow cursor and clamp bottom', cursor: [120, 790], row: [100, 650], viewport: [800, 800], size: [280, 210], expected: [140, 574, 280, 210] },
    { name: 'shrink both dimensions', cursor: [100, 50], row: [20, 180], viewport: [200, 100], size: [280, 210], expected: [16, 16, 168, 68] },
    { name: 'portrait preview', cursor: [600, 500], row: [460, 980], viewport: [1440, 1000], size: [220, 360], expected: [1003.5, 320, 220, 360] },
    { name: 'exact right-edge fit', cursor: [600, 500], row: [460, 1124], viewport: [1440, 1000], size: [280, 210], expected: [1144, 395, 280, 210] },
  ];

  for (const { name, cursor, row, viewport, size, expected } of samples) {
    const result = place(new Point(...cursor), new Bounds(...row), new Size(...viewport), new Size(...size));
    assert.deepEqual([result.left, result.top, result.width, result.height], expected, name);
    assert.ok(result.left >= 16 && result.top >= 16, name);
    assert.ok(result.left + result.width <= viewport[0] - 16, name);
    assert.ok(result.top + result.height <= viewport[1] - 16, name);
  }
});
