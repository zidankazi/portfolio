'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Project } from '@/data/projects';

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
                                className="text-[13px] text-zinc-400 underline underline-offset-2 hover:text-zinc-200 transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-zinc-300 text-[14px] mt-1 leading-snug">
                {project.description}
            </p>
        </div>
    );
}

interface ProjectsSectionProps {
    projects: Project[];
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="flex gap-3 items-end sm:items-start w-full"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {/* Avatar */}
            <div className="shrink-0 w-8 flex justify-center">
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
                    <Image src="/avatar.jpeg" alt="Zidan Kazi" fill className="object-cover" sizes="32px" />
                </div>
            </div>

            {/* Bubble — overflow-hidden here gives rounded corners, rows fill naturally */}
            <div className="bg-[#161618] text-[#d4d4d4] rounded-[20px] rounded-tl-sm text-[14px] leading-[1.6] w-full border border-white/5 shadow-sm overflow-hidden">
                {/* Header — padded */}
                <div className="px-4 pt-3 pb-3 border-b border-white/10">
                    <p>
                        I build things every now and then, often exploring new architectures or scratching my own itch.{' '}
                        <span className="text-zinc-500">Hover your mouse here to see the list.</span>
                    </p>
                </div>

                {/* List — no padding, rows own their own px-4 */}
                <div className="relative pt-1 pb-1">
                    <motion.div
                        animate={{ height: isOpen ? 'auto' : 96 }}
                        transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        {projects.map((project) => (
                            <ProjectRow key={project.title} project={project} />
                        ))}
                    </motion.div>

                    {/* Bottom fade */}
                    <motion.div
                        animate={{ opacity: isOpen ? 0 : 1 }}
                        transition={{ duration: 0.15 }}
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#161618] via-[#161618]/80 to-transparent"
                    />
                </div>
            </div>
        </div>
    );
}
