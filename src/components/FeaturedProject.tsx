'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import type { Project } from '@/data/projects';

export const FeaturedProject = ({ project, index }: { project: Project; index: number }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isEven = index % 2 === 0;

    // Reduced motion overhead - no heavy blurs/filters on scroll
    // The 'Read Flow' is driven by viewport entry (whileInView)

    const containerVariants = {
        hidden: { opacity: 0.2 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2, // Time between Title -> Desc -> Bullets
                delayChildren: 0.2
            }
        }
    };

    const titleVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
    };

    const textVariants = {
        hidden: { opacity: 0, color: '#525252' }, // chrome-600
        visible: {
            opacity: 1,
            color: '#f5f5f5', // ink-100
            transition: { duration: 0.8 }
        }
    };

    const bulletVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.5 }
        }
    };

    return (
        <motion.div
            ref={containerRef}
            className={`relative flex flex-col gap-12 rounded-[40px] px-4 py-8 lg:flex-row lg:items-center lg:gap-24 lg:p-16 ${isEven ? '' : 'lg:flex-row-reverse'
                }`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: '-20%' }} // Re-triggers when scrolling back up/down
            variants={containerVariants}
        >
            {/* Content Side */}
            <div className="flex flex-1 flex-col gap-8">
                <motion.div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        {/* Title with Gradient Flow */}
                        <motion.h3
                            variants={titleVariants}
                            className={`font-heading text-5xl font-bold lg:text-7xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${project.colors || 'from-white to-gray-400'}`}
                            style={{ paddingBottom: '0.1em' }} // Fix descenders getting clipped
                        >
                            {project.title}
                        </motion.h3>

                        <motion.div variants={titleVariants} className="flex gap-2">
                            {project.links.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-widest text-chrome-400 transition hover:bg-white/10 hover:text-white"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </motion.div>
                    </div>

                    <motion.p
                        variants={textVariants}
                        className="text-xl leading-relaxed lg:text-2xl"
                    >
                        {project.description}
                    </motion.p>
                </motion.div>

                <motion.ul className="space-y-3">
                    {project.bullets.map((bullet, i) => (
                        <motion.li
                            key={bullet}
                            variants={bulletVariants}
                            className="flex items-start gap-3 text-base font-light text-chrome-200 lg:text-lg"
                        >
                            <span className={`mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r ${project.colors} opacity-80`} />
                            <span className="leading-relaxed">{bullet}</span>
                        </motion.li>
                    ))}
                </motion.ul>

                <motion.div
                    variants={bulletVariants}
                    className="flex flex-wrap gap-3 pt-2"
                >
                    {project.tags.map((tag) => (
                        <span key={tag} className="text-xs font-bold uppercase tracking-[0.2em] text-chrome-400/60">
                            {tag}
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* Image Side - Simple Scale Entrance, preserved Tilt */}
            <motion.div
                className={`relative flex flow-row justify-center flex-1 ${project.orientation === 'portrait' ? 'lg:justify-center' : ''}`}
                style={{ perspective: 1000 }}
                variants={{
                    hidden: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
                    visible: {
                        opacity: 1,
                        scale: 1,
                        filter: 'blur(0px)',
                        transition: { duration: 0.8, delay: 0.2 }
                    }
                }}
            >
                {project.image && (
                    <ProjectImage project={project} />
                )}
            </motion.div>
        </motion.div>
    );
};

/* Separated Image Component for Clean State Management */
const ProjectImage = ({ project }: { project: Project }) => {
    const x = useMotionValue(0);
    const mY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mY, [-0.5, 0.5], [5, -5]), { bounce: 0, damping: 20, stiffness: 100 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { bounce: 0, damping: 20, stiffness: 100 });

    function onMove(e: React.MouseEvent<HTMLDivElement>) {
        const bounds = e.currentTarget.getBoundingClientRect();
        const xPct = (e.clientX - bounds.x) / bounds.width - 0.5;
        const yPct = (e.clientY - bounds.y) / bounds.height - 0.5;
        x.set(xPct);
        mY.set(yPct);
    }

    function onLeave() {
        x.set(0);
        mY.set(0);
    }

    return (
        <motion.div
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className={`relative w-full rounded-2xl border border-white/10 bg-ink-950/50 shadow-2xl transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] ${project.orientation === 'portrait' ? 'max-w-[360px] mx-auto' : ''
                }`}
        >
            <Image
                src={project.image!}
                alt={project.title}
                width={1200}
                height={800}
                className="h-auto w-full rounded-2xl"
                sizes="(max-width: 768px) 100vw, 50vw"
            />

            {/* Gloss Overlay */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl mix-blend-overlay" />
        </motion.div>
    );
};
