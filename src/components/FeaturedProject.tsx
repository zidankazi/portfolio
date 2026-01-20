'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import type { Project } from '@/data/projects';

export const FeaturedProject = ({ project, index }: { project: Project; index: number }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);
    const isEven = index % 2 === 0;

    const contentVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 60, damping: 20 } },
    };

    return (
        <motion.div
            ref={containerRef}
            style={{ opacity }}
            className={`flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-24 ${isEven ? '' : 'lg:flex-row-reverse'
                }`}
        >
            {/* Content Side */}
            <motion.div
                className="flex flex-1 flex-col gap-6 lg:py-12"
                variants={contentVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-10%' }}
            >
                <motion.div className="flex flex-col gap-2" variants={itemVariants}>
                    <div className="flex items-center gap-3">
                        <h3 className="font-heading text-4xl text-ink-100 lg:text-5xl">{project.title}</h3>
                        {project.links.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-widest text-chrome-400 transition hover:bg-white/10 hover:text-ink-100"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                    <p className="text-xl text-chrome-300">{project.description}</p>
                    {project.notice && (
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
                            {project.notice}
                        </p>
                    )}
                </motion.div>

                <motion.ul className="space-y-4" variants={itemVariants}>
                    {project.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-4 text-base text-ink-200">
                            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            <span className="leading-relaxed">{bullet}</span>
                        </li>
                    ))}
                </motion.ul>

                <motion.div className="flex flex-wrap gap-2 text-xs tracking-widest text-chrome-500 opacity-60" variants={itemVariants}>
                    {project.tags.map((tag) => (
                        <span key={tag} className="border-r border-white/10 pr-2 last:border-0 last:pr-0">
                            {tag}
                        </span>
                    ))}
                </motion.div>
            </motion.div>

            {/* Image Side */}
            <motion.div
                className={`relative flex flow-row justify-center flex-1 ${project.orientation === 'portrait' ? 'lg:justify-center' : ''}`}
                style={{ perspective: 1000 }}
            >
                {project.image && (
                    <ProjectImage project={project} y={y} />
                )}
            </motion.div>
        </motion.div>
    );
};

/* Separated Image Component for Clean State Management */
const ProjectImage = ({ project, y }: { project: Project; y: any }) => {
    const x = useMotionValue(0);
    const mY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mY, [-0.5, 0.5], [7, -7]), { bounce: 0, damping: 20, stiffness: 100 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), { bounce: 0, damping: 20, stiffness: 100 });

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
            style={{ y, rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className={`relative w-full rounded-2xl border border-white/10 bg-ink-950 shadow-2xl transition-shadow duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] ${project.orientation === 'portrait' ? 'max-w-[320px] mx-auto' : ''
                }`}
        >
            {/* Ambient Glow */}
            <div className="absolute -inset-4 -z-10 rounded-[32px] bg-indigo-500/20 blur-3xl opacity-20" />

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

            {/* Dynamic Sheen */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ mixBlendMode: 'overlay' }}
            />
        </motion.div>
    );
};
