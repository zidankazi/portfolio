'use client';

import { useEffect, useId, useReducer } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import type { Project } from '@/types/project';
import { ProjectHoverPreview } from './ProjectHoverPreview';
import * as projectState from '../../../build/dev/javascript/portfolio/lib/projects_state.mjs';

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
        <div data-project-preview={project.title} className="w-full px-4 py-3 transition-colors duration-100 hover:bg-white/[0.06]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
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
                                className="inline-flex min-h-9 items-center sm:min-h-0 cursor-pointer text-[13px] text-zinc-400 underline underline-offset-2 hover:text-zinc-200 hover:decoration-zinc-200 transition-colors"
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

    const [model, dispatch] = useReducer(projectState.update, undefined, projectState.init);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
        const update = () => dispatch(new projectState.HoverCapabilityChanged(mq.matches));
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const isOpen = projectState.is_open(model);

    return (
        <div
            className="flex gap-2 sm:gap-3 items-start w-full"
            onMouseEnter={() => dispatch(new projectState.MouseEntered())}
            onMouseLeave={() => dispatch(new projectState.MouseLeft())}
            onFocusCapture={() => dispatch(new projectState.FocusEntered())}
            onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) dispatch(new projectState.FocusLeft());
            }}
        >
            {/* Avatar */}
            <div className="shrink-0 w-6 sm:w-8 flex justify-center">
                <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 mt-1">
                    <Image src="/avatar.jpeg" alt="Zidan Kazi" fill className="object-cover" sizes="32px" />
                </div>
            </div>

            {/* Bubble — overflow-hidden here gives rounded corners, rows fill naturally */}
            <div data-puppet-anchor="projects" className="min-w-0 bg-[#161618] text-[#d4d4d4] rounded-[20px] rounded-tl-sm text-[14px] leading-[1.6] w-full border border-white/5 shadow-sm overflow-hidden">
                {/* Header — a real button so tap + keyboard work, not just hover */}
                <button
                    type="button"
                    onClick={() => dispatch(new projectState.TogglePinned())}
                    aria-expanded={isOpen}
                    aria-controls={listId}
                    className="w-full text-left px-4 pt-3 pb-3 border-b border-white/10 flex items-center justify-between gap-3"
                >
                    <span>
                        A few things I&apos;ve made.{' '}
                        {/* Both rendered; CSS shows one by hover capability — no hydration flash */}
                        <span className="hint-hover text-zinc-500">Hover your mouse here to see the list.</span>
                        <span className="hint-tap text-zinc-500">{isOpen ? 'Tap to collapse.' : 'Tap to explore.'}</span>
                    </span>
                    {/* Tap affordance — CSS reveals it only where there's no hover */}
                    <motion.span
                        aria-hidden="true"
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
                        className="tap-chevron shrink-0 text-zinc-500"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.span>
                </button>

                {/* List — no padding, so row hover states sit flush against the divider */}
                <div className="relative" id={listId}>
                    <motion.div
                        animate={{ height: isOpen ? 'auto' : 140 }}
                        transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                        className="overflow-hidden select-none"
                    >
                        <ProjectHoverPreview projects={projects}>
                            {projects.map((project) => (
                                <ProjectRow key={project.title} project={project} />
                            ))}
                        </ProjectHoverPreview>
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
