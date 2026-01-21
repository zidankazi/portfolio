'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { Skill } from '@/data/skills';

// Duplicate of the icon logic from skills page to keep it self-contained or importable
// ideally we should export this from a utility file, but for now copying is safer 
// to avoid breaking the existing page while we build this.
const SIMPLE_ICONS = 'https://cdn.simpleicons.org';

const getIconUrl = (icon: string): string => {
    const iconMap: Record<string, string> = {
        python: `${SIMPLE_ICONS}/python/white`,
        typescript: `${SIMPLE_ICONS}/typescript/white`,
        javascript: `${SIMPLE_ICONS}/javascript/white`,
        java: `${SIMPLE_ICONS}/openjdk/white`,
        swift: `${SIMPLE_ICONS}/swift/white`,
        c: `${SIMPLE_ICONS}/c/white`,
        cplusplus: `${SIMPLE_ICONS}/cplusplus/white`,
        objectivec: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/objectivec/objectivec-plain.svg',
        arm: `${SIMPLE_ICONS}/arm/white`,
        html5: `${SIMPLE_ICONS}/html5/white`,
        css3: `${SIMPLE_ICONS}/css/white`,
        mysql: `${SIMPLE_ICONS}/mysql/white`,
        gnubash: `${SIMPLE_ICONS}/gnubash/white`,
        openai: 'https://cdn.jsdelivr.net/npm/simple-icons@14.2.0/icons/openai.svg',
        anthropic: 'https://cdn.jsdelivr.net/npm/simple-icons@14.2.0/icons/claude.svg',
        gemini: `${SIMPLE_ICONS}/googlegemini/white`,
        react: `${SIMPLE_ICONS}/react/white`,
        nextjs: `${SIMPLE_ICONS}/nextdotjs/white`,
        nodejs: `${SIMPLE_ICONS}/nodedotjs/white`,
        electron: `${SIMPLE_ICONS}/electron/white`,
        apple: `${SIMPLE_ICONS}/apple/white`,
        macos: `${SIMPLE_ICONS}/apple/white`,
        x: `${SIMPLE_ICONS}/x/white`,
        flask: `${SIMPLE_ICONS}/flask/white`,
        fastapi: `${SIMPLE_ICONS}/fastapi/white`,
        express: `${SIMPLE_ICONS}/express/white`,
        postgresql: `${SIMPLE_ICONS}/postgresql/white`,
        sqlite: `${SIMPLE_ICONS}/sqlite/white`,
        mongodb: `${SIMPLE_ICONS}/mongodb/white`,
        redis: `${SIMPLE_ICONS}/redis/white`,
        supabase: `${SIMPLE_ICONS}/supabase/white`,
        firebase: `${SIMPLE_ICONS}/firebase/white`,
        prisma: `${SIMPLE_ICONS}/prisma/white`,
        graphql: `${SIMPLE_ICONS}/graphql/white`,
        git: `${SIMPLE_ICONS}/git/white`,
        github: `${SIMPLE_ICONS}/github/white`,
        githubactions: `${SIMPLE_ICONS}/githubactions/white`,
        docker: `${SIMPLE_ICONS}/docker/white`,
        amazonwebservices: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
        azure: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg',
        vercel: `${SIMPLE_ICONS}/vercel/white`,
        netlify: `${SIMPLE_ICONS}/netlify/white`,
        tailwindcss: `${SIMPLE_ICONS}/tailwindcss/white`,
        redux: `${SIMPLE_ICONS}/redux/white`,
        framer: `${SIMPLE_ICONS}/framer/white`,
        langchain: `${SIMPLE_ICONS}/langchain/white`,
        huggingface: `${SIMPLE_ICONS}/huggingface/white`,
        pytorch: `${SIMPLE_ICONS}/pytorch/white`,
        figma: `${SIMPLE_ICONS}/figma/white`,
        jest: `${SIMPLE_ICONS}/jest/white`,
        pytest: `${SIMPLE_ICONS}/pytest/white`,
        playwright: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/playwright/playwright-original.svg',
    };

    return iconMap[icon] || `${SIMPLE_ICONS}/${icon}/white`;
};

export const MagneticSkill = ({ skill }: { skill: Skill }) => {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Spring physics for the magnetic effect
    // stiffness = tension (higher = snappier)
    // damping = friction (higher = less oscillation)
    const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
    const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const distanceX = e.clientX - centerX;
            const distanceY = e.clientY - centerY;

            // Calculate the pull strength (closer = stronger)
            // Limit the movement range
            x.set(distanceX * 0.4);
            y.set(distanceY * 0.4);
        }
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const iconUrl = getIconUrl(skill.icon);
    const needsInvert = iconUrl.includes('jsdelivr.net/npm/simple-icons') || iconUrl.includes('devicons');

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            className="group relative flex cursor-default flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
        >
            <div className="relative h-10 w-10 transition-transform duration-300 group-hover:scale-110">
                {/* Glow effect behind icon */}
                <div className="absolute inset-0 -z-10 rounded-full bg-white/10 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={iconUrl}
                    alt={skill.name}
                    className={`h-full w-full object-contain opacity-70 transition-all duration-300 group-hover:opacity-100 ${needsInvert ? 'brightness-0 invert' : 'brightness-0 invert'
                        }`}
                />
            </div>
            <span className="text-xs font-medium tracking-wider text-chrome-400 transition-colors group-hover:text-ink-100">
                {skill.name}
            </span>
        </motion.div>
    );
};
