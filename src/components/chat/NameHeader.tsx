'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatedText } from '@/components/motion/AnimatedText';

/**
 * The masthead renders as real text (SSR, screen readers, the entry
 * animation), then — on hover-capable devices — gets swapped for a canvas of
 * its own dither dots. The glyphs are rasterized and sampled at device-pixel
 * resolution (the Gossip dither lives in sub-css-pixel detail), each lit
 * pixel becomes a particle, and the frame is composited through a raw pixel
 * buffer so tens of thousands of dots stay cheap. Dots spring away from the
 * cursor and settle back; the loop sleeps whenever everything is at rest.
 */

// Canvas fillText renders the dither dots dilated (~2× the lit area) versus
// the DOM's -webkit-font-smoothing: antialiased text, so a plain sample swaps
// in visibly brighter. Erode instead of dim: interior pixels keep full punch,
// dot edges are down-weighted, fringe nearly vanishes — shrinks each dot back
// to the DOM's rendering without flattening the bright cores.
const A_CORE = 180; // "strong" pixel threshold
const W_FULL = 1; // 4 strong neighbors — dot interior
const W_EDGE = 0.47; // 3 strong neighbors — dot edge
const W_RIM = 0.26; // exposed rim
const W_FRINGE = 0.15; // sub-core AA fringe
const ALPHA_MIN = 40; // ignore below this entirely
const PAD_X = 32; // canvas bleed (css px) — glyphs overflow their line boxes,
const PAD_Y = 48; // and scattered dots need somewhere to go
const RADIUS_CSS = 70; // repel radius (css px)
const SPRING = 0.09;
const DAMP = 0.82;
const PUSH_CSS = 2.4;

function parseColor(css: string): [number, number, number, number] {
    const m = css.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/);
    if (!m) return [255, 255, 255, 0.7];
    return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
}

