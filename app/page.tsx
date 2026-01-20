'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { HeroFrame } from '@/components/HeroFrame';
import { ProjectCard } from '@/components/ProjectCard';
import { projects } from '@/data/projects';

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50, damping: 20 } },
  };

  return (
    <motion.main
      className="flex flex-col gap-12 pb-20"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
    >
      <HeroFrame />

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <motion.h2
            className="font-heading text-2xl text-ink-100"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            featured projects
          </motion.h2>
          <Link
            href="/projects"
            className="text-xs tracking-[0.3em] text-chrome-400 transition hover:text-ink-100"
          >
            view all
          </Link>
        </div>
        <motion.div
          className="grid gap-6 lg:grid-cols-2"
          variants={!prefersReducedMotion ? container : undefined}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
        >
          {projects.slice(0, 2).map((project) => (
            <motion.div key={project.title} variants={item}>
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </motion.main>
  );
}
