'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

// Incoming "…" bubble — mirrors the avatar + bubble treatment of the real
// messages so it reads as Zidan mid-typing. Decorative, so hidden from AT.
export function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end sm:items-start w-full" aria-hidden="true">
      <div className="shrink-0 w-8 flex justify-center">
        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
          <Image src="/avatar.jpeg" alt="" fill className="object-cover" sizes="32px" />
        </div>
      </div>

      <div className="bg-[#161618] rounded-[20px] rounded-tl-sm px-4 py-[15px] border border-white/5 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block w-1.5 h-1.5 rounded-full bg-zinc-500"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -2.5, 0] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.16,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
