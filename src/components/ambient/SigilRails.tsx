'use client';

import { useEffect, useRef } from 'react';
import { SIGIL_LEFT, SIGIL_RIGHT } from './sigilStrip';
import { useEntrance } from '@/components/motion/Entrance';

const DRIFT_PX_PER_SEC = 12;
const DEPTH = [-0.7, 0, 0.45];
const INK = [
  { key: 'detail', color: 'text-zinc-400/[0.18]' },
  { key: 'body', color: 'text-zinc-300/[0.36]' },
  { key: 'highlights', color: 'text-zinc-200/[0.58]' },
] as const;

type SigilText = typeof SIGIL_LEFT;

function Rail({ text, side }: { text: SigilText; side: 'left' | 'right' }) {
  const { ready } = useEntrance();
  const poseRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pose = poseRef.current;
    const shift = shiftRef.current;
    const tile = shift?.querySelector('pre');
    if (!pose || !shift || !tile || !ready) return;

    const layers = [...shift.querySelectorAll<HTMLElement>('[data-sigil-depth]')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1024px)');
    const dir = side === 'left' ? -1 : 1;
    let raf = 0;
    let last = performance.now();
    let drift = 0;
    let elapsed = 0;
    let scroll = window.scrollY;
    let momentum = 0;
    let h = tile.offsetHeight;

    const frame = (now: number) => {
      raf = 0;
      if (document.hidden || reduced.matches || !desktop.matches) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (h > 0 && dt > 0) {
        elapsed += dt;
        const progress = Math.min(elapsed / 1.1, 1);
        const entrance = progress * progress * (3 - 2 * progress);
        // The autonomous phrase continues underneath a damped scroll response.
        const previousScroll = scroll;
        scroll += (window.scrollY - scroll) * (1 - Math.exp(-dt / 0.14));
        const velocity = Math.max(-1, Math.min(1, (scroll - previousScroll) / dt / 1000));
        momentum += (velocity - momentum) * (1 - Math.exp(-dt / 0.18));
        const phase = elapsed + (side === 'left' ? 0 : 4.7);
        const wave = (Math.sin(phase * 0.62) + 1) / 2;
        const idleTurn = Math.sin(phase * 0.37) * 0.72 + Math.sin(phase * 0.81) * 0.28;
        const turn = Math.max(-1, Math.min(1, idleTurn + momentum * 0.55));
        const energy = Math.min(1, (Math.sin(phase * 0.93 - 0.8) + 1) / 2 + Math.abs(momentum) * 0.25);
        drift += dt * DRIFT_PX_PER_SEC * (0.6 + wave * 1.65) * dir * entrance;
        const raw = drift + scroll * 0.42 * dir;
        const y = ((raw % h) - h) % h;
        shift.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;

        // The whole strip turns like a narrow piece of engraved metal. All
        // movement is bounded inside the edge gutter, away from the content.
        const sway = Math.sin(phase * 0.42) * 4 * entrance;
        pose.style.transform = `perspective(800px) translateX(${sway.toFixed(2)}px) rotateY(${(turn * dir * 15 * entrance).toFixed(2)}deg) rotateZ(${(-turn * dir * 1.4 * entrance).toFixed(2)}deg) scaleX(${(1 + wave * 0.045 * entrance).toFixed(4)})`;

        layers.forEach((layer, index) => {
          const depth = DEPTH[index];
          // Bounded depth offsets breathe around the original registration;
          // the three ink layers always remain one recognizable shape.
          layer.style.transform = `translate3d(${(turn * depth * dir * 3 * entrance).toFixed(2)}px, ${(turn * depth * 7 * entrance).toFixed(2)}px, 0)`;
          layer.style.opacity = String(index === 2 ? 0.65 + energy * 0.35 : index === 0 ? 0.85 + (1 - energy) * 0.15 : 1);
        });
      }
      raf = requestAnimationFrame(frame);
    };

    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (reduced.matches) {
        pose.style.transform = '';
        shift.style.transform = '';
        layers.forEach(layer => { layer.style.transform = ''; layer.style.opacity = ''; });
      }
      if (ready && desktop.matches && !reduced.matches && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const resize = new ResizeObserver(() => { h = tile.offsetHeight; });
    resize.observe(tile);
    desktop.addEventListener('change', sync);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      desktop.removeEventListener('change', sync);
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [side, ready]);

  return (
    <div
      aria-hidden
      data-sigil-side={side}
      className={`sigil-ink pointer-events-none select-none fixed inset-y-0 -z-10 overflow-hidden w-[48px] opacity-60 lg:opacity-100 lg:w-[234px] ${side === 'left' ? '-left-4 lg:left-1' : '-right-4 lg:right-1'}`}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)',
      }}
    >
      <div ref={poseRef} className="sigil-pose absolute inset-0 lg:px-4" style={{ willChange: 'transform' }}>
        <div ref={shiftRef} className="sigil-scroll relative" style={{ willChange: 'transform' }}>
          {INK.map(({ key, color }, index) => (
            <div key={key} data-sigil-depth={key} style={{ willChange: 'transform, opacity' }} className={index === 0 ? 'relative' : 'absolute inset-x-0 top-0'}>
              <pre className={`font-mono text-[3px] lg:text-[6px] leading-none ${color}`}>{text[key]}</pre>
              <pre className={`font-mono text-[3px] lg:text-[6px] leading-none ${color}`}>{text[key]}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SigilRails() {
  return (
    <>
      <Rail text={SIGIL_LEFT} side="left" />
      <Rail text={SIGIL_RIGHT} side="right" />
    </>
  );
}
