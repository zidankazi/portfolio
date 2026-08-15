// Generates the letter-built cyber-sigilism strip for the side rails.
// A techno-organic exoskeleton: a barbed spine anchored at every joint by a
// four-point chrome starburst and a hollow diamond node, throwing recursive
// tendrils that creep, branch and taper into needle points, with skeletal
// hollow ribs and barbed-wire webbing slung between joints. Lines are kept
// razor-thin and forms stay open, so the structure reads as a skeletal frame
// rather than a solid mass. Strokes rasterize to a pixel canvas, then each
// character cell's ink coverage picks a tiny lowercase letter — the ASCII
// rendering is unchanged, only the geometry it draws.
// Output: src/components/ambient/sigilStrip.ts
//
//   node scripts/generateSigil.mjs

import { writeFileSync } from 'node:fs';

// Character grid; each cell is 3x5 px, matching the 0.6 width/height ratio
// of a monospace cell, so curves keep their proportions on screen.
const COLS = 56;
const ROWS = 620;
const CELL_W = 3;
const CELL_H = 5;
const PW = COLS * CELL_W;
const PH = ROWS * CELL_H;

const grid = new Uint8Array(PW * PH);

// Deterministic PRNG so regenerating gives stable diffs.
let seed = 20260814;
function rnd() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function dot(x, y) {
  x = Math.round(x);
  // wrap vertically so shapes crossing the tile edge continue on the far side
  y = ((Math.round(y) % PH) + PH) % PH;
  if (x >= 0 && x < PW) grid[y * PW + x] = 1;
}

function stamp(cx, cy, r) {
  if (r <= 0.5) {
    dot(cx, cy);
    return;
  }
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) dot(x, y);
}

function cubicPt(P, t) {
  const u = 1 - t;
  return [
    u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
    u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1],
  ];
}

/**
 * Tapered stroke along a cubic bezier.
 * taper: 'tip' thick base to needle point, 'both' pointed at both ends,
 * 'none' near-constant width.
 */
function strokeCubic(P, r0, { pow = 1.3, taper = 'tip' } = {}) {
  let len = 0;
  let prev = cubicPt(P, 0);
  for (let i = 1; i <= 16; i++) {
    const p = cubicPt(P, i / 16);
    len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  const n = Math.max(32, Math.ceil(len * 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x, y] = cubicPt(P, t);
    let r = r0;
    if (taper === 'tip') r = r0 * Math.pow(1 - t, pow);
    else if (taper === 'both') r = r0 * Math.pow(Math.sin(Math.PI * t), 0.9);
    else if (taper === 'edge') r = r0 * Math.pow(Math.sin(Math.PI * t), 0.3);
    stamp(x, y, Math.max(r, 0.3));
  }
}

/** Four-point sparkle star, tapered rays. */
function sparkle(cx, cy, s) {
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    strokeCubic(
      [
        [cx, cy],
        [cx + dx * s * 0.4, cy + dy * s * 0.4],
        [cx + dx * s * 0.8, cy + dy * s * 0.8],
        [cx + dx * s, cy + dy * s],
      ],
      1.1,
      { pow: 1.2 }
    );
  }
}

// ---- composition ----------------------------------------------------------
// One continuous exoskeleton running the height of the tile. The spine's
// wander is periodic over the tile and the canvas wraps vertically, so the
// loop has no seam.

const HALFPI = Math.PI / 2;
const DN = HALFPI;
const AX = PW / 2; // mirror axis
const MARGIN = 4;
const TAU = Math.PI * 2;

/** Curved spike segment: pointed at both ends, bulging k to one side. */
function crescent(A, B, side, k, r0) {
  const d = [B[0] - A[0], B[1] - A[1]];
  const L = Math.hypot(d[0], d[1]) || 1;
  const n = [(-d[1] / L) * side, (d[0] / L) * side];
  strokeCubic(
    [
      A,
      [A[0] + d[0] * 0.3 + n[0] * L * k, A[1] + d[1] * 0.3 + n[1] * L * k],
      [A[0] + d[0] * 0.7 + n[0] * L * k, A[1] + d[1] * 0.7 + n[1] * L * k],
      B,
    ],
    r0,
    { taper: 'both' }
  );
}

/** Centreline control points of a filament curving through `sweep` radians. */
function hornPts(bx, by, a0, len, sweep) {
  const seg = len * 0.36;
  const a1 = a0 + sweep * 0.42;
  const a2 = a0 + sweep * 0.8;
  const p1 = [bx + Math.cos(a0) * seg, by + Math.sin(a0) * seg];
  const p2 = [p1[0] + Math.cos(a1) * seg, p1[1] + Math.sin(a1) * seg];
  const tip = [p2[0] + Math.cos(a2) * seg, p2[1] + Math.sin(a2) * seg];
  return { p1, p2, tip, a1 };
}

/** The same curve as a bezier control array. */
function horn(bx, by, a0, len, sweep) {
  const { p1, p2, tip } = hornPts(bx, by, a0, len, sweep);
  return [[bx, by], p1, p2, tip];
}

