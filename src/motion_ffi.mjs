import { Rect, chain } from './lib/chain_geometry.mjs';
import { init as rail_init, frame as rail_frame, smooth } from './lib/rail_motion.mjs';
import { Some, Option$None$const } from '../gleam_stdlib/gleam/option.mjs';
const WRAP_DURATION = 360;
const CHAIN_ENTRIES = [0,225,385,725,65,175,465,640];
const CHAIN_DURATIONS = [940,1070,1150,1240,975,1030,1190,1210];
const rect = r => new Rect(r.left,r.top,r.right,r.bottom,r.width,r.height);
export function mount_rail(rail, side) {
    const pose = rail.querySelector('.sigil-pose');
    const shift = rail.querySelector('.sigil-scroll');
    const tile = shift.querySelector('pre');
    const ready = true;
    const layers = [...shift.querySelectorAll('[data-sigil-depth]')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1024px)');
    let raf = 0;
    let last = performance.now();
    let state = rail_init(window.scrollY);
    let h = tile.offsetHeight;
    const frame = (now) => {
        raf = 0;
        if (document.hidden || reduced.matches || !desktop.matches)
            return;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (h > 0 && dt > 0) {
            const result=rail_frame(state,side==='left',dt,window.scrollY,h);
            state=result.state;
            shift.style.transform=`translate3d(0, ${result.shift.toFixed(2)}px, 0)`;
            pose.style.transform=`perspective(800px) translateX(${result.sway.toFixed(2)}px) rotateY(${result.rotate_y.toFixed(2)}deg) rotateZ(${result.rotate_z.toFixed(2)}deg) scaleX(${result.scale_x.toFixed(4)})`;
            const positions=result.layers.toArray();
            layers.forEach((layer,index) => {
              layer.style.transform=`translate3d(${positions[index].x.toFixed(2)}px, ${positions[index].y.toFixed(2)}px, 0)`;
              layer.style.opacity=String(positions[index].opacity);
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
                const crossed = slot === 1 || slot === 7 ? anchorBoxes[index - 1] : undefined;
                const geometry=chain(side,index,rect(rootBox),rect(handBoxes[side]),rect(content),rect(box),crossed ? new Some(rect(crossed)) : Option$None$const,!desktop.matches);
                const clip=frontClips[slot];
                clip.setAttribute('x',geometry.clip.left.toFixed(1));
                clip.setAttribute('y',geometry.clip.top.toFixed(1));
                clip.setAttribute('width',geometry.clip.width.toFixed(1));
                clip.setAttribute('height',geometry.clip.height.toFixed(1));
                const d=geometry.path;
                const ex=geometry.end.x;
                const ey=geometry.end.y;
                if (path.getAttribute('d') !== d) {
                    path.setAttribute('d', d);
                    const count = geometry.count;
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
                const progress = smooth(t);
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
