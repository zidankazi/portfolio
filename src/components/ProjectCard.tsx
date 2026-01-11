'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { Project } from '@/data/projects';

export const ProjectCard = ({ project }: { project: Project }) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.article
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
      className="rounded-2xl border border-white/10 bg-ink-900/70 p-6 shadow-frame"
    >
      <div className="flex items-start justify-between gap-4">
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
            <a
              key={link.label}
              href={link.href}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-chrome-400 transition hover:text-ink-100"
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-[0.3em] text-chrome-400"
          >
            {tag}
          </span>
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-sm text-ink-200">
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
