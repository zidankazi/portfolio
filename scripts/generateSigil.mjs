// Generates the letter-built cyber-sigilism strip for the side rails.
// Drawn the way the tattoos are: every spike is a HOLLOW OUTLINE — two curved
// edges springing from a common base, bowing apart, and closing to a needle
// point — not a single stroke. Ten motif types (crowns, fans, bursts, knots,
// crosses, tridents, wings, lattices, spears, claws) are dealt out in a
// shuffled, no-adjacent-repeat order over a long tile, each with a randomised
// scale and facing, so the loop rarely shows the same shape twice.
// Strokes rasterize to a pixel canvas, then each character cell's ink coverage
// picks a tiny lowercase letter, so the outlines read as fine linework with
// open interiors, the way the ink does on skin.
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
  y = Math.round(y);
  if (x >= 0 && x < PW && y >= 0 && y < PH) grid[y * PW + x] = 1;
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
// A long chain of varied motifs. Node count divides the tile height so the
// pattern wraps seamlessly.

const HALFPI = Math.PI / 2;
const DN = HALFPI;
const AX = PW / 2; // mirror axis
const MARGIN = 5;

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

/** Centreline control points of a horn curving through `sweep` radians. */
function hornPts(bx, by, a0, len, sweep) {
  const seg = len * 0.36;
  const a1 = a0 + sweep * 0.42;
  const a2 = a0 + sweep * 0.8;
  const p1 = [bx + Math.cos(a0) * seg, by + Math.sin(a0) * seg];
  const p2 = [p1[0] + Math.cos(a1) * seg, p1[1] + Math.sin(a1) * seg];
  const tip = [p2[0] + Math.cos(a2) * seg, p2[1] + Math.sin(a2) * seg];
  return { p1, p2, tip, a0, a1 };
}

/**
 * Shrink a horn until it stays inside the rail. Lets the motifs ask for
 * dramatic lengths without any of them getting clipped at the strip edge.
 */
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
 * Hollow tusk — the core unit. Two edges leave the base together, bow apart
 * by `width`, and close to a needle point at the tip. bias > 0 fattens the
 * outer edge so it reads as a horn rather than a symmetric leaf.
 */
