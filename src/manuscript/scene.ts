import {prepareRichInline,layoutNextRichInlineLineRange,materializeRichInlineLineRange,measureRichInlineStats,type PreparedRichInline,type RichInlineCursor} from '@chenglou/pretext/rich-inline';
import {Dragon,type Range} from './dragon.js';
import {springAxis} from './text-motion.ts';

type Item={text:string; href?:string; target?:string; rel?:string; className?:string};
type Token={item:number; text:string; font:string; width:number};
type Word={node:HTMLSpanElement; token:number; x:number; y:number; vx:number; vy:number; tx:number; ty:number; visible:boolean; initialized:boolean};
type Paragraph={node:HTMLElement; items:Item[]; tokens:Token[]; prepared:PreparedRichInline; groups:HTMLElement[]; words:Map<string,Word>; fontSize:number; lineHeight:number; gap:number; targetTop:number};
type LinkBounds={node:HTMLAnchorElement; left:number; right:number; top:number; bottom:number};

export function subtractRanges(ranges:Range[],exclusion:Range):Range[] {
  return ranges.flatMap(range=>{
    if (exclusion.right<=range.left || exclusion.left>=range.right) return [range];
    const remaining:Range[]=[];
    if (exclusion.left>range.left) remaining.push({left:range.left,right:exclusion.left});
    if (exclusion.right<range.right) remaining.push({left:exclusion.right,right:range.right});
    return remaining;
  });
}
function readItems(node:HTMLElement):Item[] {
  return [...node.childNodes].flatMap(child=>{
    const text=child.textContent ?? '';
    if (!text) return [];
    if (child instanceof HTMLAnchorElement) return [{text,href:child.getAttribute('href') ?? '',target:child.target,rel:child.rel,className:child.className}];
    return [{text}];
  });
}

