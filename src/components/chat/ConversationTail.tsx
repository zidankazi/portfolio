'use client';

import { Children, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { TypingIndicator } from './TypingIndicator';

const EASE = [0.2, 0.65, 0.3, 0.9];
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Reveals its children one at a time as the reader scrolls, with a "…" typing
 * bubble parked at the tail implying the next message is coming. Each section
 * "sends" when the typing bubble scrolls into view — the thread catches up to
 * you as you go.
 *
 * Accessibility / SEO: renders every section on the server and on first paint,
 * then (only when motion is welcome) collapses to the typing choreography
 * before the browser paints — no flash. Keyboard focus entering the region, or
 * prefers-reduced-motion, drops straight to the fully-revealed thread.
 */
export function ConversationTail({
  children,
  typingMs = 650,
}: {
  children: ReactNode;
  typingMs?: number;
}) {
  const sections = Children.toArray(children);
  const [revealed, setRevealed] = useState(sections.length);
  const [animate, setAnimate] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const typingRef = useRef<HTMLDivElement>(null);
  const typingInView = useInView(typingRef, { amount: 'some' });

  // Before paint, when motion is welcome, collapse to the typing choreography.
  useIsoLayoutEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      setRevealed(0);
      setAnimate(true);
    }
  }, []);

  // First scroll arms the reveal — before that, the bait just teases. Tab means
  // a keyboard user is navigating and can't reach not-yet-mounted links, so drop
  // straight to the full thread.
  useEffect(() => {
    const onScroll = () => setHasScrolled(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') setRevealed(sections.length);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
    };
  }, [sections.length]);

  const done = revealed >= sections.length;

  useEffect(() => {
    if (done || !typingInView) return;
    // Tease until the first scroll — unless the page can't scroll, in which
    // case advance on its own so the tail is never stranded off-screen.
    const scrollable =
      document.documentElement.scrollHeight > window.innerHeight + 4;
    if (scrollable && !hasScrolled) return;
    const id = setTimeout(() => setRevealed((n) => n + 1), typingMs);
    return () => clearTimeout(id);
  }, [typingInView, done, hasScrolled, typingMs, revealed]);

  // Keyboard / assistive tech: surface the whole tail the moment focus enters.
  const revealAll = () => setRevealed(sections.length);

  return (
    <div className="contents" onFocusCapture={revealAll}>
      {sections.slice(0, revealed).map((section, i) => (
        <motion.div
          key={i}
          initial={animate ? { opacity: 0, y: 6, filter: 'blur(4px)' } : false}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          {section}
        </motion.div>
      ))}

      {/* Permanent sentinel so useInView attaches from first render, even
          though the bubble inside it mounts/unmounts with the choreography */}
      <div ref={typingRef} aria-hidden={done}>
        {!done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE, delay: revealed === 0 ? 1.05 : 0 }}
          >
            <TypingIndicator />
          </motion.div>
        )}
      </div>
    </div>
  );
}
