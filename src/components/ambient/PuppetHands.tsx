'use client';

import { useLayoutEffect, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useEntrance } from '@/components/motion/Entrance';
import { HAND_LEFT, HAND_RIGHT, HAND_WIDTH, HAND_HEIGHT, HAND_FONT_SIZE, HAND_TIPS, HAND_WRAPS } from './puppetHandArt';

// A descending phrase, with the leading hand alternating between pairs.
// Slots 0–3 belong to the left hand; 4–7 belong to the right.
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
  const { settle } = useEntrance();
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-puppet-hand={side}
      className={`puppet-hand absolute -top-3 puppet-hand-${side}`}
      initial={{ transform: entrance.from }}
      animate={{ transform: 'translate3d(0, 0, 0) rotate(0deg)' }}
      transition={reduced ? { duration: 0 } : {
        duration: entrance.duration,
        delay: entrance.delay,
        ease: [0.22, 0.1, 0.25, 1],
      }}
      onAnimationComplete={() => settle(side)}
      style={{
        width: 'var(--hand-size)',
        height: `calc(var(--hand-size) * ${HAND_HEIGHT / HAND_WIDTH})`,
        fontSize: `calc(var(--hand-size) / ${HAND_WIDTH / HAND_FONT_SIZE})`,
        lineHeight: `calc(var(--hand-size) / ${HAND_WIDTH / HAND_FONT_SIZE})`,
        transformOrigin: entrance.origin,
      }}
    >
      <pre className="font-mono text-zinc-500/25">{art.detail}</pre>
      <pre className="absolute inset-0 font-mono text-zinc-300/65">{art.body}</pre>
      <pre className="absolute inset-0 font-mono text-zinc-100">{art.highlights}</pre>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${HAND_WIDTH} ${HAND_HEIGHT}`} focusable="false">
        {HAND_WRAPS.map((wrap, finger) => {
          const x = side === 'left' ? wrap.x : HAND_WIDTH - wrap.x;
          const { y, rx, ry } = wrap;
          return (
            <g key={finger} data-finger-wrap={finger}>
              {[-2, 2].map((offset, turn) => {
                const id = `${wrapId}-${finger}-${turn}`;
                const front = `M${x - rx},${y + offset} C${x - rx},${y + offset + ry * 1.33} ${x + rx},${y + offset + ry * 1.33} ${x + rx},${y + offset}`;
                const back = `M${x - rx},${y + offset} C${x - rx},${y + offset - ry * 1.33} ${x + rx},${y + offset - ry * 1.33} ${x + rx},${y + offset}`;
                return (
                  <g key={turn}>
                    <defs>
                      <path id={id} d={front} />
                      <path id={`${id}-back`} d={back} />
                    </defs>
                    <text className="font-mono" fontSize="6" fill="#781114">
                      <textPath href={`#${id}-back`}>------------</textPath>
                    </text>
                    {/* A narrow shadow makes the cord sit in front of the chrome. */}
                    <use href={`#${id}`} fill="none" stroke="#0a0a0a" strokeWidth="3" />
                    <text className="font-mono" fontSize="6" fontWeight="500" fill="#c51b20" stroke="#c51b20" strokeWidth="0.25">
                      <textPath href={`#${id}`}>------------</textPath>
                    </text>
                  </g>
                );
              })}
              <text x={x} y={y + ry + 3} textAnchor="middle" className="font-mono" fontSize="5" fill="#c51b20">x</text>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

