import { wraps } from './data/art.mjs';
const HAND_TIPS = wraps().toArray().map(w => [w.x, w.tip_y]);
const HAND_WIDTH = 240;
const WRAP_DURATION = 360;
const CHAIN_ENTRIES = [0, 225, 385, 725, 65, 175, 465, 640];
const CHAIN_DURATIONS = [940, 1070, 1150, 1240, 975, 1030, 1190, 1210];
const DRIFT_PX_PER_SEC = 12;
const DEPTH = [-0.7, 0, 0.45];
export function mount_rail(rail, side) {
    const pose = rail.querySelector('.sigil-pose');
    const shift = rail.querySelector('.sigil-scroll');
    const tile = shift.querySelector('pre');
    const ready = true;
    const layers = [...shift.querySelectorAll('[data-sigil-depth]')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1024px)');
    const dir = side === 'left' ? -1 : 1;
    let raf = 0;
    let last = performance.now();
    let drift = 0;
    let elapsed = 0;
    let scroll = window.scrollY;
    let momentum = 0;
    let h = tile.offsetHeight;
    const frame = (now) => {
        raf = 0;
        if (document.hidden || reduced.matches || !desktop.matches)
            return;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (h > 0 && dt > 0) {
            elapsed += dt;
            const progress = Math.min(elapsed / 1.1, 1);
            const entrance = progress * progress * (3 - 2 * progress);
            const previousScroll = scroll;
            scroll += (window.scrollY - scroll) * (1 - Math.exp(-dt / 0.14));
            const velocity = Math.max(-1, Math.min(1, (scroll - previousScroll) / dt / 1000));
            momentum += (velocity - momentum) * (1 - Math.exp(-dt / 0.18));
            const phase = elapsed + (side === 'left' ? 0 : 4.7);
            const wave = (Math.sin(phase * 0.62) + 1) / 2;
            const idleTurn = Math.sin(phase * 0.37) * 0.72 + Math.sin(phase * 0.81) * 0.28;
            const turn = Math.max(-1, Math.min(1, idleTurn + momentum * 0.55));
            const energy = Math.min(1, (Math.sin(phase * 0.93 - 0.8) + 1) / 2 + Math.abs(momentum) * 0.25);
            drift += dt * DRIFT_PX_PER_SEC * (0.6 + wave * 1.65) * dir * entrance;
            const raw = drift + scroll * 0.42 * dir;
            const y = ((raw % h) - h) % h;
            shift.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
            const sway = Math.sin(phase * 0.42) * 4 * entrance;
            pose.style.transform = `perspective(800px) translateX(${sway.toFixed(2)}px) rotateY(${(turn * dir * 15 * entrance).toFixed(2)}deg) rotateZ(${(-turn * dir * 1.4 * entrance).toFixed(2)}deg) scaleX(${(1 + wave * 0.045 * entrance).toFixed(4)})`;
            layers.forEach((layer, index) => {
                const depth = DEPTH[index];
                layer.style.transform = `translate3d(${(turn * depth * dir * 3 * entrance).toFixed(2)}px, ${(turn * depth * 7 * entrance).toFixed(2)}px, 0)`;
                layer.style.opacity = String(index === 2 ? 0.65 + energy * 0.35 : index === 0 ? 0.85 + (1 - energy) * 0.15 : 1);
            });
        }
        raf = requestAnimationFrame(frame);
    };
    const sync = () => {
        cancelAnimationFrame(raf);
        raf = 0;
        if (reduced.matches) {
            pose.style.transform = '';
            shift.style.transform = '';
            layers.forEach(layer => { layer.style.transform = ''; layer.style.opacity = ''; });
        }
        if (ready && desktop.matches && !reduced.matches && !document.hidden) {
            last = performance.now();
            raf = requestAnimationFrame(frame);
        }
    };
    const resize = new ResizeObserver(() => { h = tile.offsetHeight; });
    resize.observe(tile);
    desktop.addEventListener('change', sync);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
        cancelAnimationFrame(raf);
        resize.disconnect();
        desktop.removeEventListener('change', sync);
        reduced.removeEventListener('change', sync);
        document.removeEventListener('visibilitychange', sync);
    };
}
export function mount_threads(root, front, skip, reveal) {
    const main = document.querySelector('main');
    const desktop = window.matchMedia('(min-width: 1024px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const paths = [...root.querySelectorAll('.puppet-threads path')];
    const threads = [...root.querySelectorAll('.puppet-threads textPath')];
    const nodes = [...root.querySelectorAll('.puppet-threads circle')];
    const frontThreads = [...front.querySelectorAll('textPath')];
    const frontClips = [...front.querySelectorAll('clipPath rect')];
    const writeThread = (slot, count) => {
        const text = '='.repeat(count);
        threads[slot].textContent = text;
        frontThreads[slot].textContent = text;
    };
    const hands = [...root.querySelectorAll('[data-puppet-hand]')];
    const wraps = hands.flatMap(hand => [...hand.querySelectorAll('[data-finger-wrap]')].reverse());
    const coils = wraps.map(wrap => {
        const masks = [...wrap.querySelectorAll('[data-wrap-reveal]')];
        const lengths = masks.map(path => path.getTotalLength());
        return { masks, lengths, total: lengths.reduce((sum, length) => sum + length, 0) };
    });
    const wrapProgress = new Array(8).fill(-1);
    const wind = (slot, progress) => {
        if (wrapProgress[slot] === progress)
            return;
        wrapProgress[slot] = progress;
        wraps[slot].setAttribute('opacity', progress > 0 ? '1' : '0');
        const coil = coils[slot];
        let remaining = progress * coil.total;
        coil.masks.forEach((mask, index) => {
            const length = coil.lengths[index];
            const portion = Math.max(0, Math.min(remaining / length, 1));
            mask.setAttribute('stroke-dashoffset', (1 - portion).toFixed(3));
            remaining -= length;
        });
    };
    let anchors = [];
    let raf = 0;
    let dirty = true;
    const threadCounts = new Array(8).fill(0);
    const visibleCounts = new Array(8).fill(-1);
    const arrivalCounts = new Array(8).fill(0);
    const phrasing = [];
    const arrived = new Array(8).fill(false);
    const started = performance.now();
    let growing = !reduced.matches && !skip;
    let revealed = false;
    const draw = () => {
        if (document.hidden)
            return;
        const rootBox = root.getBoundingClientRect();
        const handBoxes = hands.map(hand => hand.getBoundingClientRect());
        const content = main.getBoundingClientRect();
        const anchorBoxes = anchors.map(anchor => anchor.getBoundingClientRect());
        const sceneHeight = Math.ceil(Math.max(content.bottom - rootBox.top, window.innerHeight));
        if (sceneHeight !== rootBox.height)
            root.style.height = `${sceneHeight}px`;
        front.setAttribute('height', String(sceneHeight));
        for (let side = 0; side < 2; side++) {
            for (let index = 0; index < 4; index++) {
                const slot = side * 4 + index;
                const box = anchorBoxes[index];
                const path = paths[slot];
                const node = nodes[slot];
                if (!box) {
                    path.removeAttribute('d');
                    writeThread(slot, 0);
                    frontClips[slot].setAttribute('width', '0');
                    threadCounts[slot] = 0;
                    node.setAttribute('r', '0');
                    wind(slot, 0);
                    continue;
                }
                if (!growing || arrived[slot])
                    wind(slot, 1);
                const hand = handBoxes[side];
                const tip = HAND_TIPS[3 - index];
                const scale = hand.width / HAND_WIDTH;
                const sx = hand.left - rootBox.left + (side === 0 ? tip[0] : HAND_WIDTH - tip[0]) * scale;
                const sy = hand.top - rootBox.top + tip[1] * scale;
                const crossed = slot === 1 || slot === 7 ? anchorBoxes[index - 1] : undefined;
                const endSide = crossed ? 1 - side : side;
                const ex = (endSide === 0 ? box.left + 3 : box.right - 3) - rootBox.left;
                const ey = box.top - rootBox.top + 14;
                const mobile = !desktop.matches;
                const inset = mobile ? 4 + index * 2.5 : 30 + index * 9;
                const gutter = (side === 0 ? content.left - inset : content.right + inset) - rootBox.left;
                const span = Math.max(0, ey - sy);
                const curves = [];
                if (crossed) {
                    const left = crossed.left - rootBox.left;
                    const right = crossed.right - rootBox.left;
                    const bottom = crossed.bottom - rootBox.top;
                    const top = crossed.top - rootBox.top;
                    const entryX = side === 0 ? left - 7 : right + 7;
                    const exitX = side === 0 ? right + 7 : left - 7;
                    if (slot === 1) {
                        curves.push([sx + (entryX - sx) * 0.33, sy + (bottom - 15 - sy) * 0.33, entryX - 3, bottom - 40, entryX, bottom - 12], [left + crossed.width * 0.3, bottom - 10, right - crossed.width * 0.3, bottom - 7, exitX, bottom - 5], [exitX + 3, bottom + 1, ex + 4, ey - 9, ex, ey]);
                    }
                    else {
                        curves.push([sx + (entryX - sx) * 0.33, sy + (top - sy) * 0.33, entryX + 3, top + 12, entryX, top + crossed.height * 0.65], [right - crossed.width * 0.1, top + crossed.height * 0.44, right - crossed.width * 0.23, top + crossed.height * 0.19, right - crossed.width * 0.34, top - 3], [right - crossed.width * 0.45, top + 1, left + crossed.width * 0.22, bottom - 28, exitX, bottom - 11], [exitX - 3, bottom + 1, ex - 4, ey - 9, ex, ey]);
                    }
                    const clip = frontClips[slot];
                    clip.setAttribute('x', (slot === 1 ? left : right - crossed.width * 0.4).toFixed(1));
                    clip.setAttribute('y', (crossed.top - rootBox.top).toFixed(1));
                    clip.setAttribute('width', (crossed.width * (slot === 1 ? 1 : 0.4)).toFixed(1));
                    clip.setAttribute('height', crossed.height.toFixed(1));
                }
                else {
                    frontClips[slot].setAttribute('width', '0');
                    curves.push([sx + (gutter - sx) * 0.33, sy + span * 0.33, gutter, ey - 24, ex, ey]);
                }
                let length = 0;
                let px = sx;
                let py = sy;
                const d = `M${sx.toFixed(1)},${sy.toFixed(1)}` + curves.map(curve => {
                    for (let point = 0; point < 6; point += 2) {
                        length += Math.hypot(curve[point] - px, curve[point + 1] - py);
                        px = curve[point];
                        py = curve[point + 1];
                    }
                    return ` C${curve.map(value => value.toFixed(1)).join(' ')}`;
                }).join('');
                if (path.getAttribute('d') !== d) {
                    path.setAttribute('d', d);
                    const count = Math.ceil(length / 115.2) * 16;
                    if (count !== threadCounts[slot]) {
                        if (!growing || arrived[slot])
                            writeThread(slot, count * 2);
                        threadCounts[slot] = count;
                    }
                    node.setAttribute('cx', ex.toFixed(1));
                    node.setAttribute('cy', ey.toFixed(1));
                    node.setAttribute('r', growing && !arrived[slot] ? '0' : '1.5');
                }
            }
        }
    };
    const frame = (now) => {
        raf = 0;
        if (dirty) {
            dirty = false;
            draw();
        }
        if (growing) {
            const skip = reduced.matches;
            const progressByChain = [];
            threads.forEach((_, slot) => {
                const phrase = phrasing[slot];
                const elapsed = now - started - phrase.delay;
                const winding = skip ? 1 : Math.max(0, Math.min(elapsed / WRAP_DURATION, 1));
                wind(slot, anchors[slot % 4] ? winding : 0);
                const t = skip ? 1 : Math.max(0, Math.min((elapsed - WRAP_DURATION) / phrase.duration, 1));
                const progress = t * t * (3 - 2 * t);
                progressByChain[slot] = progress;
                if (arrived[slot])
                    return;
                let count = Math.max(0, visibleCounts[slot]);
                while (count < phrase.beats.length && phrase.beats[count] <= progress)
                    count++;
                if (count !== visibleCounts[slot]) {
                    writeThread(slot, count);
                    visibleCounts[slot] = count;
                }
                if (t === 1) {
                    arrived[slot] = true;
                    writeThread(slot, threadCounts[slot] * 2);
                    nodes[slot].setAttribute('r', anchors[slot % 4] ? '1.5' : '0');
                }
            });
            if (Math.min(progressByChain[0], progressByChain[4]) >= 0.88 && !revealed) {
                reveal();
                revealed = true;
            }
            if (arrived.every(Boolean))
                growing = false;
        }
        if ((growing || dirty) && !document.hidden)
            raf = requestAnimationFrame(frame);
    };
    const schedule = () => {
        dirty = true;
        if (!raf)
            raf = requestAnimationFrame(frame);
    };
    const resize = new ResizeObserver(schedule);
    const discover = () => {
        const next = [...main.querySelectorAll('[data-puppet-anchor]')].slice(0, 4);
        if (next.length === anchors.length && next.every((anchor, index) => anchor === anchors[index]))
            return;
        anchors = next;
        resize.disconnect();
        resize.observe(main);
        anchors.forEach(anchor => resize.observe(anchor));
        schedule();
    };
    const mutations = new MutationObserver(discover);
    mutations.observe(main, { childList: true, subtree: true });
    desktop.addEventListener('change', schedule);
    reduced.addEventListener('change', schedule);
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('resize', schedule);
    discover();
    draw();
    paths.forEach((path, slot) => {
        arrivalCounts[slot] = path.hasAttribute('d') ? Math.ceil(path.getTotalLength() / 3.6) : 0;
        let beat = 0;
        const beats = Array.from({ length: arrivalCounts[slot] }, () => {
            beat += 0.78 + Math.random() * 0.44;
            return beat;
        });
        phrasing[slot] = {
            delay: Math.max(0, CHAIN_ENTRIES[slot] + (Math.random() - 0.5) * 28),
            duration: CHAIN_DURATIONS[slot] * (0.96 + Math.random() * 0.08),
            beats: beats.map(value => value / beat),
        };
    });
    if (!growing)
        reveal();
    return () => {
        cancelAnimationFrame(raf);
        resize.disconnect();
        mutations.disconnect();
        desktop.removeEventListener('change', schedule);
        reduced.removeEventListener('change', schedule);
        document.removeEventListener('visibilitychange', schedule);
        window.removeEventListener('resize', schedule);
    };
}
