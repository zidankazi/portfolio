'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { skillCategories, type Skill } from '@/data/skills';

// Simple Icons CDN with white color for dark theme
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
        // OpenAI and Claude icons from jsdelivr npm (confirmed working)
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
        // AWS icon from devicons as fallback
        amazonwebservices: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
        // Azure icon from devicons as fallback
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
        // Playwright icon from devicons as fallback
        playwright: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/playwright/playwright-original.svg',
    };

    return iconMap[icon] || `${SIMPLE_ICONS}/${icon}/white`;
};

const SkillPill = ({ skill }: { skill: Skill }) => {
    const iconUrl = getIconUrl(skill.icon);
    const needsInvert = iconUrl.includes('jsdelivr.net/npm/simple-icons') || iconUrl.includes('devicons');

    return (
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={iconUrl}
                alt={skill.name}
                className={`h-4 w-4 object-contain opacity-80 ${needsInvert ? 'brightness-0 invert' : ''}`}
                loading="lazy"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
            />
            <span className="text-xs text-chrome-300">{skill.name}</span>
        </div>
    );
};

export default function SkillsPage() {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.main
            className="flex flex-col gap-8 pb-20"
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

            <div className="flex flex-col gap-6">
                {skillCategories.map((category, categoryIndex) => (
                    <motion.div
                        key={category.title}
                        className="flex flex-col gap-3"
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
                        <div className="flex flex-wrap gap-2">
                            {category.skills.map((skill) => (
                                <SkillPill key={skill.name} skill={skill} />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.main>
    );
}