export function PuppetHands() {
  const { ready, reveal } = useEntrance();
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');

  useLayoutEffect(() => {
    const root = rootRef.current;
    const main = document.querySelector('main');
    if (!root || !main || !ready) return;

    const desktop = window.matchMedia('(min-width: 1024px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const paths = [...root.querySelectorAll<SVGPathElement>('.puppet-threads path')];
    const threads = [...root.querySelectorAll<SVGTextPathElement>('.puppet-threads textPath')];
    const nodes = [...root.querySelectorAll<SVGCircleElement>('.puppet-threads circle')];
    const hands = [...root.querySelectorAll<HTMLElement>('[data-puppet-hand]')];
    let anchors: HTMLElement[] = [];
    let raf = 0;
    let dirty = true;
    const threadCounts = new Array<number>(8).fill(0);
    const visibleCounts = new Array<number>(8).fill(-1);
    const arrivalCounts = new Array<number>(8).fill(0);
    const phrasing: { delay: number; duration: number; beats: number[] }[] = [];
    const arrived = new Array<boolean>(8).fill(false);
    const started = performance.now();
    let growing = !reduced.matches;
    let revealed = false;

    const draw = () => {
      if (document.hidden) return;
      const rootBox = root.getBoundingClientRect();
      const handBoxes = hands.map(hand => hand.getBoundingClientRect());
      const content = main.getBoundingClientRect();
      // Batch geometry reads before changing any SVG attributes.
      const anchorBoxes = anchors.map(anchor => anchor.getBoundingClientRect());

      for (let side = 0; side < 2; side++) {
        for (let index = 0; index < 4; index++) {
          const slot = side * 4 + index;
          const box = anchorBoxes[index];
          const path = paths[slot];
          const thread = threads[slot];
          const node = nodes[slot];
          if (!box) {
            path.removeAttribute('d');
            thread.textContent = '';
            threadCounts[slot] = 0;
            node.setAttribute('r', '0');
            continue;
          }
          const hand = handBoxes[side];
          const tip = HAND_TIPS[3 - index];
          const scale = hand.width / HAND_WIDTH;
          const sx = hand.left - rootBox.left + (side === 0 ? tip[0] : HAND_WIDTH - tip[0]) * scale;
          const sy = hand.top - rootBox.top + tip[1] * scale;
          const ex = (side === 0 ? box.left + 3 : box.right - 3) - rootBox.left;
          const ey = box.top - rootBox.top + 14;
          // Keep the long strings outside the conversation until their final
          // approach, including narrow bubbles far down the page.
          const mobile = !desktop.matches;
          const inset = mobile ? 4 + index * 2.5 : 30;
          const gutter = (side === 0 ? content.left - inset : content.right + inset) - rootBox.left;
          const span = Math.max(0, ey - sy);
          const shoulder = content.top - rootBox.top - 18 + index * 3;
          const d = mobile
            ? `M${sx.toFixed(1)},${sy.toFixed(1)} C${sx.toFixed(1)},${(sy + 18).toFixed(1)} ${gutter.toFixed(1)},${(shoulder - 20).toFixed(1)} ${gutter.toFixed(1)},${shoulder.toFixed(1)} L${gutter.toFixed(1)},${(ey - 18).toFixed(1)} Q${gutter.toFixed(1)},${ey.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`
            : `M${sx.toFixed(1)},${sy.toFixed(1)} C${sx.toFixed(1)},${(sy + span * 0.35).toFixed(1)} ${gutter.toFixed(1)},${(ey - Math.min(80, span * 0.2)).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
          if (path.getAttribute('d') !== d) {
            path.setAttribute('d', d);
            // Letters run along the thread, preserving the ASCII material.
            // A conservative control-polygon length avoids synchronous SVG
            // path measurement; reuse text while the panel animates.
            const length = mobile
              ? 56 + Math.hypot(gutter - sx, shoulder - sy - 38) + Math.abs(ey - 18 - shoulder) + Math.abs(ex - gutter)
              : span * 0.35 + Math.hypot(gutter - sx, span * 0.65 - Math.min(80, span * 0.2)) + Math.hypot(ex - gutter, Math.min(80, span * 0.2));
            const count = Math.ceil(length / 115.2) * 16;
            if (count !== threadCounts[slot]) {
              if (!growing || arrived[slot]) thread.textContent = '='.repeat(count * 2);
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
        threads.forEach((thread, slot) => {
          const phrase = phrasing[slot];
          const t = skip ? 1 : Math.max(0, Math.min((now - started - phrase.delay) / phrase.duration, 1));
          const progress = t * t * (3 - 2 * t);
          progressByChain[slot] = progress;
          if (arrived[slot]) return;
          let count = Math.max(0, visibleCounts[slot]);
          // Uneven but always forward: character timing is sampled once,
          // never randomized per frame, so the chain cannot flicker or retreat.
          while (count < phrase.beats.length && phrase.beats[count] <= progress) count++;
          if (count !== visibleCounts[slot]) {
            thread.textContent = '='.repeat(count);
            visibleCounts[slot] = count;
          }
          if (t === 1) {
            arrived[slot] = true;
            thread.textContent = '='.repeat(threadCounts[slot] * 2);
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
  }, [ready, reveal]);

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none select-none puppet-scene absolute inset-x-0 top-0 -z-10">
      {/* Separate SVGs keep a moving chain from relaying out every text path.
          Their fixed viewport never resizes with the expanding project list. */}
      {Array.from({ length: 8 }, (_, index) => (
        <svg key={index} height="1" className="puppet-threads absolute inset-x-0 top-0 w-full overflow-visible" focusable="false">
          <defs>
            <path id={`${id}-thread-${index}`} />
          </defs>
          <text className="font-mono" fontSize="6" fontWeight="500" fill="#b7191d" stroke="#b7191d" strokeWidth="0.2">
            <textPath href={`#${id}-thread-${index}`} />
          </text>
          <circle r="0" fill="#b7191d" />
        </svg>
      ))}
      <div className="puppet-hand-stage absolute inset-x-0 top-0">
        <Hand side="left" />
        <Hand side="right" />
      </div>
    </div>
  );
}
