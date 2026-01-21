'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MouseEvent, useEffect, useState } from 'react';
import type { Skill } from '@/data/skills';

// --- Icon & Color Logic ---
const SIMPLE_ICONS = 'https://cdn.simpleicons.org';

const getBrandColor = (icon: string): string => {
    const colorMap: Record<string, string> = {
        python: '#3776AB',
        typescript: '#3178C6',
        javascript: '#F7DF1E',
        react: '#61DAFB',
        nextjs: '#ffffff',
        nodejs: '#339933',
        swift: '#F05138',
        openai: '#74AA9C',
        anthropic: '#D97757',
        gemini: '#8E75B2',
        postgresql: '#4169E1',
        aws: '#FF9900',
        docker: '#2496ED',
        tailwind: '#06B6D4',
        figma: '#F24E1E',
        framer: '#0055FF',
        git: '#F05032',
        github: '#ffffff',
        supabase: '#3ECF8E',
        firebase: '#FFCA28',
        redis: '#DC382D',
        cplusplus: '#00599C',
        java: '#007396',
        kotlin: '#7F52FF',
        electron: '#47848F',
        flask: '#ffffff',
        fastapi: '#009688',
        graphql: '#E10098',
        vercel: '#ffffff',
    };
    return colorMap[icon] || '#ffffff';
};

const getIconUrl = (icon: string): string => {
    const iconMap: Record<string, string> = {
        python: `${SIMPLE_ICONS}/python`,
        typescript: `${SIMPLE_ICONS}/typescript`,
        javascript: `${SIMPLE_ICONS}/javascript`,
        java: `${SIMPLE_ICONS}/openjdk`,
        swift: `${SIMPLE_ICONS}/swift`,
        c: `${SIMPLE_ICONS}/c`,
        cplusplus: `${SIMPLE_ICONS}/cplusplus`,
        objectivec: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/objectivec/objectivec-plain.svg',
        arm: `${SIMPLE_ICONS}/arm`,
        html5: `${SIMPLE_ICONS}/html5`,
        css3: `${SIMPLE_ICONS}/css`,
        mysql: `${SIMPLE_ICONS}/mysql`,
        gnubash: `${SIMPLE_ICONS}/gnubash`,
        openai: 'https://cdn.jsdelivr.net/npm/simple-icons@14.2.0/icons/openai.svg',
        anthropic: 'https://cdn.jsdelivr.net/npm/simple-icons@14.2.0/icons/claude.svg',
        gemini: `${SIMPLE_ICONS}/googlegemini`,
        react: `${SIMPLE_ICONS}/react`,
        nextjs: `${SIMPLE_ICONS}/nextdotjs`,
        nodejs: `${SIMPLE_ICONS}/nodedotjs`,
        electron: `${SIMPLE_ICONS}/electron`,
        apple: `${SIMPLE_ICONS}/apple`,
        macos: `${SIMPLE_ICONS}/apple`,
        x: `${SIMPLE_ICONS}/x`,
        flask: `${SIMPLE_ICONS}/flask`,
        fastapi: `${SIMPLE_ICONS}/fastapi`,
        express: `${SIMPLE_ICONS}/express`,
        postgresql: `${SIMPLE_ICONS}/postgresql`,
        sqlite: `${SIMPLE_ICONS}/sqlite`,
        mongodb: `${SIMPLE_ICONS}/mongodb`,
        redis: `${SIMPLE_ICONS}/redis`,
        supabase: `${SIMPLE_ICONS}/supabase`,
        firebase: `${SIMPLE_ICONS}/firebase`,
        prisma: `${SIMPLE_ICONS}/prisma`,
        graphql: `${SIMPLE_ICONS}/graphql`,
        git: `${SIMPLE_ICONS}/git`,
        github: `${SIMPLE_ICONS}/github`,
        githubactions: `${SIMPLE_ICONS}/githubactions`,
        docker: `${SIMPLE_ICONS}/docker`,
        amazonwebservices: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
        azure: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg',
        vercel: `${SIMPLE_ICONS}/vercel`,
        netlify: `${SIMPLE_ICONS}/netlify`,
        tailwindcss: `${SIMPLE_ICONS}/tailwindcss`,
        redux: `${SIMPLE_ICONS}/redux`,
        framer: `${SIMPLE_ICONS}/framer`,
        langchain: `${SIMPLE_ICONS}/langchain`,
        huggingface: `${SIMPLE_ICONS}/huggingface`,
        pytorch: `${SIMPLE_ICONS}/pytorch`,
        figma: `${SIMPLE_ICONS}/figma`,
        jest: `${SIMPLE_ICONS}/jest`,
        pytest: `${SIMPLE_ICONS}/pytest`,
        playwright: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/playwright/playwright-original.svg',
    };
    return iconMap[icon] || `${SIMPLE_ICONS}/${icon}`;
};

