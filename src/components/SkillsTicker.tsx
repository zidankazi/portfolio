'use client';

import React, { useRef, useState, useEffect } from 'react';
import { skillsRow1, skillsRow2, type Skill } from '@/data/skills';

// Simple Icons CDN with white color for dark theme
const SIMPLE_ICONS = 'https://cdn.simpleicons.org';

const getIconUrl = (icon: string): string => {
    // Map skill icons to Simple Icons slugs (all served as white SVGs)
    const iconMap: Record<string, string> = {
        python: `${SIMPLE_ICONS}/python/white`,
        typescript: `${SIMPLE_ICONS}/typescript/white`,
        javascript: `${SIMPLE_ICONS}/javascript/white`,
        java: `${SIMPLE_ICONS}/openjdk/white`,
        swift: `${SIMPLE_ICONS}/swift/white`,
        c: `${SIMPLE_ICONS}/c/white`,
        html5: `${SIMPLE_ICONS}/html5/white`,
        css3: `${SIMPLE_ICONS}/css/white`,
        mysql: `${SIMPLE_ICONS}/mysql/white`,
        // OpenAI and Claude icons from jsdelivr npm (confirmed working)
        openai: 'https://cdn.jsdelivr.net/npm/simple-icons@14.2.0/icons/openai.svg',
        anthropic: 'https://cdn.jsdelivr.net/npm/simple-icons@14.2.0/icons/claude.svg',
        gemini: `${SIMPLE_ICONS}/googlegemini/white`,
        react: `${SIMPLE_ICONS}/react/white`,
        nextjs: `${SIMPLE_ICONS}/nextdotjs/white`,
        nodejs: `${SIMPLE_ICONS}/nodedotjs/white`,
        electron: `${SIMPLE_ICONS}/electron/white`,
        apple: `${SIMPLE_ICONS}/apple/white`,
        x: `${SIMPLE_ICONS}/x/white`,
        flask: `${SIMPLE_ICONS}/flask/white`,
        fastapi: `${SIMPLE_ICONS}/fastapi/white`,
        postgresql: `${SIMPLE_ICONS}/postgresql/white`,
        sqlite: `${SIMPLE_ICONS}/sqlite/white`,
        prisma: `${SIMPLE_ICONS}/prisma/white`,
        git: `${SIMPLE_ICONS}/git/white`,
        docker: `${SIMPLE_ICONS}/docker/white`,
        // AWS icon from devicons as fallback
        amazonwebservices: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
        // Azure icon from devicons as fallback  
        azure: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg',
        vercel: `${SIMPLE_ICONS}/vercel/white`,
        tailwindcss: `${SIMPLE_ICONS}/tailwindcss/white`,
        figma: `${SIMPLE_ICONS}/figma/white`,
    };

    return iconMap[icon] || `${SIMPLE_ICONS}/${icon}/white`;
};

const SkillPill = ({ skill }: { skill: Skill }) => {
    const iconUrl = getIconUrl(skill.icon);
    const needsInvert = iconUrl.includes('jsdelivr.net/npm/simple-icons') || iconUrl.includes('devicons'); // These SVGs need inversion for dark theme

    return (
        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] sm:gap-2.5 sm:px-4 sm:py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={iconUrl}
                alt={skill.name}
                className={`h-3.5 w-3.5 flex-shrink-0 object-contain opacity-80 sm:h-5 sm:w-5 ${needsInvert ? 'brightness-0 invert' : ''}`}
                loading="lazy"
                onError={(e) => {
                    // Hide broken images gracefully
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
            />
            <span className="text-[10px] tracking-wider text-chrome-400 whitespace-nowrap sm:text-xs">
                {skill.name}
            </span>
        </div>
    );
};

const TickerRow = ({
    skills,
    direction = 'left',
}: {
    skills: Skill[];
    direction?: 'left' | 'right';
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [setWidth, setSetWidth] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const measure = () => {
            if (containerRef.current) {
                const firstSet = containerRef.current.querySelector('[data-set="first"]');
                if (firstSet) {
                    // Add width of gap spacer (8px mobile, 12px desktop)
                    const gapWidth = window.innerWidth < 640 ? 8 : 12;
                    setSetWidth(firstSet.scrollWidth + gapWidth);
                }
            }
            setIsMobile(window.innerWidth < 640);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [skills]);

    return (
        <div className="ticker-row group relative overflow-hidden">
            {/* Fade edges */}
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-ink-800 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-ink-800 to-transparent" />

            <div
                ref={containerRef}
                className="flex group-hover:[animation-play-state:paused]"
                style={{
                    animation: setWidth > 0
                        ? `ticker-${direction} var(--ticker-duration) linear infinite`
                        : 'none',
                    ['--ticker-distance' as string]: `-${setWidth}px`,
                    ['--ticker-duration' as string]: isMobile ? '12s' : '20s',
                } as React.CSSProperties}
            >
                {/* First set */}
                <div data-set="first" className="flex shrink-0 gap-2 sm:gap-3">
                    {skills.map((skill, index) => (
                        <SkillPill key={`a-${skill.name}-${index}`} skill={skill} />
                    ))}
                </div>
                {/* Gap between sets */}
                <div className="w-2 shrink-0 sm:w-3" />
                {/* Second set (duplicate for seamless loop) */}
                <div data-set="second" className="flex shrink-0 gap-2 sm:gap-3">
                    {skills.map((skill, index) => (
                        <SkillPill key={`b-${skill.name}-${index}`} skill={skill} />
                    ))}
                </div>
                {/* Gap after second set */}
                <div className="w-2 shrink-0 sm:w-3" />
            </div>
        </div>
    );
};

export const SkillsTicker = () => {
    return (
        <div className="flex flex-col gap-4">
            <TickerRow skills={skillsRow1} direction="left" />
            <TickerRow skills={skillsRow2} direction="right" />
        </div>
    );
};

