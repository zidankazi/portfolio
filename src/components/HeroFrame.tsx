'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { profile } from '@/data/profile';
import { SkillsTicker } from '@/components/SkillsTicker';

const heroCandidates = ['/hero/hero.gif', '/hero/hero.png', '/hero/01.png', '/hero/1.png', '/hero/cover.png'];

export const HeroFrame = () => {
  const prefersReducedMotion = useReducedMotion();
  const [heroSrc, setHeroSrc] = useState<string | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 16, mass: 0.2 });
  const springY = useSpring(y, { stiffness: 120, damping: 16, mass: 0.2 });

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const findHero = async () => {
      for (const candidate of heroCandidates) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (mounted && !resolved) {
              setHeroSrc(candidate);
              resolved = true;
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = candidate;
        });
        if (!mounted || resolved) return;
      }
    };

    findHero();

    return () => {
      mounted = false;
    };
  }, []);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;
    x.set((offsetX / rect.width) * 8);
    y.set((offsetY / rect.height) * 8);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.section
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-transparent shadow-frame"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: 'easeOut' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >

      <div className="relative z-10">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-6 sm:p-8">
          <motion.div
            className="relative mx-auto h-[140px] w-[140px] flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-ink-800 shadow-lift sm:mx-0 sm:h-[200px] sm:w-[200px]"
            style={{
              translateX: springX,
              translateY: springY
            }}
          >
            {heroSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroSrc}
                alt="hero media"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-white/5 via-transparent to-white/15" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950/40" />
          </motion.div>

          <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:justify-center sm:text-left">
            <motion.h1
              className="font-heading text-2xl text-ink-100 sm:text-3xl md:text-4xl"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.1 }}
            >
              {profile.name}
            </motion.h1>
            <motion.p
              className="max-w-xl text-balance text-sm text-chrome-300"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
            >
              cs @ stevens, interested in mechanistic interpretability & software that amplifies human agency
            </motion.p>
            <div className="flex flex-wrap gap-2 text-[11px] tracking-[0.3em] text-chrome-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                research
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                alignment
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-8 sm:pb-8">
        <SkillsTicker />
      </div>
    </motion.section>
  );
};
