'use client';

import { useEffect, useId, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { Project } from '@/data/projects';

// Links a phrase inside the description, leaving the rest as plain text
function Description({ project }: { project: Project }) {
    const { description, descriptionLink } = project;
    const start = descriptionLink ? description.indexOf(descriptionLink.text) : -1;

    if (!descriptionLink || start === -1) return <>{description}</>;

    return (
        <>
            {description.slice(0, start)}
            <a
                href={descriptionLink.href}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer underline underline-offset-4 decoration-white/30 hover:decoration-white/70 transition-colors"
            >
                {descriptionLink.text}
            </a>
            {description.slice(start + descriptionLink.text.length)}
        </>
    );
}

// Row fills the full bubble width — no negative margins needed
function ProjectRow({ project }: { project: Project }) {
    return (
        <div className="w-full px-4 py-3 transition-colors duration-100 hover:bg-white/[0.06]">
            <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-heading italic text-white text-[17px] leading-snug">
                    {project.title}
                </h2>
                {project.links.length > 0 && (
                    <div className="flex gap-3 shrink-0">
                        {project.links.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noreferrer"
                                className="cursor-pointer text-[13px] text-zinc-400 underline underline-offset-2 hover:text-zinc-200 hover:decoration-zinc-200 transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-zinc-300 text-[14px] mt-1 leading-snug">
                <Description project={project} />
            </p>
        </div>
    );
}

interface ProjectsSectionProps {
    projects: Project[];
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
    const listId = useId();

    // Open when: tapped/clicked open (pinned), or — on real hover devices —
    // hovered or keyboard-focused. Gating hover/focus behind canHover keeps a
    // touch tap (which can synthesize a mouseenter/focus) from fighting the
    // pinned toggle, so tap-to-open / tap-to-close stays clean.
    const [pinned, setPinned] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [canHover, setCanHover] = useState(true);

    useEffect(() => {
        const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
        const update = () => setCanHover(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const isOpen = pinned || (canHover && (hovered || focused));

    return (
        <div
            className="flex gap-3 items-end sm:items-start w-full"
            onMouseEnter={canHover ? () => setHovered(true) : undefined}
            onMouseLeave={canHover ? () => setHovered(false) : undefined}
            onFocusCapture={() => setFocused(true)}
            onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
            }}
        >
            {/* Avatar */}
            <div className="shrink-0 w-8 flex justify-center">
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
                    <Image src="/avatar.jpeg" alt="Zidan Kazi" fill className="object-cover" sizes="32px" />
                </div>
            </div>

            {/* Bubble — overflow-hidden here gives rounded corners, rows fill naturally */}
            <div className="bg-[#161618] text-[#d4d4d4] rounded-[20px] rounded-tl-sm text-[14px] leading-[1.6] w-full border border-white/5 shadow-sm overflow-hidden">
                {/* Header — a real button so tap + keyboard work, not just hover */}
                <button
                    type="button"
                    onClick={() => setPinned((p) => !p)}
                    aria-expanded={isOpen}
                    aria-controls={listId}
                    className="w-full text-left px-4 pt-3 pb-3 border-b border-white/10 flex items-center justify-between gap-3"
                >
                    <span>
                        A few things I&apos;ve made.{' '}
                        <span className="text-zinc-500">
                            {canHover ? 'Hover your mouse here to see the list.' : 'Tap to see the list.'}
                        </span>
                    </span>
                    {/* Tap affordance — only where there's no hover to reveal it */}
                    {!canHover && (
                        <motion.span
                            aria-hidden="true"
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
                            className="flex shrink-0 text-zinc-500"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </motion.span>
                    )}
                </button>

                {/* List — no padding, so row hover states sit flush against the divider */}
                <div className="relative" id={listId}>
                    <motion.div
                        animate={{ height: isOpen ? 'auto' : 140 }}
                        transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                        className="overflow-hidden select-none"
                    >
                        {projects.map((project) => (
                            <ProjectRow key={project.title} project={project} />
                        ))}
                    </motion.div>

                    {/* Bottom fade */}
                    <motion.div
                        animate={{ opacity: isOpen ? 0 : 1 }}
                        transition={{ duration: 0.15 }}
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#161618] via-[#161618]/80 to-transparent"
                    />
                </div>
            </div>
        </div>
    );
}