/** Heading of a cubic at t, for branching off it. */
function cubicTan(P, t) {
  const u = 1 - t;
  const d = [0, 1].map(
    (k) =>
      3 * u * u * (P[1][k] - P[0][k]) +
      6 * u * t * (P[2][k] - P[1][k]) +
      3 * t * t * (P[3][k] - P[2][k])
  );
  return Math.atan2(d[1], d[0]);
}

/** Shrink a filament until it stays inside the rail's width. */
function fitLen(bx, by, a0, len, sweep, pad) {
  for (let i = 0; i < 10; i++) {
    const { p1, p2, tip } = hornPts(bx, by, a0, len, sweep);
    const lo = Math.min(p1[0], p2[0], tip[0]) - pad;
    const hi = Math.max(p1[0], p2[0], tip[0]) + pad;
    if (lo >= MARGIN && hi <= PW - MARGIN) break;
    len *= 0.86;
  }
  return len;
}

/**
 * Recursive creeper: a razor-thin filament that tapers to a needle point,
 * throwing thinner children partway along and hooking the odd barb off its
 * flank. Each generation is shorter and finer, so the growth dissolves into
 * the void rather than stopping.
 */
function tendril(bx, by, a0, len, sweep, r0, depth) {
  len = fitLen(bx, by, a0, len, sweep, 2);
  const P = horn(bx, by, a0, len, sweep);
  strokeCubic(P, r0, { pow: 1.45 });
  if (depth <= 0) return;

  const branches = 1 + (rnd() < 0.55 ? 1 : 0);
  for (let i = 0; i < branches; i++) {
    const t = 0.36 + rnd() * 0.36;
    const bp = cubicPt(P, t);
    const side = rnd() < 0.5 ? 1 : -1;
    tendril(
      bp[0],
      bp[1],
      cubicTan(P, t) + side * (0.4 + rnd() * 0.75),
      len * (0.48 + rnd() * 0.2),
      side * (0.5 + rnd() * 0.9),
      r0 * 0.72,
      depth - 1
    );
  }

  // barbed hook off the flank
  if (rnd() < 0.55) {
    const t = 0.5 + rnd() * 0.25;
    const bp = cubicPt(P, t);
    const side = rnd() < 0.5 ? 1 : -1;
    strokeCubic(horn(bp[0], bp[1], cubicTan(P, t) + side * 1.15, len * 0.17, side * 1.4), r0 * 0.7, {
      pow: 1.6,
    });
  }
}

/** Hollow skeletal rib: two thin edges bowing wide apart, needle-tipped. */
function rib(bx, by, a0, len, sweep, gap, r0 = 0.5) {
  len = fitLen(bx, by, a0, len, sweep, gap * 1.4);
  const { p1, p2, tip, a1 } = hornPts(bx, by, a0, len, sweep);
  const n1 = [Math.cos(a0 + HALFPI), Math.sin(a0 + HALFPI)];
  const n2 = [Math.cos(a1 + HALFPI), Math.sin(a1 + HALFPI)];
  for (const sgn of [1, -1]) {
    const w = gap * (sgn > 0 ? 1.25 : 0.75);
    strokeCubic(
      [
        [bx, by],
        [p1[0] + n1[0] * w * sgn, p1[1] + n1[1] * w * sgn],
        [p2[0] + n2[0] * w * sgn * 0.72, p2[1] + n2[1] * w * sgn * 0.72],
        tip,
      ],
      r0,
      { taper: 'edge' }
    );
  }
}

/** Hollow diamond node — the mechanical anchor at a joint. */
function diamond(cx, cy, r) {
  const pts = [
    [cx, cy - r],
    [cx + r * 0.6, cy],
    [cx, cy + r],
    [cx - r * 0.6, cy],
  ];
  for (let i = 0; i < 4; i++) {
    const A = pts[i];
    const B = pts[(i + 1) % 4];
    const d = [B[0] - A[0], B[1] - A[1]];
    strokeCubic(
      [A, [A[0] + d[0] * 0.35, A[1] + d[1] * 0.35], [A[0] + d[0] * 0.65, A[1] + d[1] * 0.65], B],
      0.55,
      { taper: 'edge' }
    );
  }
}

/** Four-point chrome starburst: long vertical rays, short lateral, tiny glints. */
function starburst(cx, cy, s) {
  for (const [dx, dy, f] of [[0, -1, 1], [0, 1, 1], [-1, 0, 0.58], [1, 0, 0.58]]) {
    const L = s * f;
    strokeCubic(
      [
        [cx, cy],
        [cx + dx * L * 0.35, cy + dy * L * 0.35],
        [cx + dx * L * 0.7, cy + dy * L * 0.7],
        [cx + dx * L, cy + dy * L],
      ],
      0.95,
      { pow: 1.75 }
    );
  }
  const g = s * 0.24;
  for (const [dx, dy] of [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]) {
    strokeCubic(
      [
        [cx, cy],
        [cx + dx * g * 0.4, cy + dy * g * 0.4],
        [cx + dx * g * 0.7, cy + dy * g * 0.7],
        [cx + dx * g, cy + dy * g],
      ],
      0.6,
      { pow: 1.5 }
    );
  }
}

