'use client';

import { AnimatedText } from '@/components/motion/AnimatedText';

export function NameHeader() {
  return (
    <header className="w-full mb-6 text-center">
      {/* AnimatedText marks its glyphs aria-hidden, so carry the real name for AT */}
      <h1 className="sr-only">Zidan Kazi</h1>

      <AnimatedText
        text="Zidan Kazi"
        element="span"
        className="block font-display font-extralight text-white/35 text-[38px] sm:text-[46px] leading-none tracking-[0.01em]"
        delay={0}
      />
    </header>
  );
}
