'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { createSigil, SIGIL_HEIGHT } from './sigilGeometry';

const DRIFT_PX_PER_SEC = 14;
const PARALLAX = 0.45;

const Sigil = memo(function Sigil({ index, salt }: { index: number; salt: number }) {
  return (
    <svg
      viewBox={`0 0 200 ${SIGIL_HEIGHT}`}
      width="100%"
      height={SIGIL_HEIGHT}
      preserveAspectRatio="none"
      fill="currentColor"
      className="block"
      focusable="false"
      data-sigil={index}
    >
      <path d={createSigil(index, salt)} />
    </svg>
  );
});

function Rail({ side }: { side: 'left' | 'right' }) {
  const railRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ start: -1, count: 0 });

  useEffect(() => {
    const rail = railRef.current;
    const shift = shiftRef.current;
    if (!rail || !shift) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1024px)');
    const direction = side === 'left' ? 1 : -1;
    let raf = 0;
    let last = performance.now();
    let drift = 0;
    let count = 0;
    let start = -1;

    // React only adds/removes ink at section boundaries. Absolute positions
    // avoid a one-frame jump while React commits the next section.
    const position = () => {
      const offset = drift + (reduced.matches ? 0 : window.scrollY * PARALLAX * direction);
      const nextStart = Math.floor(offset / SIGIL_HEIGHT) - 1;
      if (nextStart !== start) {
        start = nextStart;
        setRange({ start, count });
      }
      shift.style.transform = `translate3d(0, ${-offset}px, 0)`;
    };

    const frame = (now: number) => {
      drift += Math.min((now - last) / 1000, 0.05) * DRIFT_PX_PER_SEC * direction;
      last = now;
      position();
      raf = requestAnimationFrame(frame);
    };

    const sync = () => {
      cancelAnimationFrame(raf);
      count = desktop.matches ? Math.ceil(rail.clientHeight / SIGIL_HEIGHT) + 3 : 0;
      setRange({ start, count });
      position();
      if (desktop.matches && !reduced.matches && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const observer = new ResizeObserver(sync);
    observer.observe(rail);
    reduced.addEventListener('change', sync);
    desktop.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      reduced.removeEventListener('change', sync);
      desktop.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [side]);

  return (
    <div
      ref={railRef}
      aria-hidden="true"
      className={`sigil-ink pointer-events-none select-none fixed inset-y-0 -z-10 hidden lg:block overflow-hidden text-zinc-400/50 ${
        side === 'left' ? 'left-4' : 'right-4'
      }`}
      style={{
        width: 'clamp(144px, 16vw, 220px)',
        maskImage: 'linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)',
      }}
    >
      <div ref={shiftRef} className="relative" style={{ willChange: 'transform' }}>
        {Array.from({ length: range.count }, (_, i) => {
          const index = range.start + i;
          return (
            <div key={index} className="absolute inset-x-0" style={{ top: index * SIGIL_HEIGHT }}>
              <Sigil index={index} salt={side === 'left' ? 17 : 83} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SigilRails() {
  return <><Rail side="left" /><Rail side="right" /></>;
}
