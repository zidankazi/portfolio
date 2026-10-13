import {prepareRichInline, layoutNextRichInlineLineRange, materializeRichInlineLineRange, type PreparedRichInline, type RichInlineCursor} from '@chenglou/pretext/rich-inline';
import {Dragon, type Range} from './dragon.js';

type Item = {text: string; href?: string; target?: string; rel?: string; className?: string};
type Paragraph = {
  node: HTMLElement;
  items: Item[];
  prepared: PreparedRichInline;
  groups: HTMLElement[];
  fragments: Map<number, HTMLElement[]>;
  fontSize: number;
  lineHeight: number;
  gap: number;
};

export function subtractRanges(ranges: Range[], exclusion: Range): Range[] {
  return ranges.flatMap(range => {
    if (exclusion.right <= range.left || exclusion.left >= range.right) return [range];
    const remaining: Range[] = [];
    if (exclusion.left > range.left) remaining.push({left: range.left, right: exclusion.left});
    if (exclusion.right < range.right) remaining.push({left: exclusion.right, right: range.right});
    return remaining;
  });
}

function readItems(node: HTMLElement): Item[] {
  return [...node.childNodes].flatMap(child => {
    if (child instanceof HTMLElement && child.hasAttribute('data-ignore-flow')) return [];
    const text=child.textContent ?? '';
    if (!text) return [];
    if (child instanceof HTMLAnchorElement) return [{text,href:child.getAttribute('href') ?? '',target:child.target,rel:child.rel,className:child.className}];
    return [{text}];
  });
}

