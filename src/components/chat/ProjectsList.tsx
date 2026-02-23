'use client';

import { useState } from 'react';
import { Project } from '@/data/projects';

interface ProjectsListProps {
    projects: Project[];
}

export function ProjectsList({ projects }: ProjectsListProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-[#A0A0A0] hover:text-white transition-colors text-[14px] flex items-center gap-1.5 mt-2 ml-1 cursor-pointer"
            >
                {isOpen ? "Hide projects" : "Hover your mouse here to see the list."}
            </button>

            {isOpen && (
                <div className="mt-3 border-t border-white/10 pt-3 flex flex-col gap-0">
                    {projects.map((project) => (
                        <div
                            key={project.title}
                            className="py-2.5 border-b border-white/5 last:border-0"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <span className="font-heading italic text-white text-[15px]">
                                        {project.title}
                                    </span>
                                    <p className="text-zinc-500 text-[13px] mt-0.5 leading-snug">
                                        {project.description}
                                    </p>
                                </div>
                                {project.links.length > 0 && (
                                    <div className="flex gap-2 shrink-0 mt-0.5">
                                        {project.links.map((link) => (
                                            <a
                                                key={link.label}
                                                href={link.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors underline underline-offset-2"
                                            >
                                                {link.label}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
