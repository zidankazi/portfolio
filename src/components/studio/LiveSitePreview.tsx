'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import styles from './LiveSitePreview.module.css';

export function LiveSitePreview({ src, poster, name }: { src: string; poster: string; name: string }) {
  const container = useRef<HTMLDivElement>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout>>();
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => {
      observer.disconnect();
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
      <Image src={poster} alt="" fill priority unoptimized className={styles.poster} />
      {width > 0 && reducedMotion === false && (
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
