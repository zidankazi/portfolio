'use client';

import { useLayoutEffect, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useEntrance } from '@/components/motion/Entrance';
import { HAND_LEFT, HAND_RIGHT, HAND_WIDTH, HAND_HEIGHT, HAND_FONT_SIZE, HAND_TIPS } from './puppetHandArt';

// A descending phrase, with the leading hand alternating between pairs.
// Slots 0–3 belong to the left hand; 4–7 belong to the right.
const CHAIN_ENTRIES = [0, 225, 385, 725, 65, 175, 465, 640];
const CHAIN_DURATIONS = [940, 1070, 1150, 1240, 975, 1030, 1190, 1210];

function Hand({ side }: { side: 'left' | 'right' }) {
  const art = side === 'left' ? HAND_LEFT : HAND_RIGHT;
  const { settle } = useEntrance();
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-puppet-hand={side}
      className="absolute -top-3"
      initial={{ y: -HAND_HEIGHT - 40 }}
      animate={{ y: 0 }}
      transition={reduced ? { duration: 0 } : {
        type: 'spring', stiffness: 150, damping: 17, mass: 1.2,
        delay: side === 'left' ? 0.08 : 0.16,
        restDelta: 0.5, restSpeed: 2,
      }}
      onAnimationComplete={() => settle(side)}
      style={{
        width: HAND_WIDTH,
        height: HAND_HEIGHT,
        fontSize: HAND_FONT_SIZE,
        lineHeight: `${HAND_FONT_SIZE}px`,
        maskImage: 'linear-gradient(to bottom, transparent 12px, black 46px)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 12px, black 46px)',
        [side]: 'calc(50% - 480px)',
      }}
    >
      <pre className="font-mono text-zinc-500/25">{art.detail}</pre>
      <pre className="absolute inset-0 font-mono text-zinc-300/65">{art.body}</pre>
      <pre className="absolute inset-0 font-mono text-zinc-100">{art.highlights}</pre>
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
    const svg = root?.querySelector('svg');
    if (!root || !main || !svg || !ready) return;

    const desktop = window.matchMedia('(min-width: 1024px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const paths = [...svg.querySelectorAll('path')];
    const threads = [...svg.querySelectorAll('textPath')];
    const nodes = [...svg.querySelectorAll('circle')];
    const hands = [...root.querySelectorAll<HTMLElement>('[data-puppet-hand]')];
    let anchors: HTMLElement[] = [];
    let raf = 0;
    let until = 0;
    let previousHeight = 0;
    const threadCounts = new Array<number>(8).fill(0);
    const visibleCounts = new Array<number>(8).fill(-1);
    const arrivalCounts = new Array<number>(8).fill(0);
    const phrasing: { delay: number; duration: number; beats: number[] }[] = [];
    const arrived = new Array<boolean>(8).fill(false);
    const started = performance.now();
    let growing = desktop.matches && !reduced.matches;
    let revealed = false;

    const draw = () => {
      if (!desktop.matches || document.hidden) return;
      const rootBox = root.getBoundingClientRect();
      const height = document.body.offsetHeight;
      const handBoxes = hands.map(hand => hand.getBoundingClientRect());
      const content = main.getBoundingClientRect();
      // Batch geometry reads before changing any SVG attributes.
      const anchorBoxes = anchors.map(anchor => anchor.getBoundingClientRect());
      if (height !== previousHeight) {
        svg.setAttribute('height', String(height));
        previousHeight = height;
      }

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
          const sx = hand.left - rootBox.left + (side === 0 ? tip[0] : HAND_WIDTH - tip[0]);
          const sy = hand.top - rootBox.top + tip[1];
          const ex = (side === 0 ? box.left + 3 : box.right - 3) - rootBox.left;
          const ey = box.top - rootBox.top + 14;
          // Keep the long strings outside the conversation until their final
          // approach, including narrow bubbles far down the page.
          const gutter = (side === 0 ? content.left - 30 : content.right + 30) - rootBox.left;
          const span = Math.max(0, ey - sy);
          const d = `M${sx.toFixed(1)},${sy.toFixed(1)} C${sx.toFixed(1)},${(sy + span * 0.35).toFixed(1)} ${gutter.toFixed(1)},${(ey - Math.min(80, span * 0.2)).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
          if (path.getAttribute('d') !== d) {
            path.setAttribute('d', d);
            // Letters run along the thread, preserving the ASCII material.
            // A conservative control-polygon length avoids synchronous SVG
            // path measurement; reuse text while the panel animates.
            const length = span * 0.35 + Math.hypot(gutter - sx, span * 0.65 - Math.min(80, span * 0.2)) + Math.hypot(ex - gutter, Math.min(80, span * 0.2));
            const count = Math.ceil(length / 115.2) * 16;
            if (count !== threadCounts[slot]) {
              if (!growing || arrived[slot]) thread.textContent = 'il'.repeat(count);
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
      if (now < until) draw();
      if (growing) {
        const skip = !desktop.matches || reduced.matches;
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
            thread.textContent = 'il'.repeat(Math.ceil(count / 2)).slice(0, count);
            visibleCounts[slot] = count;
          }
          if (t === 1) {
            arrived[slot] = true;
            thread.textContent = 'il'.repeat(threadCounts[slot]);
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
      if ((growing || now < until) && !document.hidden) raf = requestAnimationFrame(frame);
    };
    // Track the existing bubble entrance/expansion animations, then go idle.
    // No extra idle animation is introduced, including under reduced motion.
    const schedule = () => {
      until = performance.now() + (reduced.matches ? 80 : 450);
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const resize = new ResizeObserver(schedule);
    const discover = () => {
      anchors = [...main.querySelectorAll<HTMLElement>('[data-puppet-anchor]')].slice(0, 4);
      resize.disconnect();
      resize.observe(document.body);
      anchors.forEach(anchor => resize.observe(anchor));
      schedule();
    };
    const mutations = new MutationObserver(discover);
    mutations.observe(main, { childList: true, subtree: true });
    desktop.addEventListener('change', schedule);
    reduced.addEventListener('change', schedule);
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('resize', schedule);
    // Scroll coordinates cancel out for this document-positioned artwork, but
    // a refresh also covers mobile browser viewport changes and scroll reveals.
    window.addEventListener('scroll', schedule, { passive: true });
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
      window.removeEventListener('scroll', schedule);
    };
  }, [ready, reveal]);

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none select-none absolute inset-x-0 top-0 -z-10 hidden lg:block">
      <svg className="puppet-threads absolute inset-x-0 top-0 w-full overflow-visible" focusable="false">
        <defs>
          {Array.from({ length: 8 }, (_, index) => <path key={index} id={`${id}-thread-${index}`} />)}
        </defs>
        {Array.from({ length: 8 }, (_, index) => (
          <g key={index}>
            <text className="font-mono" fontSize="6" fill="rgba(212,212,216,0.28)">
              <textPath href={`#${id}-thread-${index}`} />
            </text>
            <circle r="0" fill="rgba(228,228,231,0.4)" />
          </g>
        ))}
      </svg>
      <Hand side="left" />
      <Hand side="right" />
    </div>
  );
}
