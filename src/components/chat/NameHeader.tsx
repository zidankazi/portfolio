'use client';

import { AnimatedText } from '@/components/motion/AnimatedText';

export function NameHeader() {
  return (
    <header className="w-full mb-8 text-center">
      {/* AnimatedText marks its glyphs aria-hidden, so carry the real name for AT */}
      <h1 className="sr-only">Zidan Kazi</h1>

      {/* Stacked two-line block — blackletter reads best as a dense mass */}
      <div
        aria-hidden="true"
        className="font-display font-extralight text-white/70 leading-[0.98] tracking-[-0.02em]"
      >
        <AnimatedText
          text="Zidan"
          element="span"
          className="block text-[52px] sm:text-[72px]"
          delay={0}
        />
        <AnimatedText
          text="Kazi"
          element="span"
          className="block text-[52px] sm:text-[72px]"
          delay={0.18}
        />
      </div>
    </header>
  );
}
