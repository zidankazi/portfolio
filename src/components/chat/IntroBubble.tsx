'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { AnimatedText } from '@/components/motion/AnimatedText';

const EASE = [0.2, 0.65, 0.3, 0.9];

export function IntroBubble() {
  return (
    <div className="flex gap-3 items-end sm:items-start group w-full">
      {/* Avatar */}
      <div className="shrink-0 w-8 flex justify-center">
        <motion.div
          className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
        >
          <Image
            src="/avatar.jpeg"
            alt="Zidan Kazi"
            fill
            className="object-cover"
            sizes="32px"
          />
        </motion.div>
      </div>

      {/* Bubble */}
      <motion.div
        className="bg-[#161618] text-[#d4d4d4] rounded-[20px] rounded-tl-sm px-4 py-3 text-[14px] leading-[1.6] border border-white/5 shadow-sm w-full"
        initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
      >
        <p>
          I&apos;m{' '}
          <AnimatedText
            text="Zidan"
            element="i"
            className="font-heading text-white text-[20px]"
            delay={0.6}
            wave
          />
          , a sophomore at{' '}
          <motion.a
            href="https://www.stevens.edu/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 decoration-white/30 hover:decoration-white/70 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.9 }}
          >
            Stevens Institute of Technology
          </motion.a>{' '}
          <motion.span
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: EASE, delay: 1.0 }}
          >
            studying Computer Science &amp; Math.
          </motion.span>
        </p>
      </motion.div>
    </div>
  );
}
