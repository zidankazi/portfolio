'use client';

import { Children, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { TypingIndicator } from './TypingIndicator';

const EASE = [0.2, 0.65, 0.3, 0.9];
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Unfolds its children one message at a time, with a "…" typing bubble parked
 * at the tail. The thread advances on its own — quickly once the typing bubble
 * is on screen, more slowly otherwise — so it always completes whether the
 * reader scrolls along or just waits. It never stalls waiting for a scroll.
 *
 * Accessibility / SEO: renders every section on the server and on first paint,
 * then (only when motion is welcome) collapses to the choreography before the
 * browser paints — no flash. Keyboard focus/Tab into the region, or
 * prefers-reduced-motion, drops straight to the fully-revealed thread.
 */
export function ConversationTail({
  children,
  typingMs = 650,
  idleMs = 1400,
}: {
  children: ReactNode;
  typingMs?: number;
  idleMs?: number;
}) {
  const sections = Children.toArray(children);
  const [revealed, setRevealed] = useState(sections.length);
  const [animate, setAnimate] = useState(false);

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

  // Keyboard users can't reach not-yet-mounted links, so a Tab drops straight
  // to the full thread.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') setRevealed(sections.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sections.length]);

  const done = revealed >= sections.length;

  // Self-advancing: fast once the bubble is visible (you've scrolled to it),
  // slower when it's below the fold — but always moving, so waiting works too.
  // The first message waits a beat for the on-load cascade above it to settle.
  useEffect(() => {
    if (done) return;
    const delay = revealed === 0 ? 1300 : typingInView ? typingMs : idleMs;
    const id = setTimeout(() => setRevealed((n) => n + 1), delay);
    return () => clearTimeout(id);
  }, [done, revealed, typingInView, typingMs, idleMs]);

  // Assistive tech: surface the whole tail the moment focus enters.
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