export const SpotlightSkill = ({ skill, index }: { skill: Skill, index: number }) => {
    // Spotlight State
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Tilt State
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 200, damping: 20 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 200, damping: 20 });

    // Float State
    const [floatDuration, setFloatDuration] = useState(4);
    const [floatDelay, setFloatDelay] = useState(0);

    useEffect(() => {
        setFloatDuration(Math.random() * 3 + 4);
        setFloatDelay(Math.random() * 2 + 1.5);
    }, []);

    const handleMouseMove = ({ currentTarget, clientX, clientY }: MouseEvent) => {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
        x.set((clientX - left) / width - 0.5);
        y.set((clientY - top) / height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const brandColor = getBrandColor(skill.icon);
    const iconUrl = getIconUrl(skill.icon);

    // Structure:
    // 1. Entrance Wrapper (Controlled by Parent Stagger)
    // 2. Float Wrapper (Continuous Bobbing)
    // 3. Card Shell (Tilt, Border, Background, Content)

    return (
        <motion.div
            // 1. Entrance Wrapper
            variants={{
                hidden: {
                    opacity: 0,
                    scale: 0.8,
                    filter: 'blur(10px)',
                    y: 20,
                    rotateX: 0,
                    rotateY: 0
                },
                visible: {
                    opacity: 1,
                    scale: 1,
                    filter: 'blur(0px)',
                    y: 0,
                    rotateX: 0,
                    rotateY: 0,
                    transition: {
                        type: 'spring',
                        bounce: 0.4,
                        duration: 0.8
                    }
                }
            }}
            className="relative h-32 w-full"
        >
            <motion.div
                // 2. Float Wrapper
                animate={{ y: [0, -10, 0] }}
                transition={{
                    duration: floatDuration,
                    repeat: Infinity,
                    delay: floatDelay,
                    ease: "easeInOut",
                }}
                className="h-full w-full"
            >
                <motion.div
                    // 3. Card Shell (Tilt + Content)
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        perspective: 1000,
                        rotateX,
                        rotateY,
                    }}
                    className="group relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-colors hover:border-white/20"
                >
                    {/* Ambient "Breathing" Background (Center Gradient) */}
                    <motion.div
                        className="absolute inset-0 opacity-0"
                        animate={{ opacity: [0, 0.4, 0] }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: floatDelay,
                            ease: "easeInOut"
                        }}
                        style={{
                            background: `radial-gradient(circle at center, ${brandColor}40 0%, transparent 70%)`
                        }}
                    />

                    {/* Spotlight (Mouse Tracking) */}
                    <motion.div
                        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{
                            background: useMotionTemplate`
                                radial-gradient(
                                    250px circle at ${mouseX}px ${mouseY}px,
                                    ${brandColor}20,
                                    transparent 80%
                                )
                            `,
                        }}
                    />

                    {/* Border Spotlight */}
                    <motion.div
                        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{
                            background: useMotionTemplate`
                                radial-gradient(
                                    200px circle at ${mouseX}px ${mouseY}px,
                                    ${brandColor}50,
                                    transparent 80%
                                )
                            `,
                            maskImage: `radial-gradient(200px circle at ${mouseX}px ${mouseY}px, black, black)`,
                            WebkitMaskImage: `radial-gradient(200px circle at ${mouseX}px ${mouseY}px, black, black)`,
                        }}
                    />

                    {/* Icon */}
                    <div className="relative z-10 h-10 w-10 transition-transform duration-500 group-hover:scale-110" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={iconUrl}
                            alt={skill.name}
                            className="h-full w-full object-contain transition-all duration-300 group-hover:filter-none opacity-70 brightness-0 invert group-hover:opacity-100"
                        />
                    </div>

                    <span className="relative z-10 text-xs font-medium tracking-wider text-chrome-400 transition-colors group-hover:text-ink-100" style={{ transform: 'translateZ(10px)' }}>
                        {skill.name}
                    </span>

                </motion.div>
            </motion.div>
        </motion.div>
    );
};
