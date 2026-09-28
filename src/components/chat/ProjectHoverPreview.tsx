'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, useSpring } from 'framer-motion';
import type { Project } from '@/types/project';
import * as previewPosition from '../../../build/dev/javascript/portfolio/lib/preview_position.mjs';

const HOVER_DELAY = 240;
const PREVIEW_QUERY = '(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

// Only mount moving media for the hovered row. The still underneath remains
// visible while it loads, or if playback fails.
function ProjectMotionPreview({ media }: { media: NonNullable<Project['previewMotion']> }) {
    const [ready, setReady] = useState(false);
    const className = 'absolute inset-0 h-full w-full bg-[#101012] object-contain transition-opacity duration-150';

    if (media.type === 'video') {
        return (
            <video
                src={media.src}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className={className}
                style={{ opacity: ready ? 1 : 0 }}
                onPlaying={() => setReady(true)}
                onError={() => setReady(false)}
            />
        );
    }

    return (
        <Image
            src={media.src}
            alt=""
            fill
            unoptimized
            loading="eager"
            className={className}
            style={{ opacity: ready ? 1 : 0 }}
            onLoad={() => setReady(true)}
            onError={() => setReady(false)}
        />
    );
}

export function ProjectHoverPreview({ projects, children }: { projects: Project[]; children: ReactNode }) {
    const [enabled, setEnabled] = useState(false);
    const [warmed, setWarmed] = useState(false);
    const [active, setActive] = useState<string | null>(null);
    const [displayed, setDisplayed] = useState<string | null>(null);
    const [size, setSize] = useState<{ width: number; height: number }>(previewPosition.default_size);
    const [loaded, setLoaded] = useState<Record<string, boolean>>({});
    const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hovered = useRef<string | null>(null);
    const visible = useRef(false);
    const container = useRef<HTMLDivElement>(null);
    const pointer = useRef<{ x: number; y: number } | null>(null);
    const pointerFrame = useRef<number | null>(null);
    const pointerTarget = useRef<Element | null>(null);
    const rowBounds = useRef<{ row: HTMLElement; left: number; right: number } | null>(null);
    const x = useSpring(0, { stiffness: 450, damping: 40, mass: 0.6 });
    const y = useSpring(0, { stiffness: 450, damping: 40, mass: 0.6 });

    const dismiss = useCallback(() => {
        if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
        pointerFrame.current = null;
        pointerTarget.current = null;
        rowBounds.current = null;
        if (pending.current) clearTimeout(pending.current);
        pending.current = null;
        hovered.current = null;
        visible.current = false;
        pointer.current = null;
        setActive(null);
    }, []);

    const updatePreview = useCallback((target: Element | null, clientX: number, clientY: number) => {
        const row = target?.closest<HTMLElement>('[data-project-preview]');
        const title = row?.dataset.projectPreview;
        const project = projects.find((project) => project.title === title);
        if (!row || !container.current?.contains(row) || !title || !project?.preview) {
            dismiss();
            return;
        }

        const preferredSize = project.previewSize ?? previewPosition.default_size;
        if (rowBounds.current?.row !== row) {
            const rect = row.getBoundingClientRect();
            rowBounds.current = { row, left: rect.left, right: rect.right };
        }
        const rect = rowBounds.current;
        const { left, top, width, height } = previewPosition.place(
            new previewPosition.Point(clientX, clientY),
            new previewPosition.Bounds(rect.left, rect.right),
            new previewPosition.Size(window.innerWidth, window.innerHeight),
            new previewPosition.Size(preferredSize.width, preferredSize.height),
        );

        if (!visible.current) {
            x.jump(left);
            y.jump(top);
        } else {
            x.set(left);
            y.set(top);
        }
        if (hovered.current === title) return;
        hovered.current = title;
        setSize({ width, height });
        setWarmed(true);
        if (pending.current) clearTimeout(pending.current);

        if (visible.current) {
            setActive(title);
            setDisplayed(title);
        } else {
            pending.current = setTimeout(() => {
                pending.current = null;
                visible.current = true;
                setActive(title);
                setDisplayed(title);
            }, HOVER_DELAY);
        }
    }, [dismiss, projects, x, y]);

    function move(event: PointerEvent<HTMLDivElement>) {
        if (!enabled || event.pointerType !== 'mouse') return;
        pointer.current = { x: event.clientX, y: event.clientY };
        pointerTarget.current = event.target as Element;
        if (pointerFrame.current !== null) return;
        pointerFrame.current = requestAnimationFrame(() => {
            pointerFrame.current = null;
            const point = pointer.current;
            if (point) updatePreview(pointerTarget.current, point.x, point.y);
        });
    }

    useEffect(() => {
        const media = window.matchMedia(PREVIEW_QUERY);
        const update = () => {
            setEnabled(media.matches);
            dismiss();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' || event.key === 'Tab') dismiss();
        };
        let scrollFrame: number | null = null;
        const onScroll = () => {
            rowBounds.current = null;
            if (!media.matches || !pointer.current || scrollFrame !== null) return;
            scrollFrame = requestAnimationFrame(() => {
                scrollFrame = null;
                const point = pointer.current;
                if (!point) return;
                // Scrolling moves rows beneath a stationary pointer. Refresh
                // the hovered project without restarting the preview delay.
                updatePreview(document.elementFromPoint(point.x, point.y), point.x, point.y);
            });
        };
        update();
        media.addEventListener('change', update);
        window.addEventListener('scroll', onScroll, { capture: true, passive: true });
        window.addEventListener('resize', dismiss);
        window.addEventListener('blur', dismiss);
        window.addEventListener('keydown', onKeyDown);
        return () => {
            media.removeEventListener('change', update);
            window.removeEventListener('scroll', onScroll, true);
            if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
            window.removeEventListener('resize', dismiss);
            window.removeEventListener('blur', dismiss);
            window.removeEventListener('keydown', onKeyDown);
            if (pending.current) clearTimeout(pending.current);
            if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
        };
    }, [dismiss, updatePreview]);

    const show = active !== null && loaded[active] === true;
    // Retain the last still through the exit fade, but stop moving media.
    const activeProject = projects.find(project => project.title === displayed && project.preview);

    return (
        <div ref={container} onPointerMove={move} onPointerLeave={dismiss} onPointerCancel={dismiss}>
            {children}
            {enabled && warmed && createPortal(
                <motion.div
                    aria-hidden="true"
                    data-project-hover-preview=""
                    data-active-project={show ? active : undefined}
                    className="project-hover-preview pointer-events-none fixed left-0 top-0 z-50"
                    style={{ x, y, width: size.width, height: size.height }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.97 }}
                        transition={{ duration: show ? 0.18 : 0.12, ease: [0.23, 1, 0.32, 1] }}
                        className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#101012] shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
                    >
                        {activeProject && (
                            <motion.div
                                key={activeProject.title}
                                className="absolute inset-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.16 }}
                            >
                                <Image
                                    src={activeProject.preview!}
                                    alt=""
                                    fill
                                    sizes="280px"
                                    loading="eager"
                                    className="object-contain"
                                    onLoad={() => setLoaded((current) => current[activeProject.title] ? current : ({ ...current, [activeProject.title]: true }))}
                                    onError={() => setLoaded((current) => ({ ...current, [activeProject.title]: false }))}
                                />
                                {active === activeProject.title && activeProject.previewMotion && (
                                    <ProjectMotionPreview media={activeProject.previewMotion} />
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>,
                document.body,
            )}
        </div>
    );
}
