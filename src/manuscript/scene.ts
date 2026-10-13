import {prepareWithSegments, layoutNextLine, type LayoutCursor} from '@chenglou/pretext';
import {Dragon, type Range} from './dragon.js';
import {introduction} from './data.js';

export function subtractRanges(ranges: Range[], exclusion: Range): Range[] {
  return ranges.flatMap(range => {
    if (exclusion.right <= range.left || exclusion.left >= range.right) return [range];
    const remaining: Range[] = [];
    if (exclusion.left > range.left) remaining.push({left: range.left, right: exclusion.left});
    if (exclusion.right < range.right) remaining.push({left: exclusion.right, right: range.right});
    return remaining;
  });
}

export async function mountScene(): Promise<void> {
  const scene = document.querySelector<HTMLElement>('#manuscript-scene');
  const canvas = document.querySelector<HTMLCanvasElement>('#manuscript');
  const flow = document.querySelector<HTMLElement>('#flow-text');
  const toggle = document.querySelector<HTMLButtonElement>('#motion-toggle');
  const ctx = canvas?.getContext('2d');
  if (!scene || !canvas || !flow || !toggle || !ctx) return;
  await document.fonts.load('21px "IM Fell English"');
  const dragon = await Dragon.load();
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionPreference.matches;
  let visible = true;
  let width = 0, height = 0, fontSize = 21, lineHeight = 33;
  let restX = 0, restY = 0;
  let target: {x: number; y: number} | null = null;
  let lastMove = 0;
  let scheduled = 0;
  let dirty = true;
  let prepared = introduction.map(text => prepareWithSegments(text, '21px "IM Fell English"'));
  const spans: HTMLSpanElement[] = [];

  function layout() {
    let y = 4, used = 0;
    for (let paragraph = 0; paragraph < prepared.length; paragraph++) {
      let cursor: LayoutCursor = {segmentIndex: 0, graphemeIndex: 0};
      let done = false;
      for (let attempts = 0; attempts < 100 && !done; attempts++) {
        const rowStart = used;
        let ranges: Range[] = [{left: 0, right: width}];
        if (paragraph === 0 && y < (width < 500 ? 112 : 138)) ranges = subtractRanges(ranges, {left: 0, right: width < 500 ? 64 : 94});
        for (const exclusion of dragon.exclusions(y, y+lineHeight)) ranges = subtractRanges(ranges, exclusion);
        if (width < 500 && ranges.length > 1) ranges = [ranges.reduce((largest, range) => range.right-range.left > largest.right-largest.left ? range : largest)];
        for (const range of ranges.filter(range => range.right-range.left >= Math.max(fontSize*4, width*.24))) {
          const line = layoutNextLine(prepared[paragraph], cursor, range.right-range.left);
          if (!line) {done = true; break;}
          if (line.end.segmentIndex === cursor.segmentIndex && line.end.graphemeIndex === cursor.graphemeIndex) continue;
          const span = spans[used] ?? document.createElement('span');
          if (!spans[used]) {spans.push(span); flow!.append(span);}
          span.hidden = false;
          if (span.textContent !== line.text) span.textContent = line.text;
          span.style.transform = `translate(${Math.round(range.left)}px, ${Math.round(y)}px)`;
          cursor = line.end; used++;
        }
        if (!done || used > rowStart) y += lineHeight;
      }
      y += lineHeight*.65;
    }
    for (let i = used; i < spans.length; i++) spans[i].hidden = true;
    // Reserve enough room for even a fully obstructed paragraph; never cut off copy.
    const needed = Math.max(width < 500 ? 390 : 340, Math.ceil(y+lineHeight));
    if (needed > height) resizeCanvas(needed);
    flow!.dataset.lineCount = String(used);
  }
  function resizeCanvas(nextHeight: number) {
    height = nextHeight;
    scene!.style.height = height+'px';
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas!.width = Math.round(width*dpr); canvas!.height = Math.round(height*dpr);
    canvas!.style.width = width+'px'; canvas!.style.height = height+'px';
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function render(time: number) {
    scheduled = 0;
    if (!visible || document.hidden) return;
    const moved = !paused && dragon.update(time, time-lastMove < 1700 ? target : null, restX, restY);
    ctx!.clearRect(0, 0, width, height);
    if (dirty || moved) {layout(); dirty=false;}
    dragon.draw(ctx!, time, !paused);
    scene!.dataset.ready = 'true';
    if (!paused) schedule();
  }
  function schedule() {if (!scheduled && visible && !document.hidden) scheduled = requestAnimationFrame(render);}
  function resize() {
    width = scene!.clientWidth;
    fontSize = width < 500 ? 19 : 22;
    lineHeight = width < 500 ? 30 : 35;
    flow!.style.fontSize = fontSize+'px'; flow!.style.lineHeight = lineHeight+'px';
    prepared = introduction.map((text, i) => prepareWithSegments(i === 0 ? text.slice(1) : text, `${fontSize}px "IM Fell English"`));
    const scale = width < 500 ? .44 : .92;
    restX = width-90*scale; restY = width < 500 ? 130 : 98;
    dragon.rest(restX, restY, scale);
    target = null;
    dirty = true;
    resizeCanvas(width < 500 ? 390 : 340);
    schedule();
  }
  function updateToggle() {
    dirty = true;
    toggle!.textContent = paused ? 'Wake dragon' : 'Pause dragon';
    toggle!.setAttribute('aria-pressed', String(paused));
    scene!.dataset.paused = String(paused);
  }
  toggle.addEventListener('click', () => {paused=!paused; dragon.sparks=[]; updateToggle(); schedule();});
  motionPreference.addEventListener('change', event => {paused=event.matches; target=null; updateToggle(); schedule();});
  scene.addEventListener('pointermove', event => {
    if (paused || event.pointerType !== 'mouse') return;
    const bounds = scene.getBoundingClientRect();
    target={x: Math.max(30, Math.min(width-30, event.clientX-bounds.left)), y: Math.max(35, Math.min(height-50, event.clientY-bounds.top))};
    lastMove=performance.now(); schedule();
  });
  scene.addEventListener('pointerleave', () => {target=null;});
  scene.addEventListener('pointerdown', event => {
    if (paused || event.button !== 0 || event.pointerType !== 'mouse') return;
    dragon.breathe(); schedule();
  });
  new ResizeObserver(() => {if (scene.clientWidth !== width) resize();}).observe(scene);
  new IntersectionObserver(entries => {visible=entries[0].isIntersecting; if (visible) schedule(); else {cancelAnimationFrame(scheduled); scheduled=0;}}, {rootMargin:'100px'}).observe(scene);
  document.addEventListener('visibilitychange', () => {if (!document.hidden) schedule();});
  updateToggle(); resize();
}