/** Delicate barbed-wire bridge: a bowed hairline carrying paired barbs. */
function barbWire(A, B, bow, r0 = 0.5) {
  crescent(A, B, bow >= 0 ? 1 : -1, Math.abs(bow), r0);
  const d = [B[0] - A[0], B[1] - A[1]];
  const L = Math.hypot(d[0], d[1]) || 1;
  const base = Math.atan2(d[1], d[0]);
  const n = 2 + Math.floor(rnd() * 2);
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const px = A[0] + d[0] * t + -d[1] / L * bow * L * 0.5 * Math.sin(Math.PI * t);
    const py = A[1] + d[1] * t + d[0] / L * bow * L * 0.5 * Math.sin(Math.PI * t);
    for (const side of [1, -1]) {
      strokeCubic(horn(px, py, base + side * 1.25, L * 0.085, side * 0.9), r0 * 0.85, { pow: 1.5 });
    }
  }
}

const JOINTS = 18;
const STEP = PH / JOINTS;
// periodic over the tile, so the spine meets itself across the seam
const spineX = (y) => AX + Math.sin((TAU * 7 * y) / PH) * 9 + Math.sin((TAU * 3 * y) / PH + 1.2) * 4;

// barbed spine, joint to joint
for (let i = 0; i < JOINTS; i++) {
  const y0 = STEP * i;
  const y1 = STEP * (i + 1);
  barbWire([spineX(y0), y0], [spineX(y1), y1], (i % 2 ? 1 : -1) * 0.05, 0.58);
}

for (let i = 0; i < JOINTS; i++) {
  const y = STEP * (i + 0.5);
  const x = spineX(y);

  // mechanical anchor
  diamond(x, y, 5 + rnd() * 3);
  starburst(x, y, 13 + rnd() * 10);

  // asymmetric creeper fans — each side gets its own count
  for (const s of [-1, 1]) {
    const n = 1 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const up = rnd() < 0.34;
      const a = up
        ? -DN + s * (0.38 + rnd() * 1.0)
        : DN - s * (0.34 + rnd() * 1.15);
      tendril(x, y, a, 54 + rnd() * 48, -s * (0.45 + rnd() * 0.9), 0.68, 2);
    }
  }

  // skeletal rib
  if (rnd() < 0.55) {
    const s = rnd() < 0.5 ? -1 : 1;
    const L = 46 + rnd() * 32;
    rib(x, y + 4, DN - s * 0.85, L, -s * 0.9, L * 0.17);
  }

  // webbing slung toward the next joint
  if (rnd() < 0.62) {
    const s = rnd() < 0.5 ? -1 : 1;
    const y2 = y + STEP;
    barbWire([x + s * 15, y + 13], [spineX(y2) + s * 23, y2 - 15], s * 0.15, 0.45);
  }

  if (rnd() < 0.5) {
    sparkle(x + (rnd() < 0.5 ? -1 : 1) * (26 + rnd() * 32), y - STEP * 0.3, 4 + rnd() * 3);
  }
}

// ---- letter encode --------------------------------------------------------
// Each cell's ink coverage picks a letter band: thin glyphs trace the curve
// edges, heavy ones fill the cores. The in-band pick is a position hash so
// output is stable across runs.

const BANDS = [
  [0.06, 'ij'],
  [0.16, 'lt'],
  [0.28, 'vz'],
  [0.42, 'kx'],
  [0.56, 'ad'],
  [0.72, 'mw'],
];

function glyphFor(cov, x, y) {
  if (cov < BANDS[0][0]) return ' ';
  let band = BANDS[0][1];
  for (const [th, letters] of BANDS) if (cov >= th) band = letters;
  return band[(x * 7 + y * 13) % band.length];
}

function encode(g) {
  const lines = [];
  for (let cy = 0; cy < ROWS; cy++) {
    let line = '';
    for (let cx = 0; cx < COLS; cx++) {
      let ink = 0;
      for (let dy = 0; dy < CELL_H; dy++)
        for (let dx = 0; dx < CELL_W; dx++)
          ink += g[(cy * CELL_H + dy) * PW + (cx * CELL_W + dx)];
      line += glyphFor(ink / (CELL_W * CELL_H), cx, cy);
    }
    lines.push(line);
  }
  return lines.join('\n');
}

const mirrored = new Uint8Array(PW * PH);
for (let y = 0; y < PH; y++)
  for (let x = 0; x < PW; x++) mirrored[y * PW + (PW - 1 - x)] = grid[y * PW + x];

const out = `// Generated by scripts/generateSigil.mjs — run it again rather than editing.
export const SIGIL_LEFT = \`${encode(grid)}\`;

export const SIGIL_RIGHT = \`${encode(mirrored)}\`;
`;

writeFileSync(new URL('../src/components/ambient/sigilStrip.ts', import.meta.url), out);
console.log(`wrote sigilStrip.ts (${COLS} chars x ${ROWS} lines per rail)`);
