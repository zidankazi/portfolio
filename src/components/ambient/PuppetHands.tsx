'use client';

import { useLayoutEffect, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useEntrance } from '@/components/motion/Entrance';
import { HAND_LEFT, HAND_RIGHT, HAND_WIDTH, HAND_HEIGHT, HAND_FONT_SIZE, HAND_TIPS, HAND_WRAPS } from './puppetHandArt';

// A descending phrase, with the leading hand alternating between pairs.
// Slots 0–3 belong to the left hand; 4–7 belong to the right.
const WRAP_DURATION = 360;
const CHAIN_ENTRIES = [0, 225, 385, 725, 65, 175, 465, 640];
const CHAIN_DURATIONS = [940, 1070, 1150, 1240, 975, 1030, 1190, 1210];

// A single easing curve carries each wrist all the way to rest. Separate
// keyframe easings would brake and restart the descent between poses.
const HAND_ENTRANCES = {
  left: {
    from: 'translate3d(-9px, -260px, 0) rotate(-7deg)',
    origin: '32% 0%', duration: 1.22, delay: 0.04,
  },
  right: {
    from: 'translate3d(11px, -275px, 0) rotate(9deg)',
    origin: '68% 0%', duration: 1.34, delay: 0.18,
  },
};

function Hand({ side }: { side: 'left' | 'right' }) {
  const wrapId = useId().replace(/:/g, '');
  const art = side === 'left' ? HAND_LEFT : HAND_RIGHT;
  const entrance = HAND_ENTRANCES[side];
  const { settle, skip } = useEntrance();
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-puppet-hand={side}
      className={`puppet-hand absolute -top-3 puppet-hand-${side}`}
      initial={skip ? false : { transform: entrance.from }}
      animate={{ transform: 'translate3d(0, 0, 0) rotate(0deg)' }}
      transition={reduced || skip ? { duration: 0 } : {
        duration: entrance.duration,
        delay: entrance.delay,
        ease: [0.22, 0.1, 0.25, 1],
      }}
      onAnimationComplete={() => settle(side)}
      style={{
        width: 'var(--hand-size)',
        height: `calc(var(--hand-size) * ${HAND_HEIGHT / HAND_WIDTH})`,
        transformOrigin: entrance.origin,
      }}
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${HAND_WIDTH} ${HAND_HEIGHT}`} focusable="false">
        {/* Keep the lettering and coils in one coordinate system. Safari can
            round fractional HTML line heights and shorten the fingers. */}
        {([
          ['detail', 'text-zinc-500/25'],
          ['body', 'text-zinc-300/65'],
          ['highlights', 'text-zinc-100'],
        ] as const).map(([layer, color]) => (
          <text key={layer} data-hand-art={layer} className={`font-mono ${color}`} fill="currentColor" fontSize={HAND_FONT_SIZE} style={{ whiteSpace: 'pre' }}>
            {art[layer].split('\n').map((line, row) => (
              <tspan key={row} x="0" y={(row + 0.8) * HAND_FONT_SIZE}>{line}</tspan>
            ))}
          </text>
        ))}
        {HAND_WRAPS.map((wrap, finger) => {
          const x = side === 'left' ? wrap.x : HAND_WIDTH - wrap.x;
          const { y, rx, ry } = wrap;
          const tipY = HAND_TIPS[finger][1];
          // Each half-turn continues where the last ended, descending into a coil.
          const segments = [-2, 2].flatMap(offset => [
            { back: true, d: `M${x - rx},${y + offset - 2} C${x - rx},${y + offset - 2 - ry * 1.33} ${x + rx},${y + offset - ry * 1.33} ${x + rx},${y + offset}` },
            { back: false, d: `M${x + rx},${y + offset} C${x + rx},${y + offset + ry * 1.33} ${x - rx},${y + offset + 2 + ry * 1.33} ${x - rx},${y + offset + 2}` },
          ]);
          segments.push({ back: false, d: `M${x - rx},${y + 4} Q${x},${y + 4} ${x},${tipY}` });
          return (
            <g key={finger} data-finger-wrap={finger} opacity="0">
              {segments.map((segment, index) => {
                const id = `${wrapId}-${finger}-${index}`;
                return (
                  <g key={index}>
                    <defs>
                      <path id={id} d={segment.d} />
                      <mask id={`${id}-reveal`} maskUnits="userSpaceOnUse" x="0" y="0" width={HAND_WIDTH} height={HAND_HEIGHT}>
                        <path data-wrap-reveal d={segment.d} pathLength="1" fill="none" stroke="white" strokeWidth="14" strokeDasharray="1 1" strokeDashoffset="1" />
                      </mask>
                    </defs>
                    <g mask={`url(#${id}-reveal)`}>
                      {!segment.back && <use href={`#${id}`} fill="none" stroke="#0a0a0a" strokeWidth="3" />}
                      <text className="font-mono" fontSize="6" fontWeight="500" fill={segment.back ? '#781114' : '#c51b20'} stroke={segment.back ? 'none' : '#c51b20'} strokeWidth="0.25">
                        <textPath href={`#${id}`}>------------</textPath>
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

export function PuppetHands() {
  const { ready, reveal, skip } = useEntrance();
  const rootRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, '');

  useLayoutEffect(() => {
    const root = rootRef.current;
    const front = frontRef.current;
    const main = document.querySelector('main');
    if (!root || !front || !main || !ready) return;

    const desktop = window.matchMedia('(min-width: 1024px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const paths = [...root.querySelectorAll<SVGPathElement>('.puppet-threads path')];
    const threads = [...root.querySelectorAll<SVGTextPathElement>('.puppet-threads textPath')];
    const nodes = [...root.querySelectorAll<SVGCircleElement>('.puppet-threads circle')];
    const frontThreads = [...front.querySelectorAll<SVGTextPathElement>('textPath')];
    const frontClips = [...front.querySelectorAll<SVGRectElement>('clipPath rect')];
    const writeThread = (slot: number, count: number) => {
      const text = '='.repeat(count);
      threads[slot].textContent = text;
      frontThreads[slot].textContent = text;
    };
    const hands = [...root.querySelectorAll<HTMLElement>('[data-puppet-hand]')];
    // Chains start at the innermost finger, opposite the artwork's wrap order.
    const wraps = hands.flatMap(hand => [...hand.querySelectorAll<SVGGElement>('[data-finger-wrap]')].reverse());
    const coils = wraps.map(wrap => {
      const masks = [...wrap.querySelectorAll<SVGPathElement>('[data-wrap-reveal]')];
      const lengths = masks.map(path => path.getTotalLength());
      return { masks, lengths, total: lengths.reduce((sum, length) => sum + length, 0) };
    });
    const wrapProgress = new Array<number>(8).fill(-1);
    const wind = (slot: number, progress: number) => {
      if (wrapProgress[slot] === progress) return;
      wrapProgress[slot] = progress;
      wraps[slot].setAttribute('opacity', progress > 0 ? '1' : '0');
      const coil = coils[slot];
      let remaining = progress * coil.total;
      coil.masks.forEach((mask, index) => {
        const length = coil.lengths[index];
        const portion = Math.max(0, Math.min(remaining / length, 1));
        mask.setAttribute('stroke-dashoffset', (1 - portion).toFixed(3));
        remaining -= length;
      });
    };
    let anchors: HTMLElement[] = [];
    let raf = 0;
    let dirty = true;
    const threadCounts = new Array<number>(8).fill(0);
    const visibleCounts = new Array<number>(8).fill(-1);
    const arrivalCounts = new Array<number>(8).fill(0);
    const phrasing: { delay: number; duration: number; beats: number[] }[] = [];
    const arrived = new Array<boolean>(8).fill(false);
    const started = performance.now();
    let growing = !reduced.matches && !skip;
    let revealed = false;

    const draw = () => {
      if (document.hidden) return;
      const rootBox = root.getBoundingClientRect();
      const handBoxes = hands.map(hand => hand.getBoundingClientRect());
      const content = main.getBoundingClientRect();
      // Batch geometry reads before changing any SVG attributes.
      const anchorBoxes = anchors.map(anchor => anchor.getBoundingClientRect());
      // Keep the complete strings inside their SVG canvases when the browser
      // captures a page transition, including when the project list expands.
      const sceneHeight = Math.ceil(Math.max(content.bottom - rootBox.top, window.innerHeight));
      if (sceneHeight !== rootBox.height) root.style.height = `${sceneHeight}px`;
      front.setAttribute('height', String(sceneHeight));

      for (let side = 0; side < 2; side++) {
        for (let index = 0; index < 4; index++) {
          const slot = side * 4 + index;
          const box = anchorBoxes[index];
          const path = paths[slot];
          const node = nodes[slot];
          if (!box) {
            path.removeAttribute('d');
            writeThread(slot, 0);
            frontClips[slot].setAttribute('width', '0');
            threadCounts[slot] = 0;
            node.setAttribute('r', '0');
            wind(slot, 0);
            continue;
          }
          if (!growing || arrived[slot]) wind(slot, 1);
          const hand = handBoxes[side];
          const tip = HAND_TIPS[3 - index];
          const scale = hand.width / HAND_WIDTH;
          const sx = hand.left - rootBox.left + (side === 0 ? tip[0] : HAND_WIDTH - tip[0]) * scale;
          const sy = hand.top - rootBox.top + tip[1] * scale;
          // Two strands bear against an earlier message, cross its front,
          // and emerge on the opposite side before reaching their destination.
          const crossed = slot === 1 || slot === 7 ? anchorBoxes[index - 1] : undefined;
          const endSide = crossed ? 1 - side : side;
          const ex = (endSide === 0 ? box.left + 3 : box.right - 3) - rootBox.left;
          const ey = box.top - rootBox.top + 14;
          const mobile = !desktop.matches;
          const inset = mobile ? 4 + index * 2.5 : 30 + index * 9;
          const gutter = (side === 0 ? content.left - inset : content.right + inset) - rootBox.left;
          const span = Math.max(0, ey - sy);
          const curves: number[][] = [];
          if (crossed) {
            const left = crossed.left - rootBox.left;
            const right = crossed.right - rootBox.left;
            const bottom = crossed.bottom - rootBox.top;
            const top = crossed.top - rootBox.top;
            const entryX = side === 0 ? left - 7 : right + 7;
            const exitX = side === 0 ? right + 7 : left - 7;
            if (slot === 1) {
              // A taut band crosses the bottom padding, below the last line.
              curves.push(
                [sx + (entryX - sx) * 0.33, sy + (bottom - 15 - sy) * 0.33, entryX - 3, bottom - 40, entryX, bottom - 12],
                [left + crossed.width * 0.3, bottom - 10, right - crossed.width * 0.3, bottom - 7, exitX, bottom - 5],
                [exitX + 3, bottom + 1, ex + 4, ey - 9, ex, ey],
              );
            } else {
              // Catch only the outer corner, then slip behind the bubble.
              curves.push(
                [sx + (entryX - sx) * 0.33, sy + (top - sy) * 0.33, entryX + 3, top + 12, entryX, top + crossed.height * 0.65],
                [right - crossed.width * 0.1, top + crossed.height * 0.44, right - crossed.width * 0.23, top + crossed.height * 0.19, right - crossed.width * 0.34, top - 3],
                [right - crossed.width * 0.45, top + 1, left + crossed.width * 0.22, bottom - 28, exitX, bottom - 11],
                [exitX - 3, bottom + 1, ex - 4, ey - 9, ex, ey],
              );
            }
            const clip = frontClips[slot];
            clip.setAttribute('x', (slot === 1 ? left : right - crossed.width * 0.4).toFixed(1));
            clip.setAttribute('y', (crossed.top - rootBox.top).toFixed(1));
            clip.setAttribute('width', (crossed.width * (slot === 1 ? 1 : 0.4)).toFixed(1));
            clip.setAttribute('height', crossed.height.toFixed(1));
          } else {
            frontClips[slot].setAttribute('width', '0');
            // Each finger pulls along its own line instead of joining a rail.
            curves.push([sx + (gutter - sx) * 0.33, sy + span * 0.33, gutter, ey - 24, ex, ey]);
          }
          // The control polygon safely overestimates the cord length without
          // forcing SVG layout on every frame of an expanding message.
          let length = 0;
          let px = sx;
          let py = sy;
          const d = `M${sx.toFixed(1)},${sy.toFixed(1)}` + curves.map(curve => {
            for (let point = 0; point < 6; point += 2) {
              length += Math.hypot(curve[point] - px, curve[point + 1] - py);
              px = curve[point];
              py = curve[point + 1];
            }
            return ` C${curve.map(value => value.toFixed(1)).join(' ')}`;
          }).join('');
          if (path.getAttribute('d') !== d) {
            path.setAttribute('d', d);
            const count = Math.ceil(length / 115.2) * 16;
            if (count !== threadCounts[slot]) {
              if (!growing || arrived[slot]) writeThread(slot, count * 2);
              threadCounts[slot] = count;
            }
            node.setAttribute('cx', ex.toFixed(1));
            node.setAttribute('cy', ey.toFixed(1));
            node.setAttribute('r', growing && !arrived[slot] ? '0' : '1.5');
          }
        }
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (dirty) {
        dirty = false;
        draw();
      }
      if (growing) {
        const skip = reduced.matches;
        const progressByChain: number[] = [];
        threads.forEach((_, slot) => {
          const phrase = phrasing[slot];
          const elapsed = now - started - phrase.delay;
          const winding = skip ? 1 : Math.max(0, Math.min(elapsed / WRAP_DURATION, 1));
          wind(slot, anchors[slot % 4] ? winding : 0);
          const t = skip ? 1 : Math.max(0, Math.min((elapsed - WRAP_DURATION) / phrase.duration, 1));
          const progress = t * t * (3 - 2 * t);
          progressByChain[slot] = progress;
          if (arrived[slot]) return;
          let count = Math.max(0, visibleCounts[slot]);
          // Uneven but always forward: character timing is sampled once,
          // never randomized per frame, so the chain cannot flicker or retreat.
          while (count < phrase.beats.length && phrase.beats[count] <= progress) count++;
          if (count !== visibleCounts[slot]) {
            writeThread(slot, count);
            visibleCounts[slot] = count;
          }
          if (t === 1) {
            arrived[slot] = true;
            writeThread(slot, threadCounts[slot] * 2);
            nodes[slot].setAttribute('r', anchors[slot % 4] ? '1.5' : '0');
          }
        });
        // The first pair brings in the conversation; the later chains finish
        // their phrase during that shared fade instead of holding up the page.
        if (Math.min(progressByChain[0], progressByChain[4]) >= 0.88 && !revealed) {
          reveal();
          revealed = true;
        }
        if (arrived.every(Boolean)) growing = false;
      }
      if ((growing || dirty) && !document.hidden) raf = requestAnimationFrame(frame);
    };
    // ResizeObserver follows each actual layout change during expansion.
    // Coalesce notifications into one frame, with no trailing polling loop.
    const schedule = () => {
      dirty = true;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const resize = new ResizeObserver(schedule);
    const discover = () => {
      const next = [...main.querySelectorAll<HTMLElement>('[data-puppet-anchor]')].slice(0, 4);
      if (next.length === anchors.length && next.every((anchor, index) => anchor === anchors[index])) return;
      anchors = next;
      resize.disconnect();
      resize.observe(main);
      anchors.forEach(anchor => resize.observe(anchor));
      schedule();
    };
    const mutations = new MutationObserver(discover);
    mutations.observe(main, { childList: true, subtree: true });
    desktop.addEventListener('change', schedule);
    reduced.addEventListener('change', schedule);
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('resize', schedule);
    discover();
    draw();
    // Measure once for the entrance only, after every path is laid out.
    // Hover/resize updates retain the cheaper control-polygon estimate.
    paths.forEach((path, slot) => {
      arrivalCounts[slot] = path.hasAttribute('d') ? Math.ceil(path.getTotalLength() / 3.6) : 0;
      let beat = 0;
      const beats = Array.from({ length: arrivalCounts[slot] }, () => {
        beat += 0.78 + Math.random() * 0.44;
        return beat;
      });
      phrasing[slot] = {
        delay: Math.max(0, CHAIN_ENTRIES[slot] + (Math.random() - 0.5) * 28),
        duration: CHAIN_DURATIONS[slot] * (0.96 + Math.random() * 0.08),
        beats: beats.map(value => value / beat),
      };
    });
    if (!growing) reveal();

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      mutations.disconnect();
      desktop.removeEventListener('change', schedule);
      reduced.removeEventListener('change', schedule);
      document.removeEventListener('visibilitychange', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ready, reveal, skip]);

  return (
    <>
      <div ref={rootRef} aria-hidden="true" className="pointer-events-none select-none puppet-scene absolute inset-x-0 top-0 -z-10">
        {/* Separate SVGs keep a moving chain from relaying out every text path.
            Full-height canvases also keep page-transition snapshots bounded. */}
        {Array.from({ length: 8 }, (_, index) => (
          <svg key={index} height="100%" className="puppet-threads absolute inset-x-0 top-0 w-full overflow-hidden" focusable="false">
            <defs>
              <path id={`${id}-thread-${index}`} />
            </defs>
            <text className="font-mono" fontSize="6" fontWeight="500" fill="#ce272d" stroke="#ce272d" strokeWidth="0.3">
              <textPath href={`#${id}-thread-${index}`} />
            </text>
            <circle r="0" fill="#ce272d" />
          </svg>
        ))}
        <div className="puppet-hand-stage absolute inset-x-0 top-0">
          <Hand side="left" />
          <Hand side="right" />
        </div>
      </div>
      <svg ref={frontRef} aria-hidden="true" focusable="false" height="1" className="pointer-events-none absolute inset-x-0 top-0 z-10 w-full overflow-hidden">
        {Array.from({ length: 8 }, (_, slot) => (
          <g key={slot} clipPath={`url(#${id}-front-${slot})`}>
            <defs>
              <clipPath id={`${id}-front-${slot}`} clipPathUnits="userSpaceOnUse">
                <rect width="0" height="0" rx="20" />
              </clipPath>
            </defs>
            <text className="font-mono" fontSize="6" fontWeight="500" fill="#ce272d" stroke="#0a0a0a" strokeWidth="1.2" paintOrder="stroke">
              <textPath href={`#${id}-thread-${slot}`} />
            </text>
          </g>
        ))}
      </svg>
    </>
  );
}
