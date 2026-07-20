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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 p-2 text-white/20 transition-colors hover:text-white/50"
        >
          <motion.span
            className="block"
            animate={{ y: [0, 2, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
