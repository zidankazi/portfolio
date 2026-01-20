'use client';

import Image from 'next/image';
import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion, useMotionTemplate, useMotionValue } from 'framer-motion';
import type { Project } from '@/data/projects';

export const ProjectCard = ({ project }: { project: Project }) => {
  const prefersReducedMotion = useReducedMotion();
  const [clickedLink, setClickedLink] = useState<string | null>(null);

  // Spotlight effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback(
    ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    },
    [mouseX, mouseY]
  );

  return (
    <motion.article
      whileHover={prefersReducedMotion ? undefined : { y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onMouseMove={handleMouseMove}
      className="group relative rounded-2xl border border-white/10 bg-ink-900/70 p-6 shadow-frame"
    >


      {/* Spotlight Gradient */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.1),
              transparent 80%
            )
          `,
        }}
      />

      <div className="relative z-20 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-xl text-ink-100">{project.title}</h3>
          <p className="mt-2 text-sm text-chrome-400">{project.description}</p>
          {project.notice ? (
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-amber-300">
              {project.notice}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2 text-xs tracking-[0.2em]">
          {project.links.map((link) => (
            <div key={link.label} className="relative">
              <a
                href={link.href}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-chrome-400 transition hover:text-ink-100"
                target={link.label === 'site' && project.title === 'portfolio' ? '_self' : '_blank'}
                rel="noreferrer"
                onClick={(e) => {
                  if (link.label === 'site' && project.title === 'portfolio') {
                    e.preventDefault();
                    setClickedLink(link.label);
                    setTimeout(() => setClickedLink(null), 2000);
                  }
                }}
              >
                {link.label}
              </a>
              <AnimatePresence>
                {clickedLink === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 rounded border border-amber-300/20 bg-ink-900 px-2 py-1 text-[10px] text-amber-300 shadow-xl"
                  >
                    you&apos;re already there :]
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-20 mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-[0.3em] text-chrome-400 backdrop-blur-sm"
          >
            {tag}
          </span>
        ))}
      </div>
      <ul className="relative z-20 mt-4 space-y-2 text-sm text-ink-200">
        {project.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/50" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
};