export async function mountScene():Promise<void> {
  const page=document.querySelector<HTMLElement>('#manuscript-scene');
  const canvas=document.querySelector<HTMLCanvasElement>('#manuscript');
  const ctx=canvas?.getContext('2d');
  if (!page || !canvas || !ctx) return;
  await Promise.all([document.fonts.load('20px "IM Fell English"'),document.fonts.load('italic 23px "IM Fell English"')]);
  const dragon=await Dragon.load();
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const paragraphs=new Map<HTMLElement,Paragraph>();
  const blocks=[...page.children] as HTMLElement[];
  const chart=document.getElementById('github-activity');
  let width=0,left=0,top=0,viewportWidth=0,viewportHeight=0,chartHeight=140;
  let restX=0,restY=0,target:{x:number; y:number} | null=null;
  let frame=0,previousTime=0,lastMove=0,lastScroll=scrollY,dirty=true,firstPaint=true;
  let chartTop=0,chartY=0,chartVelocity=0;
  let linkBounds:LinkBounds[]=[];
  let pointer:{x:number; y:number} | null=null;
  let hoveredLink=false,keyboardFocus=false,pointerHeld=false,selectionActive=false;
  let lastInput:'keyboard' | 'pointer'='keyboard';

  function prepare(node:HTMLElement,items:Item[]) {
    const style=getComputedStyle(node);
    const fontSize=parseFloat(style.fontSize),lineHeight=parseFloat(style.lineHeight),gap=parseFloat(style.marginBottom);
    const tokens:Token[]=[];
    const groups=items.map((item,index)=>{
      const classes=item.className?.split(' ') ?? [];
      const italic=classes.includes('project-title') || classes.includes('person-name');
      const size=classes.includes('project-link') ? fontSize*.85 : fontSize;
      const font=`${italic ? 'italic ' : ''}${size}px "IM Fell English"`;
      const content=item.text.replace(/\s+/g,' ');
      const leading=content.match(/^ +/)?.[0] ?? '';
      if (leading && tokens.length) tokens[tokens.length-1].text+=leading;
      for (const text of content.trimStart().match(/\S+\s*/g) ?? []) {
        const prepared=prepareRichInline([{text,font,break:'never'}]);
        tokens.push({item:index,text,font,width:measureRichInlineStats(prepared,Number.MAX_SAFE_INTEGER).maxLineWidth});
      }
      const group=document.createElement(item.href ? 'a' : 'span');
      group.className='flow-item'+(item.className ? ' '+item.className : '');
      if (group instanceof HTMLAnchorElement) {
        group.classList.add('flow-link');group.href=item.href!;group.target=item.target ?? '';group.rel=item.rel ?? '';
        group.setAttribute('aria-label',item.text);
      }
      return group;
    });
    const prepared=prepareRichInline(tokens.map(token=>({text:token.text,font:token.font,break:token.width>width ? 'normal' as const : 'never' as const})));
    node.replaceChildren(...groups);node.classList.add('flow-ready');
    paragraphs.set(node,{node,items,tokens,prepared,groups,words:new Map(),fontSize,lineHeight,gap,targetTop:0});
  }

  function layout() {
    let blockY=0;
    const currentScroll=scrollY;
    for (const block of blocks) {
      const paragraph=paragraphs.get(block);
      if (!paragraph) {chartTop=blockY;blockY+=chartHeight+28;continue;}
      const {fontSize,lineHeight,gap}=paragraph;
      paragraph.targetTop=blockY;
      for (const word of paragraph.words.values()) word.visible=false;
      let y=0,cursor:RichInlineCursor={itemIndex:0,segmentIndex:0,graphemeIndex:0},done=false;
      for (let attempts=0;attempts<150 && !done;attempts++) {
        const viewportY=top+blockY+y-currentScroll;
        let ranges:Range[]=[{left:0,right:width}];
        for (const exclusion of dragon.exclusions(viewportY,viewportY+lineHeight)) ranges=subtractRanges(ranges,{left:exclusion.left-left,right:exclusion.right-left});
        ranges=ranges.filter(range=>range.right-range.left>=Math.max(fontSize*6,width*.24));
        if (width<450 && ranges.length>1) ranges=[ranges.reduce((largest,range)=>range.right-range.left>largest.right-largest.left ? range : largest)];
        let rowUsed=false;
        for (const range of ranges) {
          const next=layoutNextRichInlineLineRange(paragraph.prepared,range.right-range.left,cursor);
          if (!next) {done=true;break;}
          // A narrow gap must not force a complete word through the dragon.
          if (next.width>range.right-range.left+.5 && range.right-range.left<width-.5) continue;
          const line=materializeRichInlineLineRange(paragraph.prepared,next);
          let x=range.left;
          for (const fragment of line.fragments) {
            const token=paragraph.tokens[fragment.itemIndex];
            const key=`${fragment.itemIndex}:${fragment.start.segmentIndex}:${fragment.start.graphemeIndex}`;
            let word=paragraph.words.get(key);
            if (!word) {
              const node=document.createElement('span');node.className='text-fragment text-word';
              node.dataset.wordId=key;node.style.lineHeight=lineHeight+'px';node.style.height=lineHeight+'px';
              paragraph.groups[token.item].append(node);
              word={node,token:fragment.itemIndex,x:0,y:0,vx:0,vy:0,tx:0,ty:0,visible:true,initialized:false};paragraph.words.set(key,word);
            }
            x+=fragment.gapBefore;
            word.tx=x;word.ty=blockY+y;word.visible=true;
            const text=token.width<=width+.5 ? token.text : fragment.text+(line.end.itemIndex>fragment.itemIndex ? token.text.match(/\s+$/)?.[0] ?? '' : '');
            if (word.node.textContent!==text) word.node.textContent=text;
            x+=fragment.occupiedWidth;
          }
          cursor=line.end;rowUsed=true;
        }
        if (rowUsed || !done) y+=lineHeight;
      }
      paragraph.node.style.height=Math.max(lineHeight,y)+'px';
      blockY+=Math.max(lineHeight,y)+gap;
    }
    lastScroll=currentScroll;dirty=false;
  }

  function paint(seconds:number,frozen:boolean,snap:boolean) {
    let moving=false;
    linkBounds=[];
    for (const paragraph of paragraphs.values()) {
      const bounds=new Map<number,{left:number; right:number; top:number; bottom:number}>();
      for (const word of paragraph.words.values()) {
        word.node.hidden=!word.visible;
        if (!word.visible) continue;
        if (snap || !word.initialized) {word.x=word.tx;word.y=word.ty;word.vx=0;word.vy=0;word.initialized=true;}
        else if (!frozen) {
          const x=springAxis({position:word.x,velocity:word.vx},word.tx,seconds);
          const y=springAxis({position:word.y,velocity:word.vy},word.ty,seconds);
          word.x=x.position;word.vx=x.velocity;word.y=y.position;word.vy=y.velocity;
          if (word.x!==word.tx || word.y!==word.ty) moving=true;
        }
        const token=paragraph.tokens[word.token];
        if (paragraph.groups[token.item] instanceof HTMLAnchorElement) {
          const previous=bounds.get(token.item);
          const right=word.x+token.width;
          bounds.set(token.item,{left:Math.min(previous?.left ?? word.x,word.x),right:Math.max(previous?.right ?? right,right),top:Math.min(previous?.top ?? word.y,word.y),bottom:Math.max(previous?.bottom ?? word.y+paragraph.lineHeight,word.y+paragraph.lineHeight)});
        }
      }
      for (const [index,bound] of bounds) {
        const anchor=paragraph.groups[index] as HTMLAnchorElement;
        anchor.style.transform=`translate(${bound.left.toFixed(3)}px,${(bound.top-paragraph.targetTop).toFixed(3)}px)`;
        anchor.style.width=(bound.right-bound.left)+'px';anchor.style.height=(bound.bottom-bound.top)+'px';
        linkBounds.push({node:anchor,left:left+bound.left,right:left+bound.right,top:top+bound.top-scrollY,bottom:top+bound.bottom-scrollY});
      }
      for (const word of paragraph.words.values()) {
        if (!word.visible) continue;
        const bound=bounds.get(paragraph.tokens[word.token].item);
        word.node.style.transform=`translate(${(word.x-(bound?.left ?? 0)).toFixed(3)}px,${(word.y-(bound?.top ?? paragraph.targetTop)).toFixed(3)}px)`;
      }
    }
    if (chart) {
      if (snap) {chartY=chartTop;chartVelocity=0;}
      else if (!frozen) {
        const next=springAxis({position:chartY,velocity:chartVelocity},chartTop,seconds);
        chartY=next.position;chartVelocity=next.velocity;
        if (chartY!==chartTop) moving=true;
      }
      chart.style.transform=`translateY(${(chartY-chartTop).toFixed(3)}px)`;
    }
    return moving;
  }
  function nearLink(point:{x:number; y:number}) {
    return linkBounds.some(bounds=>point.x>=bounds.left-20 && point.x<=bounds.right+20 && point.y>=bounds.top-12 && point.y<=bounds.bottom+12);
  }
  function render(time:number) {
    frame=0;
    if (document.hidden) return;
    const seconds=Math.min(.04,Math.max(0,(time-previousTime)/1000));previousTime=time;
    const animated=!motion.matches;
    const reading=hoveredLink || keyboardFocus || pointerHeld || selectionActive;
    if (!animated || reading) dragon.hold(time);
    const moved=animated && !reading && dragon.update(time,time-lastMove<2000 ? target : null,restX,restY);
    if (dirty || moved || scrollY!==lastScroll) layout();
    const flowing=paint(seconds,reading,firstPaint || !animated);firstPaint=false;
    ctx!.clearRect(0,0,viewportWidth,viewportHeight);dragon.draw(ctx!,time,animated);
    page!.dataset.ready='true';page!.dataset.interaction=reading ? 'reading' : 'moving';page!.dataset.flowing=String(flowing);
    canvas!.dataset.headX=String(Math.round(dragon.segments[0].x));canvas!.dataset.headY=String(Math.round(dragon.segments[0].y));canvas!.dataset.headAngle=String(dragon.segments[0].angle);
    if (animated || flowing) schedule();
  }
  function schedule() {if (!frame && !document.hidden) frame=requestAnimationFrame(render);}
  function resize() {
    viewportWidth=innerWidth;viewportHeight=innerHeight;width=page!.clientWidth;
    const bounds=page!.getBoundingClientRect();left=bounds.left;top=bounds.top+scrollY;
    const dpr=Math.min(devicePixelRatio || 1,2);
    canvas!.width=Math.round(viewportWidth*dpr);canvas!.height=Math.round(viewportHeight*dpr);canvas!.style.width=viewportWidth+'px';canvas!.style.height=viewportHeight+'px';ctx!.setTransform(dpr,0,0,dpr,0,0);
    const mobile=viewportWidth<=600,scale=mobile ? .38 : .8;
    restX=mobile ? viewportWidth-46 : Math.min(viewportWidth-80,left+width+110);restY=mobile ? 112 : top+46;
    dragon.rest(restX,restY,scale);target=null;
    for (const block of blocks) if (block.classList.contains('flow-copy')) prepare(block,paragraphs.get(block)?.items ?? readItems(block));
    firstPaint=true;dirty=true;schedule();
  }
  document.addEventListener('pointermove',event=>{
    if (event.pointerType!=='mouse') return;
    pointer={x:event.clientX,y:event.clientY};
    hoveredLink=nearLink(pointer) || Boolean((event.target as HTMLElement).closest('a,button,.calendar-scroll'));
    if (!motion.matches && !hoveredLink && !pointerHeld && !selectionActive) {target=pointer;lastMove=performance.now();}
    schedule();
  },{capture:true});
  document.addEventListener('pointerdown',event=>{
    if (event.button!==0) return;
    lastInput='pointer';keyboardFocus=false;
    if ((event.target as HTMLElement).closest('a,button,.flow-copy,.calendar-scroll')) {pointerHeld=true;schedule();return;}
    if (!motion.matches && event.pointerType==='mouse') {dragon.breathe();dirty=true;schedule();}
  },{capture:true});
  document.addEventListener('pointerup',()=>{pointerHeld=false;schedule();},{capture:true});
  document.addEventListener('pointercancel',()=>{pointerHeld=false;schedule();});
  document.addEventListener('selectionchange',()=>{selectionActive=Boolean(window.getSelection() && !window.getSelection()!.isCollapsed);schedule();});
  document.addEventListener('keydown',()=>{lastInput='keyboard';keyboardFocus=Boolean(document.activeElement?.closest('a,button'));schedule();});
  document.addEventListener('focusin',event=>{keyboardFocus=lastInput==='keyboard' && Boolean((event.target as HTMLElement).closest('a,button'));schedule();});
  document.addEventListener('focusout',event=>{keyboardFocus=lastInput==='keyboard' && Boolean(event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest('a,button'));schedule();});
  document.documentElement.addEventListener('pointerleave',()=>{target=null;pointer=null;hoveredLink=false;pointerHeld=false;});
  document.addEventListener('scroll',()=>{dirty=true;schedule();},{passive:true});
  document.addEventListener('visibilitychange',()=>{previousTime=performance.now();if (!document.hidden) schedule();});
  motion.addEventListener('change',()=>{dragon.stopFire();dirty=true;page!.dataset.paused=String(motion.matches);schedule();});
  document.addEventListener('flow-content-changed',event=>{
    const node=document.getElementById((event as CustomEvent<string>).detail);
    if (node && node.classList.contains('flow-copy')) {prepare(node,readItems(node));dirty=true;schedule();}
  });
  new ResizeObserver(()=>{if (page.clientWidth!==width) resize();}).observe(page);
  if (chart) new ResizeObserver(entries=>{chartHeight=entries[0].borderBoxSize[0]?.blockSize ?? entries[0].contentRect.height;dirty=true;schedule();}).observe(chart);
  window.addEventListener('resize',resize);page.dataset.paused=String(motion.matches);resize();
}
