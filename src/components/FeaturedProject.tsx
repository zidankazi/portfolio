'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring, MotionValue } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import type { Project } from '@/data/projects';

export const FeaturedProject = ({ project, index }: { project: Project; index: number }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isEven = index % 2 === 0;

    return (
        <div
            ref={containerRef}
            className={`relative flex flex-col gap-8 rounded-[40px] px-4 py-8 lg:flex-row lg:items-center lg:gap-24 lg:p-16 ${isEven ? '' : 'lg:flex-row-reverse'
                }`}
        >
            {/* Content Side */}
            <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        {/* Title - Stays Gradient */}
                        <h3
                            className={`font-heading text-5xl font-bold lg:text-7xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${project.colors || 'from-white to-gray-400'}`}
                            style={{ paddingBottom: '0.1em' }}
                        >
                            {project.title}
                        </h3>

                        <div className="flex gap-2">
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
                        </div>
                    </div>

                    {/* Main Description */}
                    <ReadingText
                        text={project.description}
                        highlightColor={project.highlightColor || '#ffffff'}
                    />
                </div>

                <ul className="space-y-3">
                    {project.bullets.map((bullet, i) => (
                        <li key={bullet} className="flex items-start gap-3 text-base font-light text-chrome-200 lg:text-lg">
                            <span className={`mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r ${project.colors} opacity-80`} />
                            {/* Bullets finish even faster */}
                            <ReadingText
                                text={bullet}
                                highlightColor={project.highlightColor || '#ffffff'}
                                offset={0} // Removed offset delay so they read immediately
                            />
                        </li>
                    ))}
                </ul>

                <div className="flex flex-wrap gap-3 pt-2">
                    {project.tags.map((tag) => (
                        <span key={tag} className="text-xs font-bold uppercase tracking-[0.2em] text-chrome-400/60">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Image Side - 3D Tilt */}
            <div className={`relative flex flow-row justify-center flex-1 ${project.orientation === 'portrait' ? 'lg:justify-center' : ''}`} style={{ perspective: 1000 }}>
                {project.image && (
                    <ProjectImage project={project} />
                )}
            </div>
        </div>
    );
};

/* 
  ReadingText Component - "The Snake" 🐍 (Ultra-Fast)
  - Animation Range: 0.5 (Ends halfway through viewport)
  - Offset: ['start 1'] (Starts immediately upon entering viewport)
*/
const ReadingText = ({ text, highlightColor, offset = 0 }: { text: string, highlightColor: string, offset?: number }) => {
    const elementRef = useRef<HTMLParagraphElement>(null);
    const { scrollYProgress } = useScroll({
        target: elementRef,
        offset: ['start 1', 'start 0.5'], // Start when entering bottom, 100% done by center
    });

    const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });

    const words = text.split(' ');

    return (
        <p ref={elementRef} className="text-xl leading-relaxed lg:text-2xl flex flex-wrap gap-x-[0.25em]">
            {words.map((word, i) => {
                return (
                    <span key={i} className="whitespace-nowrap">
                        {word.split('').map((char, charIndex) => {
                            const globalIndex = i + (charIndex / word.length);
                            // Compress spread to 0.5. 
                            // This creates a huge buffer: even if scroll is at 0.6, 0.7, 0.8... text is fully white.
                            const start = (globalIndex / words.length) * 0.5;
                            const end = start + 0.2;

                            return (
                                <Char
                                    key={charIndex}
                                    char={char}
                                    range={[start, end]}
                                    progress={smoothProgress}
                                    highlightColor={highlightColor}
                                />
                            );
                        })}
                    </span>
                );
            })}
        </p>
    );
};

const Char = ({ char, range, progress, highlightColor }: { char: string, range: [number, number], progress: MotionValue<number>, highlightColor: string }) => {
    const opacity = useTransform(progress, [range[0], range[1]], [0.2, 1]);
    const color = useTransform(progress,
        [range[0], range[0] + 0.05, range[0] + 0.15, range[1]],
        ['#525252', highlightColor, highlightColor, '#ffffff']
    );

    return (
        <motion.span style={{ opacity, color }}>
            {char}
        </motion.span>
    );
};

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
