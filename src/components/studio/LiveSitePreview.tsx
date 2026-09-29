'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './LiveSitePreview.module.css';

export function LiveSitePreview({ src, poster, name }: { src: string; poster: string; name: string }) {
  const container = useRef<HTMLDivElement>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout>>();
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    // Touch devices use the poster so opening a project does not keep two
    // full desktop sites running inside the studio page as well.
    const livePreview = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const update = () => {
      setWidth(livePreview.matches ? element.clientWidth : 0);
      if (!livePreview.matches) {
        clearTimeout(revealTimer.current);
        setReady(false);
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    livePreview.addEventListener('change', update);
    update();
    return () => {
      observer.disconnect();
      livePreview.removeEventListener('change', update);
      clearTimeout(revealTimer.current);
    };
  }, []);

  function reveal() {
    clearTimeout(revealTimer.current);
    // Let the site's own entrance finish before replacing the poster.
    revealTimer.current = setTimeout(() => setReady(true), 5000);
  }

  return (
    <div ref={container} className={styles.preview} aria-hidden="true">
      <Image src={poster} alt="" fill priority sizes="(max-width: 540px) 82vw, 500px" className={styles.poster} />
      {width > 0 && (
        <iframe
          src={src}
          title={`${name} live preview`}
          tabIndex={-1}
          loading="eager"
          allow="autoplay"
          sandbox="allow-scripts allow-same-origin"
          onLoad={reveal}
          className={`${styles.frame} ${ready ? styles.ready : ''}`}
          style={{ transform: `scale(${width / 1440})` }}
        />
      )}
    </div>
  );
}
