'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { skillCategories } from '@/data/skills';

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
                <h1 className="text-3xl font-medium text-anthropic-text">skills</h1>
                <p className="text-sm text-anthropic-text/60">
                    technologies and tools I work with
                </p>
            </div>

            <div className="flex flex-col gap-12">
                {skillCategories.map((category) => (
                    <div key={category.title} className="flex flex-col gap-6">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-anthropic-text/50 border-b border-anthropic-border pb-2">
                            {category.title}
                        </h2>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {category.skills.map((skill) => (
                                <div key={skill.name} className="flex items-center gap-3 p-3 rounded bg-white border border-anthropic-border shadow-sm">
                                    <span className="text-lg opacity-80">{skill.icon}</span>
                                    <span className="text-sm font-medium text-anthropic-text">{skill.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </motion.main>
    );
}

