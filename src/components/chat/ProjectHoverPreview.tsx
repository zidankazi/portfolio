'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, useSpring } from 'framer-motion';
import type { Project } from '@/data/projects';

const WIDTH = 280;
const HEIGHT = 210;
const GAP = 20;
const INSET = 16;
const HOVER_DELAY = 240;
const PREVIEW_QUERY = '(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

export function ProjectHoverPreview({ projects, children }: { projects: Project[]; children: ReactNode }) {
    const [enabled, setEnabled] = useState(false);
    const [warmed, setWarmed] = useState(false);
    const [active, setActive] = useState<string | null>(null);
    const [loaded, setLoaded] = useState<Record<string, boolean>>({});
    const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hovered = useRef<string | null>(null);
    const visible = useRef(false);
    const x = useSpring(0, { stiffness: 450, damping: 40, mass: 0.6 });
    const y = useSpring(0, { stiffness: 450, damping: 40, mass: 0.6 });

    const dismiss = useCallback(() => {
        if (pending.current) clearTimeout(pending.current);
        pending.current = null;
        hovered.current = null;
        visible.current = false;
        setActive(null);
    }, []);

    useEffect(() => {
        const media = window.matchMedia(PREVIEW_QUERY);
        const update = () => {
            setEnabled(media.matches);
            dismiss();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' || event.key === 'Tab') dismiss();
        };
        update();
        media.addEventListener('change', update);
        window.addEventListener('scroll', dismiss, true);
        window.addEventListener('resize', dismiss);
        window.addEventListener('blur', dismiss);
        window.addEventListener('keydown', onKeyDown);
        return () => {
            media.removeEventListener('change', update);
            window.removeEventListener('scroll', dismiss, true);
            window.removeEventListener('resize', dismiss);
            window.removeEventListener('blur', dismiss);
            window.removeEventListener('keydown', onKeyDown);
            if (pending.current) clearTimeout(pending.current);
        };
    }, [dismiss]);

    function move(event: PointerEvent<HTMLDivElement>) {
        if (!enabled || event.pointerType !== 'mouse') return;
        const row = (event.target as HTMLElement).closest<HTMLElement>('[data-project-preview]');
        const title = row?.dataset.projectPreview;
        if (!row || !title || !projects.some((project) => project.title === title && project.preview)) {
            dismiss();
            return;
        }

        const rect = row.getBoundingClientRect();
        // Use the page margin when it fits. On smaller desktops, flip away
        // from the pointer and clamp to the viewport so links stay reachable.
        let left = event.clientX + GAP;
        if (rect.right + GAP + WIDTH <= window.innerWidth - INSET) {
            left = rect.right + GAP + (event.clientX - rect.left) * 0.025;
        } else if (rect.left - GAP - WIDTH >= INSET) {
            left = rect.left - GAP - WIDTH;
        } else if (left + WIDTH > window.innerWidth - INSET) {
            left = event.clientX - WIDTH - GAP;
        }
        left = Math.max(INSET, Math.min(left, window.innerWidth - WIDTH - INSET));
        const top = Math.max(INSET, Math.min(event.clientY - HEIGHT / 2, window.innerHeight - HEIGHT - INSET));

        if (!visible.current) {
            x.jump(left);
            y.jump(top);
        } else {
            x.set(left);
            y.set(top);
        }
        if (hovered.current === title) return;
        hovered.current = title;
        setWarmed(true);
        if (pending.current) clearTimeout(pending.current);

        if (visible.current) {
            setActive(title);
        } else {
            pending.current = setTimeout(() => {
                pending.current = null;
                visible.current = true;
                setActive(title);
            }, HOVER_DELAY);
        }
    }

    const show = active !== null && loaded[active] === true;

    return (
        <div onPointerMove={move} onPointerLeave={dismiss} onPointerCancel={dismiss}>
            {children}
            {enabled && warmed && createPortal(
                <motion.div
                    aria-hidden="true"
                    data-project-hover-preview=""
                    data-active-project={show ? active : undefined}
                    className="project-hover-preview pointer-events-none fixed left-0 top-0 z-50"
                    style={{ x, y, width: WIDTH, height: HEIGHT }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.97 }}
                        transition={{ duration: show ? 0.18 : 0.12, ease: [0.23, 1, 0.32, 1] }}
                        className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#101012] shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
                    >
                        {projects.filter((project) => project.preview).map((project) => (
                            <motion.div
                                key={project.title}
                                className="absolute inset-0"
                                initial={false}
                                animate={{ opacity: active === project.title ? 1 : 0 }}
                                transition={{ duration: 0.16 }}
                            >
                                <Image
                                    src={project.preview!}
                                    alt=""
                                    fill
                                    sizes="280px"
                                    loading="eager"
                                    className="object-contain"
                                    onLoad={() => setLoaded((current) => ({ ...current, [project.title]: true }))}
                                    onError={() => setLoaded((current) => ({ ...current, [project.title]: false }))}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>,
                document.body,
            )}
        </div>
    );
}
