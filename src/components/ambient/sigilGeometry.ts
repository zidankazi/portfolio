export const SIGIL_HEIGHT = 360;

type Point = [number, number];
type Curve = [Point, Point, Point, Point];

function point(curve: Curve, t: number): Point {
  const u = 1 - t;
  return [0, 1].map((axis) =>
    u ** 3 * curve[0][axis] + 3 * u * u * t * curve[1][axis]
    + 3 * u * t * t * curve[2][axis] + t ** 3 * curve[3][axis]
  ) as Point;
}

// Filled ribbons give the ink swelling bends and actual needle-point ends.
function blade(curve: Curve, width: number, root = 0): string {
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const p = point(curve, t);
    const before = point(curve, Math.max(0, t - 0.001));
    const after = point(curve, Math.min(1, t + 0.001));
    const dx = after[0] - before[0];
    const dy = after[1] - before[1];
    const length = Math.hypot(dx, dy) || 1;
    const radius = width * (Math.sin(Math.PI * t) ** 0.85 + root * (1 - t)) * (1 - t) ** 0.65;
    left.push([p[0] - dy / length * radius, p[1] + dx / length * radius]);
    right.push([p[0] + dy / length * radius, p[1] - dx / length * radius]);
  }
  return `M${[...left, ...right.reverse()].map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join('L')}Z`;
}

/** Each signed section index has its own ink, stable when scrolling back. */
export function createSigil(index: number, salt: number): string {
  let seed = (Math.imul(index, 1597334677) ^ Math.imul(salt, 3812015801)) >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
  const between = (min: number, max: number) => min + random() * (max - min);
  const ink: string[] = [];
  const cx = between(93, 107);
  const cy = between(145, 175);
  const span = between(62, 85);
  const stretch = between(0.85, 1.1);
  const crown = between(85, 125);
  const tierCount = random() > 0.55 ? 4 : 3;
  const sweep = random() > 0.5 ? -1 : 1;

  // Fine ligaments meet neighboring sections at a fixed position and tangent.
  ink.push(`M99.6,0 C99.6,55 ${cx - 8},${cy - 77} ${cx},${cy - 28}
    C${cx + 7},${cy + 90} 99.6,305 99.6,360 L100.4,360
    C100.4,305 ${cx + 9},${cy + 90} ${cx + 1},${cy - 28}
    C${cx - 6},${cy - 77} 100.4,55 100.4,0Z`);

  const tiers = Array.from({ length: tierCount }, (_, tier) => ({
    y: -40 + tier * between(25, 34),
    reach: span * (1 - tier * between(0.08, 0.17)),
    lift: between(25, 65) * (tier % 2 === 0 ? 1 : sweep),
    weight: between(2.8, 4.3),
  }));

  for (const side of [-1, 1]) {
    // Shared proportions establish symmetry; small offsets keep it hand-drawn.
    const skew = between(-12, 12);
    const local = (x: number, y: number): Point => [cx + side * x, cy + y * stretch + skew * x / span];
    const add = (coords: Curve, width: number, root = 0) => {
      ink.push(blade(coords.map(([x, y]) => local(x, y)) as Curve, width, root));
    };

    // Split crown: swept horns framing a narrow open core.
    add([[0, 17], [31, -30], [8, -65], [between(18, 32), -crown]], 3.6);
    add([[6, -30], [34, -53], [42, -56], [35, -crown * 0.79]], 1.8);
    add([[16, -62], [7, -70], [6, -92], [11, -crown]], 0.9);

    for (const { y, reach, lift, weight } of tiers) {
      const wing: Curve = [[2, y + 35], [reach * 0.45, y - 30], [reach * 0.72, y + 35], [reach, y - lift]];
      add(wing, weight);
      // The opposing scythe leaves an elongated hollow between blades.
      add([[1, y + 43], [reach * 0.9, y + 65], [reach * 0.48, y - 3], [reach, y - lift]], weight * 0.48);
      const root = point(wing, 0.56);
      add([root, [root[0] + 17, root[1] + 3], [reach + 9, y - 4], [Math.min(88, reach + 10), y - 36]], 1.6, 0.45);
      const fork = point(wing, 0.79);
      add([fork, [fork[0] - 10, fork[1] - 5], [fork[0] - 16, fork[1] - 22], [fork[0] - 13, fork[1] - 38]], 1.1, 0.3);
      add([[8, y + 31], [18, y + 14], [24, y + 7], [23, y - 10]], 1.7);
      if (random() > 0.3) {
        add([[reach * 0.75, y + 9], [reach * 0.38, y - 62], [reach * 0.62, y - 54], [reach * 0.72, y - 82]], 0.65);
      }
    }

    // Descending barbs pull the broad crest into a long, pointed spine.
    add([[0, 52], [40, 65], [37, 102], [18, 137]], 2.7);
    add([[9, 83], [25, 92], [14, 116], [4, 157]], 1.5);
    add([[24, 94], [42, 98], [45, 76], [49, 65]], 1.2, 0.35);
    add([[0, -17], [20, 5], [14, 27], [0, 49]], 2.1);
    add([[0, 47], [11, 62], [8, 80], [0, 95]], 1.2);
    add([[5, 60], [5, 107], [6, 132], [0, 157]], 1.1);
    // A few fine, overshooting lashes interrupt the regular paired structure.
    add([[21, 68], [between(55, 75), 34], [78, 92], [between(58, 83), 120]], 0.75);
    add([[16, -24], [65, -6], [85, -56], [between(58, 78), -107]], 0.7);
  }
  return ink.join('');
}
