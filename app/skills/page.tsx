'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { skillCategories } from '@/data/skills';
import { SpotlightSkill } from '@/components/SpotlightSkill';

export default function SkillsPage() {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.main
            className="flex flex-col gap-16 pb-20"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
            <div className="flex flex-col gap-2">
                <h1 className="font-heading text-3xl text-ink-100">skills</h1>
                <p className="text-sm text-chrome-400">
                    technologies and tools I work with
                </p>
            </div>

            <div className="flex flex-col gap-12">
                {skillCategories.map((category, categoryIndex) => (
                    <motion.div
                        key={category.title}
                        className="flex flex-col gap-6"
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: prefersReducedMotion ? 0 : 0.4,
                            delay: prefersReducedMotion ? 0 : categoryIndex * 0.08,
                        }}
                    >
                        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-chrome-500">
                            {category.title}
                        </h2>

                        {/* Grid Layout for Spotlight Skills */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {category.skills.map((skill) => (
                                <SpotlightSkill key={skill.name} skill={skill} />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.main>
    );
}

