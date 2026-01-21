'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { skillCategories } from '@/data/skills';
import { SpotlightSkill } from '@/components/SpotlightSkill';

export default function SkillsPage() {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.main
            className="flex flex-col gap-16 pb-20"
            // Parent Orchestrator
            initial="hidden"
            animate="visible"
            variants={{
                visible: {
                    transition: {
                        staggerChildren: 0.1, // Stagger categories
                    }
                }
            }}
        >
            <motion.div
                className="flex flex-col gap-2"
                variants={{
                    hidden: { opacity: 0, y: -20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                }}
            >
                <h1 className="font-heading text-3xl text-ink-100">skills</h1>
                <p className="text-sm text-chrome-400">
                    technologies and tools I work with
                </p>
            </motion.div>

            <div className="flex flex-col gap-12">
                {skillCategories.map((category, categoryIndex) => (
                    <motion.div
                        key={category.title}
                        className="flex flex-col gap-6"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.05, // Rapid fire stagger for skills within category
                                    delayChildren: 0.1     // Slight pause before unleashing skills
                                }
                            }
                        }}
                    >
                        <motion.h2
                            className="text-xs font-medium uppercase tracking-[0.2em] text-chrome-500"
                            variants={{
                                hidden: { opacity: 0, x: -10 },
                                visible: { opacity: 1, x: 0 }
                            }}
                        >
                            {category.title}
                        </motion.h2>

                        {/* Grid Layout for Spotlight Skills */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {category.skills.map((skill, index) => (
                                <SpotlightSkill key={skill.name} skill={skill} index={index} />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.main>
    );
}