function tusk(bx, by, a0, len, sweep, width, r0 = 0.85, bias = 0.45) {
  len = fitLen(bx, by, a0, len, sweep, width * 1.5);
  const { p1, p2, tip, a1 } = hornPts(bx, by, a0, len, sweep);
  const n1 = [Math.cos(a0 + HALFPI), Math.sin(a0 + HALFPI)];
  const n2 = [Math.cos(a1 + HALFPI), Math.sin(a1 + HALFPI)];
  for (const sgn of [1, -1]) {
    const w = width * (sgn > 0 ? 1 + bias : 1 - bias);
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
  return tip;
}

/** Mirrored tusk pair about the axis. */
function tuskPair(cx, cy, a0, len, sweep, width, r0, bias) {
  tusk(cx, cy, a0, len, sweep, width, r0, bias);
  tusk(2 * AX - cx, cy, Math.PI - a0, len, -sweep, width, r0, bias);
}

/** Closed teardrop: pointed at both ends, fat in the middle. */
function teardrop(bx, by, a0, len, width, r0 = 0.8) {
  tusk(bx, by, a0, len, 0.12, width, r0, 0);
}

/** Hairline whip — a single thin stroke trailing to nothing. */
function whip(bx, by, a0, len, sweep, r0 = 0.6) {
  len = fitLen(bx, by, a0, len, sweep, 2);
  const { p1, p2, tip } = hornPts(bx, by, a0, len, sweep);
  strokeCubic([[bx, by], p1, p2, tip], r0, { pow: 1.2 });
}

/** Motif: crown — tall horns curling up and out, tusks sweeping down. */
function crown(cx, cy, sc, dir) {
  tuskPair(cx, cy - 4, -DN - 0.3, sc * 2.5, 1.4, sc * 0.3, 0.85, 0.5);
  tuskPair(cx + 2, cy - 1, -DN - 0.88, sc * 1.9, 1.6, sc * 0.24, 0.8, 0.45);
  tuskPair(cx + 2, cy + 6, DN - 1.05, sc * 2.3, -1.25, sc * 0.27, 0.85, 0.5);
  tuskPair(cx, cy + 9, DN - 0.38, sc * 2.0, -1.05, sc * 0.24, 0.8, 0.45);
  teardrop(cx, cy - sc * 0.32, -DN, sc * 0.62, sc * 0.15);
  whip(cx + dir * 4, cy + 12, DN + dir * 0.2, sc * 2.0, dir * 0.6);
}

/** Motif: fan — a stack of tusks sweeping down and out, shrinking. */
function fan(cx, cy, sc, dir) {
  for (let i = 0; i < 4; i++) {
    const a = DN - (0.35 + i * 0.34);
    tuskPair(cx + i * dir, cy + i * 5, a, sc * (2.1 - i * 0.26), -(1.0 - i * 0.12), sc * (0.27 - i * 0.03), 0.85, 0.5);
  }
  tuskPair(cx, cy - 6, -DN + 0.5 * dir, sc * 0.7, 0.9, sc * 0.15, 0.75, 0.4);
  teardrop(cx, cy + sc * 0.2, DN, sc * 0.5, sc * 0.14);
}

/** Motif: cross — long tusks on the diagonals, short side spurs. */
function cross(cx, cy, sc, dir) {
  tuskPair(cx, cy - 5, -DN - 0.2, sc * 2.0, 1.05, sc * 0.26, 0.85, 0.5);
  tuskPair(cx, cy + 5, DN - 0.2, sc * 2.2, -1.05, sc * 0.27, 0.85, 0.5);
  tuskPair(cx + 1, cy, -0.05, sc * 1.1, -dir * 0.9, sc * 0.2, 0.8, 0.45);
  teardrop(cx, cy, DN, sc * 0.75, sc * 0.19, 0.9);
  whip(cx, cy + sc * 0.5, DN - dir * 0.15, sc * 1.9, -dir * 0.4);
}

/** Motif: burst — many tusks at wide angles, alternating long and short. */
function burst(cx, cy, sc, dir) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = -DN * 0.8 + (i / (n - 1)) * Math.PI * 1.14 + dir * 0.1;
    const long = i % 2 === 0;
    const sw = (a > 0 ? -1 : 1) * (1.2 + rnd() * 0.35);
    const len = sc * (long ? 2.2 : 1.25);
    const w = sc * (long ? 0.28 : 0.2);
    tusk(cx, cy, a, len, sw, w, 0.85, 0.5);
    tusk(2 * AX - cx, cy, Math.PI - a, len, -sw, w, 0.85, 0.5);
  }
  teardrop(cx, cy, DN, sc * 0.58, sc * 0.17);
}

/** Motif: knot — teardrop cluster trailing long hairline whips. */
function knot(cx, cy, sc, dir) {
  for (const s of [-1, 1]) {
    teardrop(cx, cy, DN - s * 0.55, sc * 0.85, sc * 0.17);
    teardrop(cx, cy - 3, -DN + s * 0.6, sc * 0.6, sc * 0.14);
    whip(cx, cy + 2, DN - s * 0.3, sc * (s === dir ? 3.1 : 2.4), s * 0.55);
    whip(cx, cy, DN - s * 0.85, sc * 1.5, s * 0.8);
  }
  tuskPair(cx, cy + 4, DN - 0.5, sc * 1.2, -0.6, sc * 0.19, 0.8, 0.45);
}

/** Motif: trident — three tall prongs, the centre one longest. */
function trident(cx, cy, sc, dir) {
  tusk(cx, cy - 6, -DN, sc * 2.7, dir * 0.22, sc * 0.2, 0.85, 0.25);
  tuskPair(cx, cy - 2, -DN - 0.44, sc * 2.1, 1.0, sc * 0.25, 0.85, 0.5);
  tuskPair(cx, cy + 8, DN - 0.5, sc * 1.6, -0.95, sc * 0.21, 0.8, 0.45);
  teardrop(cx, cy + sc * 0.4, DN, sc * 0.62, sc * 0.15);
  whip(cx, cy + 10, DN - dir * 0.2, sc * 1.7, dir * 0.45);
}

