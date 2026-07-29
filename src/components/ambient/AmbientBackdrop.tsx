'use client';

import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    subscribeAmbient,
    getAmbientPalette,
    getAmbientServerSnapshot,
    type RGB,
} from './ambient';

/**
 * Rein a palette color into wash territory: pull it toward gray, then pin its
 * brightness to a mid band so dark and neon sleeves alike land as a tint
 * rather than a glare.
 */
function tame([r, g, b]: RGB): RGB {
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const mixed = [r, g, b].map((v) => v + (luma - v) * 0.3);
    const max = Math.max(...mixed, 1);
    const k = Math.min(Math.max(155 / max, 0.6), 3.2);
    return mixed.map((v) => Math.round(Math.min(255, v * k))) as RGB;
}

/**
 * Full-page ambient wash driven by whatever's playing. Sits fixed behind the
 * content; blobs hug the page edges so the reading column stays dark. Track
 * changes crossfade; the whole layer drifts slowly (killed under
 * prefers-reduced-motion in globals.css).
 */
export function AmbientBackdrop() {
    const palette = useSyncExternalStore(
        subscribeAmbient,
        getAmbientPalette,
        getAmbientServerSnapshot
    );

    let wash: string | null = null;
    let key = '';
    if (palette) {
        const c1 = tame(palette.primary);
        const c2 = tame(palette.secondary);
        key = `${c1.join(',')}|${c2.join(',')}`;
        wash = [
            `radial-gradient(ellipse 55% 42% at 14% -6%, rgba(${c1.join(',')}, 0.16), transparent 68%)`,
            `radial-gradient(ellipse 50% 40% at 104% 24%, rgba(${c2.join(',')}, 0.12), transparent 66%)`,
            `radial-gradient(ellipse 60% 45% at 42% 112%, rgba(${c1.join(',')}, 0.09), transparent 70%)`,
        ].join(', ');
    }

    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <AnimatePresence>
                {wash && (
                    <motion.div
                        key={key}
                        className="absolute -inset-[18%] ambient-drift"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2.6, ease: 'easeInOut' }}
                        style={{ background: wash }}
                    />
                )}
            </AnimatePresence>

            {/* Film grain — the card's noise, page-wide. Static (doesn't drift
                with the wash); gives the black some tooth and stops the wash
                gradients from banding. */}
            <div
                className="absolute inset-0 opacity-[0.045]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: '256px 256px',
                }}
            />
        </div>
    );
}