export async function mountScene(): Promise<void> {
  const page=document.querySelector<HTMLElement>('#manuscript-scene');
  const canvas=document.querySelector<HTMLCanvasElement>('#manuscript');
  const ctx=canvas?.getContext('2d');
  if (!page || !canvas || !ctx) return;
  await Promise.all([document.fonts.load('20px "IM Fell English"'),document.fonts.load('italic 24px "IM Fell English"')]);
  const dragon=await Dragon.load();
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const coarse=matchMedia('(pointer: coarse)');
  const paragraphs=new Map<HTMLElement, Paragraph>();
  const blocks=[...page.children] as HTMLElement[];
  let width=0, left=0, top=0;
  let viewportWidth=0, viewportHeight=0, chartHeight=140;
  let restX=0, restY=0;
  let target: {x:number; y:number} | null=null;
  let lastMove=0, frame=0, lastScroll=scrollY;
  let dirty=true;
  let hoveredLink=false, keyboardFocus=false, selecting=false, selectionActive=false;
  let lastInput:'keyboard' | 'pointer'='keyboard';

  function prepare(node: HTMLElement, items: Item[]) {
    const style=getComputedStyle(node);
    const fontSize=parseFloat(style.fontSize);
    const lineHeight=parseFloat(style.lineHeight);
    const gap=parseFloat(style.marginBottom);
    const prepared=prepareRichInline(items.map(item=>{
      const classes=item.className?.split(' ') ?? [];
      const italic=classes.includes('project-title') || classes.includes('person-name');
      const size=classes.includes('project-link') ? fontSize*.85 : fontSize;
      return {text:item.text,font:`${italic ? 'italic ' : ''}${size}px "IM Fell English"`};
    }));
    node.replaceChildren();
    const groups=items.map(()=>{const group=document.createElement('span'); group.className='flow-item'; node.append(group); return group;});
    paragraphs.set(node,{node,items,prepared,groups,fragments:new Map(),fontSize,lineHeight,gap});
    node.classList.add('flow-ready');
  }

  function layout() {
    let blockY=0;
    const currentScroll=scrollY;
    for (const block of blocks) {
      const paragraph=paragraphs.get(block);
      if (!paragraph) {blockY+=chartHeight+28; continue;}
      const {fontSize,lineHeight,gap}=paragraph;
      let y=0;
      let cursor: RichInlineCursor={itemIndex:0,segmentIndex:0,graphemeIndex:0};
      const used=new Map<number,number>();
      let done=false;
      for (let attempts=0; attempts<120 && !done; attempts++) {
        const viewportY=top+blockY+y-currentScroll;
        let ranges: Range[]=[{left:0,right:width}];
        for (const exclusion of dragon.exclusions(viewportY,viewportY+lineHeight)) ranges=subtractRanges(ranges,{left:exclusion.left-left,right:exclusion.right-left});
        ranges=ranges.filter(range=>range.right-range.left >= Math.max(fontSize*6,width*.24));
        if (width<450 && ranges.length>1) ranges=[ranges.reduce((largest,range)=>range.right-range.left>largest.right-largest.left ? range : largest)];
        let rowUsed=false;
        for (const range of ranges) {
          const next=layoutNextRichInlineLineRange(paragraph.prepared,range.right-range.left,cursor);
          if (!next) {done=true; break;}
          const line=materializeRichInlineLineRange(paragraph.prepared,next);
          let x=range.left;
          for (const fragment of line.fragments) {
            const item=paragraph.items[fragment.itemIndex];
            const index=used.get(fragment.itemIndex) ?? 0;
            const pool=paragraph.fragments.get(fragment.itemIndex) ?? [];
            let node=pool[index];
            if (!node) {
              node=document.createElement(item.href ? 'a' : 'span');
              if (node instanceof HTMLAnchorElement) {
                node.href=item.href!; node.target=item.target ?? ''; node.rel=item.rel ?? '';
                node.tabIndex=index===0 ? 0 : -1;
                node.setAttribute('aria-label',item.text);
              }
              node.className='text-fragment'+(item.className ? ' '+item.className : '');
              pool.push(node); paragraph.fragments.set(fragment.itemIndex,pool); paragraph.groups[fragment.itemIndex].append(node);
            }
            node.hidden=false;
            if (node.textContent !== fragment.text) node.textContent=fragment.text;
            x+=fragment.gapBefore;
            node.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;
            node.style.height=lineHeight+'px';
            node.style.lineHeight=lineHeight+'px';
            x+=fragment.occupiedWidth;
            used.set(fragment.itemIndex,index+1);
          }
          cursor=line.end; rowUsed=true;
        }
        if (rowUsed || !done) y+=lineHeight;
      }
      for (const [itemIndex,pool] of paragraph.fragments) pool.forEach((node,index)=>{node.hidden=index >= (used.get(itemIndex) ?? 0);});
      paragraph.node.style.height=Math.max(lineHeight,y)+'px';
      blockY+=Math.max(lineHeight,y)+gap;
    }
    page!.dataset.ready='true';
    lastScroll=currentScroll;
    dirty=false;
  }

  function render(time:number) {
    frame=0;
    if (document.hidden) return;
    const animated=!motion.matches;
    const reading=hoveredLink || keyboardFocus || selecting || selectionActive;
    if (!animated || reading) dragon.hold(time);
    const moved=animated && !reading && dragon.update(time,time-lastMove<1600 ? target : null,restX,restY);
    page!.dataset.interaction=reading ? 'reading' : 'moving';
    ctx!.clearRect(0,0,viewportWidth,viewportHeight);
    if (dirty || moved || scrollY!==lastScroll) layout();
    dragon.draw(ctx!,time,animated);
    // Expose only geometry for verification; rendering still belongs to this module.
    canvas!.dataset.headX=String(Math.round(dragon.segments[0].x));
    canvas!.dataset.headY=String(Math.round(dragon.segments[0].y));
    if (animated) schedule();
  }
  function schedule() {if (!frame && !document.hidden) frame=requestAnimationFrame(render);}
  function resize() {
    viewportWidth=innerWidth; viewportHeight=innerHeight;
    width=page!.clientWidth;
    const bounds=page!.getBoundingClientRect(); left=bounds.left; top=bounds.top+scrollY;
    const dpr=Math.min(devicePixelRatio || 1,2);
    canvas!.width=Math.round(viewportWidth*dpr); canvas!.height=Math.round(viewportHeight*dpr);
    canvas!.style.width=viewportWidth+'px'; canvas!.style.height=viewportHeight+'px';
    ctx!.setTransform(dpr,0,0,dpr,0,0);
    const scale=viewportWidth<600 ? .38 : .8;
    restX=viewportWidth<600 ? viewportWidth-46 : Math.min(viewportWidth-80,left+width+110);
    restY=viewportWidth<600 ? 112 : top+46;
    dragon.rest(restX,restY,scale); target=null;
    for (const block of blocks) {
      if (!block.classList.contains('flow-copy')) continue;
      const items=paragraphs.get(block)?.items ?? readItems(block);
      prepare(block,items);
    }
    dirty=true; schedule();
  }

  document.addEventListener('pointermove',event=>{
    if (motion.matches || event.pointerType!=='mouse') return;
    hoveredLink=Boolean((event.target as HTMLElement).closest('a,button,.calendar-scroll'));
    if (!hoveredLink && !selecting) {target={x:event.clientX,y:event.clientY}; lastMove=performance.now();}
    schedule();
  });
  document.addEventListener('pointerdown',event=>{
    if (motion.matches || event.button!==0 || event.pointerType!=='mouse') return;
    lastInput='pointer'; keyboardFocus=false;
    if ((event.target as HTMLElement).closest('a,button,.flow-copy,.calendar-scroll')) {selecting=true; schedule(); return;}
    dragon.breathe(); dirty=true; schedule();
  });
  document.addEventListener('pointerup',()=>{selecting=false; schedule();});
  document.addEventListener('selectionchange',()=>{selectionActive=!window.getSelection()?.isCollapsed; schedule();});
  document.addEventListener('keydown',()=>{lastInput='keyboard'; keyboardFocus=Boolean(document.activeElement?.closest('a,button')); schedule();});
  document.addEventListener('focusin',event=>{keyboardFocus=lastInput==='keyboard' && Boolean((event.target as HTMLElement).closest('a,button')); schedule();});
  document.addEventListener('focusout',event=>{keyboardFocus=Boolean(event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest('a,button')); schedule();});
  document.documentElement.addEventListener('pointerleave',()=>{target=null; hoveredLink=false; selecting=false;});
  document.addEventListener('scroll',()=>{dirty=true; schedule();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if (!document.hidden) schedule();});
  motion.addEventListener('change',()=>{dragon.stopFire(); dirty=true; page!.dataset.paused=String(motion.matches); schedule();});
  document.addEventListener('flow-content-changed',event=>{
    const id=(event as CustomEvent<string>).detail;
    const node=document.getElementById(id);
    if (node && node.classList.contains('flow-copy')) {prepare(node,readItems(node)); dirty=true; schedule();}
  });
  new ResizeObserver(()=>{if (page.clientWidth!==width) resize();}).observe(page);
  const chart=document.getElementById('github-activity');
  if (chart) new ResizeObserver(entries=>{chartHeight=entries[0].borderBoxSize[0]?.blockSize ?? entries[0].contentRect.height; dirty=true; schedule();}).observe(chart);
  window.addEventListener('resize',resize);
  // Touch scrolls the page naturally; the dragon stays in the margin.
  coarse.addEventListener('change',()=>{target=null; dirty=true; schedule();});
  page.dataset.paused=String(motion.matches);
  resize();
}