export function NameHeader() {
    const boxRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [live, setLive] = useState(false);

    useEffect(() => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let disposed = false;
        let built = false;
        let raf = 0;
        let running = false;
        let calm = 0;
        let mouse: { x: number; y: number } | null = null;

        // particle state (device-pixel space), flat arrays for speed
        let n = 0;
        let hx = new Float32Array(0);
        let hy = new Float32Array(0);
        let px = new Float32Array(0);
        let py = new Float32Array(0);
        let vx = new Float32Array(0);
        let vy = new Float32Array(0);
        let pix = new Uint32Array(0); // packed RGBA per particle

        let ctx: CanvasRenderingContext2D | null = null;
        let frame: ImageData | null = null;
        let W = 0;
        let H = 0;
        let radius = RADIUS_CSS;
        let push = PUSH_CSS;

        /** Rasterize the settled text at device resolution and lift its dots. */
        const build = (): boolean => {
            const box = boxRef.current;
            const textEl = textRef.current;
            const canvas = canvasRef.current;
            if (!box || !textEl || !canvas) return false;

            const bw = Math.round(box.clientWidth);
            const bh = Math.round(box.clientHeight);
            if (!bw || !bh) return false;
            const w = bw + PAD_X * 2;
            const h = bh + PAD_Y * 2;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = Math.round(w * dpr);
            H = Math.round(h * dpr);
            radius = RADIUS_CSS * dpr;
            push = PUSH_CSS * dpr;

            const probe = document.createElement('canvas');
            probe.width = W;
            probe.height = H;
            const pctx = probe.getContext('2d', { willReadFrequently: true }) as
                | (CanvasRenderingContext2D & { letterSpacing?: string })
                | null;
            if (!pctx) return false;
            pctx.scale(dpr, dpr);

            const boxRect = box.getBoundingClientRect();
            const lines = textEl.querySelectorAll(':scope > span');
            if (!lines.length) return false;

            pctx.textAlign = 'center';
            pctx.fillStyle = '#fff';

            lines.forEach((line) => {
                const cs = getComputedStyle(line);
                const fontSize = parseFloat(cs.fontSize);
                pctx.font = `${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
                if ('letterSpacing' in pctx && cs.letterSpacing !== 'normal') {
                    pctx.letterSpacing = cs.letterSpacing;
                }
                const text = line.textContent ?? '';
                // Measure the DOM's true baseline: a zero-size inline-block
                // sits with its bottom exactly on the text baseline. (The
                // font's own metrics lie — its bounding box is 2em tall.)
                const probeSpan = document.createElement('span');
                probeSpan.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden';
                line.appendChild(probeSpan);
                const baseline = probeSpan.getBoundingClientRect().top - boxRect.top;
                probeSpan.remove();
                pctx.fillText(text, w / 2, baseline + PAD_Y);
            });

            const img = pctx.getImageData(0, 0, W, H).data;
            const [cr, cg, cb, ca] = parseColor(getComputedStyle(textEl).color);

            const alphaAt = (x: number, y: number) =>
                x < 0 || x >= W || y < 0 || y >= H ? 0 : img[(y * W + x) * 4 + 3];
            const weightAt = (x: number, y: number): number => {
                const a = alphaAt(x, y);
                if (a <= ALPHA_MIN) return 0;
                if (a <= A_CORE) return (a / 255) * W_FRINGE;
                let strong = 0;
                if (alphaAt(x - 1, y) > A_CORE) strong++;
                if (alphaAt(x + 1, y) > A_CORE) strong++;
                if (alphaAt(x, y - 1) > A_CORE) strong++;
                if (alphaAt(x, y + 1) > A_CORE) strong++;
                return (a / 255) * (strong === 4 ? W_FULL : strong === 3 ? W_EDGE : W_RIM);
            };

            const xs: number[] = [];
            const ys: number[] = [];
            const as: number[] = [];
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    const wgt = weightAt(x, y);
                    if (wgt > 0.04) {
                        xs.push(x);
                        ys.push(y);
                        as.push(Math.round(wgt * ca * 255));
                    }
                }
            }
            const count = xs.length;
            if (count < 200 || count > 160000) return false;

            hx = Float32Array.from(xs);
            hy = Float32Array.from(ys);
            px = Float32Array.from(xs);
            py = Float32Array.from(ys);
            vx = new Float32Array(count);
            vy = new Float32Array(count);
            pix = new Uint32Array(count);
            for (let i = 0; i < count; i++) {
                pix[i] = (as[i] << 24) | (cb << 16) | (cg << 8) | cr;
            }
            n = count;

            canvas.width = W;
            canvas.height = H;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            canvas.style.left = `${-PAD_X}px`;
            canvas.style.top = `${-PAD_Y}px`;
            ctx = canvas.getContext('2d');
            if (!ctx) return false;
            frame = ctx.createImageData(W, H);
            return true;
        };

        const draw = () => {
            if (!ctx || !frame) return;
            const buf = new Uint32Array(frame.data.buffer);
            buf.fill(0);
            for (let i = 0; i < n; i++) {
                const x = px[i] + 0.5 | 0;
                const y = py[i] + 0.5 | 0;
                if (x >= 0 && x < W && y >= 0 && y < H) buf[y * W + x] = pix[i];
            }
            ctx.putImageData(frame, 0, 0);
        };

        const settle = () => {
            px.set(hx);
            py.set(hy);
            vx.fill(0);
            vy.fill(0);
            draw();
        };

        const tick = () => {
            let energy = 0;
            const r2 = radius * radius;
            for (let i = 0; i < n; i++) {
                if (mouse) {
                    const dx = px[i] - mouse.x;
                    const dy = py[i] - mouse.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < r2 && d2 > 0.01) {
                        const d = Math.sqrt(d2);
                        const f = (1 - d / radius) ** 2 * push;
                        vx[i] += (dx / d) * f;
                        vy[i] += (dy / d) * f;
                    }
                }
                vx[i] = (vx[i] + (hx[i] - px[i]) * SPRING) * DAMP;
                vy[i] = (vy[i] + (hy[i] - py[i]) * SPRING) * DAMP;
                px[i] += vx[i];
                py[i] += vy[i];
                const e = Math.abs(vx[i]) + Math.abs(vy[i]);
                if (e > energy) energy = e;
            }
            draw();
            calm = !mouse && energy < 0.05 ? calm + 1 : 0;
            if (calm > 30) {
                running = false;
                settle(); // kill lingering sub-pixel drift
                return;
            }
            raf = requestAnimationFrame(tick);
        };

        const wake = () => {
            if (!running && built) {
                running = true;
                calm = 0;
                raf = requestAnimationFrame(tick);
            }
        };

        const onMove = (e: PointerEvent) => {
            const canvas = canvasRef.current;
            if (!canvas || !built) return;
            const r = canvas.getBoundingClientRect();
            const scale = r.width ? W / r.width : 1;
            const x = (e.clientX - r.left) * scale;
            const y = (e.clientY - r.top) * scale;
            if (x > -radius && y > -radius && x < W + radius && y < H + radius) {
                mouse = { x, y };
                wake();
            } else if (mouse) {
                mouse = null;
                wake();
            }
        };
        const onLeave = () => {
            if (mouse) {
                mouse = null;
                wake();
            }
        };

        // Swap once the font is in and the entry animation has finished
        let bootTimer: ReturnType<typeof setTimeout> | undefined;
        document.fonts.ready.then(() => {
            if (disposed) return;
            bootTimer = setTimeout(() => {
                if (disposed) return;
                if (build()) {
                    built = true;
                    draw();
                    setLive(true);
                }
            }, 1900);
        });

        // Rebuild on layout changes (the 52px → 72px breakpoint, etc.)
        let resizeTimer: ReturnType<typeof setTimeout> | undefined;
        const ro = new ResizeObserver(() => {
            if (!built) return;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                mouse = null;
                if (build()) draw();
                else setLive(false);
            }, 150);
        });
        if (boxRef.current) ro.observe(boxRef.current);

        window.addEventListener('pointermove', onMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);

        return () => {
            disposed = true;
            clearTimeout(bootTimer);
            clearTimeout(resizeTimer);
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener('pointermove', onMove);
            document.documentElement.removeEventListener('pointerleave', onLeave);
        };
    }, []);

    return (
        <header className="w-full mb-8 text-center select-none">
            {/* AnimatedText marks its glyphs aria-hidden, so carry the real name for AT */}
            <h1 className="sr-only">Zidan Kazi</h1>

            {/* Stacked two-line block — blackletter reads best as a dense mass.
          The header's select-none keeps the font from being lifted out via
          text selection. */}
            <div ref={boxRef} aria-hidden="true" className="relative">
                <div
                    ref={textRef}
                    className={`font-display font-extralight text-white/70 leading-[0.98] tracking-[-0.02em] ${live ? 'opacity-0' : ''}`}
                >
                    <AnimatedText
                        text="Zidan"
                        element="span"
                        className="block text-[52px] sm:text-[72px]"
                        delay={0}
                    />
                    <AnimatedText
                        text="Kazi"
                        element="span"
                        className="block text-[52px] sm:text-[72px]"
                        delay={0.18}
                    />
                </div>
                <canvas
                    ref={canvasRef}
                    className={`pointer-events-none absolute ${live ? '' : 'opacity-0'}`}
                />
            </div>
        </header>
    );
}
