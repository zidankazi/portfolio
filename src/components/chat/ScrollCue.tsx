'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * A gentle "there's more below" nudge. Appears whenever a meaningful amount of
 * page sits below the fold — including as the conversation unfolds and grows —
 * and fades out as you near the bottom. Tapping it scrolls down a screenful.
 */
export function ScrollCue() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const remaining = el.scrollHeight - (window.scrollY + window.innerHeight);
      setShow(remaining > 140);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // The thread grows as it unfolds — react to height changes, not just scroll.
    const ro = new ResizeObserver(update);
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          aria-label="Scroll down for more"
          onClick={() =>
            window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })
          }
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="fixed bottom-5 left-1/2 z-50 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-[#161618]/70 text-zinc-400 backdrop-blur-sm transition-colors hover:border-white/20 hover:text-zinc-100"
        >
          <motion.span
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
