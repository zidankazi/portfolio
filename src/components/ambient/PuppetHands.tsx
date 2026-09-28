'use client';

import { useEffect, useId, useRef } from 'react';
import { HAND_LEFT, HAND_RIGHT, HAND_WIDTH, HAND_HEIGHT, HAND_FONT_SIZE, HAND_TIPS } from './puppetHandArt';

function Hand({ side }: { side: 'left' | 'right' }) {
  const art = side === 'left' ? HAND_LEFT : HAND_RIGHT;
  return (
    <div
      data-puppet-hand={side}
      className="absolute top-6"
      style={{
        width: HAND_WIDTH,
        height: HAND_HEIGHT,
        fontSize: HAND_FONT_SIZE,
        lineHeight: `${HAND_FONT_SIZE}px`,
        [side]: 'calc(50% - 480px)',
      }}
    >
      <pre className="font-mono text-zinc-400/30">{art.detail}</pre>
      <pre className="absolute inset-0 font-mono text-zinc-300/55">{art.body}</pre>
      <pre className="absolute inset-0 font-mono text-zinc-100/85">{art.highlights}</pre>
    </div>
  );
}

export function PuppetHands() {
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    const root = rootRef.current;
    const main = document.querySelector('main');
    const svg = root?.querySelector('svg');
    if (!root || !main || !svg) return;

    const desktop = window.matchMedia('(min-width: 1024px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const paths = [...svg.querySelectorAll('path')];
    const threads = [...svg.querySelectorAll('textPath')];
    const nodes = [...svg.querySelectorAll('circle')];
    const hands = [...root.querySelectorAll<HTMLElement>('[data-puppet-hand]')];
    let anchors: HTMLElement[] = [];
    let raf = 0;
    let until = 0;

    const draw = () => {
      if (!desktop.matches || document.hidden) return;
      const rootBox = root.getBoundingClientRect();
      const width = rootBox.width;
      const height = document.body.offsetHeight;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('height', String(height));
      const handBoxes = hands.map(hand => hand.getBoundingClientRect());
      const content = main.getBoundingClientRect();

      for (let side = 0; side < 2; side++) {
        for (let index = 0; index < 4; index++) {
          const slot = side * 4 + index;
          const anchor = anchors[index];
          const path = paths[slot];
          const thread = threads[slot];
          const node = nodes[slot];
          if (!anchor) {
            path.removeAttribute('d');
            thread.textContent = '';
            node.setAttribute('r', '0');
            continue;
          }
          const box = anchor.getBoundingClientRect();
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
            const length = path.getTotalLength();
            thread.textContent = 'il'.repeat(Math.ceil(length / 7.2));
            node.setAttribute('cx', ex.toFixed(1));
            node.setAttribute('cy', ey.toFixed(1));
            node.setAttribute('r', '1.5');
          }
        }
      }
    };

    const frame = (now: number) => {
      raf = 0;
      draw();
      if (now < until && desktop.matches && !document.hidden) raf = requestAnimationFrame(frame);
    };
    // Track the existing bubble entrance/expansion animations, then go idle.
    // No extra idle animation is introduced, including under reduced motion.
    const schedule = () => {
      until = performance.now() + (reduced.matches ? 80 : 1200);
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
    until = performance.now() + 3500;

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
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none select-none absolute inset-x-0 top-0 -z-10 hidden lg:block">
      <svg className="absolute inset-x-0 top-0 w-full overflow-visible" focusable="false">
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