/** Motif: wing — deliberately lopsided, one side thrown much further. */
function wing(cx, cy, sc, dir) {
  tusk(cx, cy, DN - dir * 0.7, sc * 2.6, -dir * 1.35, sc * 0.3, 0.85, 0.5);
  tusk(cx, cy - 4, -DN - dir * 0.5, sc * 2.0, dir * 1.3, sc * 0.25, 0.85, 0.5);
  tusk(cx, cy + 6, DN + dir * 0.55, sc * 1.35, dir * 1.0, sc * 0.19, 0.8, 0.45);
  tusk(cx, cy + 2, DN - dir * 1.2, sc * 1.1, -dir * 0.9, sc * 0.17, 0.8, 0.45);
  teardrop(cx, cy, -DN + dir * 0.25, sc * 0.55, sc * 0.13);
  whip(cx, cy + 10, DN + dir * 0.3, sc * 2.3, dir * 0.5);
}

/** Motif: lattice — a diamond of teardrops with spurs pushing out. */
function lattice(cx, cy, sc, dir) {
  const r = sc * 0.66;
  for (const s of [-1, 1]) {
    teardrop(cx, cy - r * 0.55, -DN + s * 0.78, r * 1.5, sc * 0.14);
    teardrop(cx, cy + r * 0.55, DN - s * 0.78, r * 1.5, sc * 0.14);
    tusk(cx + s * r * 0.95, cy, s > 0 ? 0.06 : Math.PI - 0.06, sc * (s === dir ? 1.5 : 1.1), -s * 1.15, sc * 0.18, 0.8, 0.45);
  }
  teardrop(cx, cy, DN, sc * 0.95, sc * 0.11);
}

/** Motif: spear — a long shaft with barb pairs stepping down it. */
function spear(cx, cy, sc, dir) {
  tusk(cx, cy - sc * 0.95, DN, sc * 2.7, dir * 0.14, sc * 0.17, 0.85, 0.2);
  for (let i = 0; i < 3; i++) {
    tuskPair(cx, cy - sc * 0.5 + i * sc * 0.58, DN - 1.0, sc * (1.05 - i * 0.16), -0.9, sc * 0.14, 0.8, 0.45);
  }
  teardrop(cx, cy - sc, -DN, sc * 0.7, sc * 0.12);
}

/** Motif: claws — three hooked tusks a side, all curling the same way. */
function claws(cx, cy, sc, dir) {
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      tusk(
        cx + s * i * 2,
        cy + i * 7,
        DN - s * (0.5 + i * 0.32),
        sc * (2.1 - i * 0.36),
        -s * (1.35 - i * 0.16),
        sc * (0.25 - i * 0.04),
        0.85,
        0.5
      );
    }
  }
  teardrop(cx, cy - 4, -DN, sc * 0.85, sc * 0.14);
  whip(cx, cy + 14, DN + dir * 0.22, sc * 1.8, dir * 0.5);
}

const MOTIF_FNS = [crown, fan, burst, knot, cross, trident, wing, lattice, spear, claws];

const NODES = 22;
const SPACING = PH / NODES;
const nodeX = (i) => AX + Math.sin(i * 1.9) * 6;

// deal the motifs out shuffled, never the same one twice in a row
let prevPick = -1;
for (let i = 0; i < NODES; i++) {
  let k;
  do {
    k = Math.floor(rnd() * MOTIF_FNS.length);
  } while (k === prevPick);
  prevPick = k;

  const y = SPACING * (i + 0.5);
  const x0 = nodeX(i);
  const x1 = nodeX(i + 1);
  const dir = rnd() < 0.5 ? 1 : -1;

  crescent([x0, y + 10], [x1, y + SPACING - 10], i % 2 ? 1 : -1, 0.06, 0.6);
  // hairline whips reaching toward the next node so the chain never breaks
  whip(x0 + dir * 5, y + 14, DN - dir * 0.42, SPACING * 1.2, dir * 0.5, 0.55);
  whip(x0 - dir * 4, y + 12, DN + dir * 0.3, SPACING * 0.9, -dir * 0.45, 0.5);

  MOTIF_FNS[k](x0, y, 30 + rnd() * 16, dir);

  if (rnd() < 0.4) sparkle(x0 + (rnd() < 0.5 ? -1 : 1) * (34 + rnd() * 24), y - SPACING * 0.3, 4 + rnd() * 3);
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
