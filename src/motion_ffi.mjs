import { Rect, Point, chain_at } from './lib/chain_geometry.mjs';
import { pose as finger_pose, wrist as wrist_pose, pull as finger_pull } from './lib/hand_motion.mjs';
import { init as rail_init, frame as rail_frame } from './lib/rail_motion.mjs';
import { phrase as make_phrase, progress as chain_progress, visible_count } from './lib/chain_motion.mjs';
import { toList } from './gleam.mjs';
import { Some, Option$None$const } from '../gleam_stdlib/gleam/option.mjs';
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
    const paths = [...root.querySelectorAll('.puppet-threads path[id^="puppet-thread-"]')];
    const threads = [...root.querySelectorAll('.puppet-threads textPath[href^="#puppet-thread-"]')];
    const leads = [...root.querySelectorAll('[data-thread-lead]')];
    const leadInk = [...root.querySelectorAll('[data-thread-lead-ink]')];
    const leadEnds = new Array(8);
    const nodes = [...root.querySelectorAll('.puppet-threads circle')];
    const frontThreads = [...front.querySelectorAll('textPath')];
    const frontClips = [...front.querySelectorAll('clipPath rect')];
    const writeThread = (slot, count) => {
        const text = '='.repeat(count);
        threads[slot].textContent = text;
        frontThreads[slot].textContent = text;
        leadInk[slot].setAttribute('opacity', count > 0 ? '1' : '0');
    };
    const hands = [...root.querySelectorAll('[data-puppet-hand]')];
    const fingers = hands.map(hand => [...hand.querySelectorAll('[data-hand-part]:not([data-hand-part="0"])')]);
    const wraps = hands.flatMap(hand => [...hand.querySelectorAll('[data-finger-wrap]')].reverse());
    const tails = wraps.map(wrap => [...wrap.querySelectorAll('[data-wrap-reveal]')].at(-1));
    const tips = tails.map(tail => tail.getPointAtLength(tail.getTotalLength()));
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
    let immediate = reduced.matches || skip;
    let revealed = false;
    let visible = true;
    let elapsed = 0;
    let last = started;
    const animateHands = now => {
        elapsed += Math.min(now - last, 50);
        last = now;
        hands.forEach((hand, side) => {
            const wrist = wrist_pose(side === 1, elapsed);
            hand.style.transform = reduced.matches ? '' : `translate3d(${wrist.x.toFixed(2)}px,${wrist.y.toFixed(2)}px,0) rotate(${wrist.angle.toFixed(3)}deg)`;
            fingers[side].forEach(finger => {
                const part = Number(finger.dataset.handPart);
                const phrase = phrasing[side * 4 + 4 - part];
                const pull = growing && phrase ? finger_pull(now - started - phrase.delay) : 0;
                const pose = finger_pose(part, side === 1, elapsed, pull);
                finger.style.transform = reduced.matches ? '' : `rotate(${pose.angle.toFixed(3)}deg) scaleY(${pose.stretch.toFixed(4)})`;
            });
        });
    };
    const draw = () => {
        if (document.hidden)
            return;
        // Long text paths only change with layout. Measure their resting joints
        // once; a small separate section follows the articulated fingertip.
        const joints = [...hands, ...fingers.flat()];
        const transforms = joints.map(joint => joint.style.transform);
        joints.forEach(joint => { joint.style.transform = ''; });
        const rootBox = root.getBoundingClientRect();
        const starts = tails.map((tail, slot) => tips[slot].matrixTransform(tail.getScreenCTM()));
        joints.forEach((joint, index) => { joint.style.transform = transforms[index]; });
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
                    leads[slot].removeAttribute('d');
                    leadEnds[slot] = undefined;
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
                const start=starts[slot];
                const geometry=chain_at(side,index,new Point(start.x-rootBox.left,start.y-rootBox.top),rect(rootBox),rect(content),rect(box),crossed ? new Some(rect(crossed)) : Option$None$const,!desktop.matches);
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
                    leadEnds[slot] = path.getPointAtLength(25.2);
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
    const drawLeads = () => {
        const rootBox = root.getBoundingClientRect();
        tails.forEach((tail, slot) => {
            const end = leadEnds[slot];
            if (!end) return;
            const tip = tips[slot].matrixTransform(tail.getScreenCTM());
            const x = tip.x - rootBox.left;
            const y = tip.y - rootBox.top;
            const reach = Math.max(3, (end.y - y) * 0.5);
            const d = `M${x.toFixed(1)},${y.toFixed(1)} C${x.toFixed(1)},${(y+reach).toFixed(1)} ${end.x.toFixed(1)},${(end.y-reach).toFixed(1)} ${end.x.toFixed(1)},${end.y.toFixed(1)}`;
            if (leads[slot].getAttribute('d') !== d) leads[slot].setAttribute('d', d);
        });
    };
    const frame = (now) => {
        raf = 0;
        if (document.hidden) return;
        const moving = visible && !reduced.matches;
        if (moving || dirty) {
            animateHands(now);
        }
        if (dirty) {
            dirty = false;
            draw();
        }
        if (moving || reduced.matches) drawLeads();
        if (growing) {
            const skip = reduced.matches || immediate;
            const progressByChain = [];
            threads.forEach((_, slot) => {
                const phrase = phrasing[slot];
                const elapsed = now - started - phrase.delay;
                const timing=chain_progress(elapsed,phrase.duration,skip);
                wind(slot, anchors[slot % 4] ? timing.winding : 0);
                progressByChain[slot] = timing.progress;
                if(arrived[slot]) return;
                const count=visible_count(phrase.beats,timing.progress,Math.max(0,visibleCounts[slot]));
                if (count !== visibleCounts[slot]) {
                    writeThread(slot, count);
                    visibleCounts[slot] = count;
                }
                if (timing.complete) {
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
        if (growing || dirty || moving)
            raf = requestAnimationFrame(frame);
    };
    const schedule = () => {
        dirty = true;
        last = performance.now();
        if (!raf)
            raf = requestAnimationFrame(frame);
    };
    const resize = new ResizeObserver(schedule);
    const keyboard = event => {
        if (event.key === 'Tab' && growing) {
            immediate = true;
            schedule();
        }
    };
    const visibility = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        schedule();
    });
    visibility.observe(root.querySelector('.puppet-hand-stage'));
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
    window.addEventListener('keydown', keyboard);
    discover();
    draw();
    drawLeads();
    paths.forEach((path, slot) => {
        arrivalCounts[slot] = path.hasAttribute('d') ? Math.ceil(path.getTotalLength() / 3.6) : 0;
        const samples=Array.from({length:arrivalCounts[slot]},()=>Math.random());
        phrasing[slot]=make_phrase(slot,toList(samples),Math.random(),Math.random());
    });
    if (!growing)
        reveal();
    return () => {
        cancelAnimationFrame(raf);
        resize.disconnect();
        mutations.disconnect();
        visibility.disconnect();
        hands.forEach(hand => { hand.style.transform = ''; });
        fingers.flat().forEach(finger => { finger.style.transform = ''; });
        desktop.removeEventListener('change', schedule);
        reduced.removeEventListener('change', schedule);
        document.removeEventListener('visibilitychange', schedule);
        window.removeEventListener('resize', schedule);
        window.removeEventListener('keydown', keyboard);
    };
}
