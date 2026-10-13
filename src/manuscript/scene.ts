// Canvas composition adapted from Illustrated Manuscript (ISC).
// The portfolio below this surface uses ordinary browser layout and links.
import {prepareWithSegments, layoutNextLine} from '@chenglou/pretext';
import {STORY_TEXT} from './reference/story.js';
import {BG_COLOR, TEXT_COLOR, MOUSE_IDLE_TIMEOUT, getResponsiveLayout, getPageOffset, getPageScale} from './reference/config.js';
import {loadDragonSprites, createDragon, updateDragonScale, updateDragon, getDragonExclusions, getFireExclusions, getFireInfluence, spawnFire, hasActiveFire, updateFire, drawDragon, drawFire} from './reference/dragon.js';

type Range = {left:number; right:number};
type Line = {text:string; x:number; y:number};

export function subtractRanges(ranges:Range[], exclusion:Range):Range[] {
  return ranges.flatMap(range => {
    if (exclusion.right<=range.left || exclusion.left>=range.right) return [range];
    const remaining:Range[]=[];
    if (exclusion.left>range.left) remaining.push({left:range.left,right:exclusion.left});
    if (exclusion.right<range.right) remaining.push({left:exclusion.right,right:range.right});
    return remaining;
  });
}

export async function mountScene():Promise<void> {
  const surface=document.querySelector<HTMLElement>('#manuscript-scene');
  const canvas=document.querySelector<HTMLCanvasElement>('#manuscript');
  const ctx=canvas?.getContext('2d',{alpha:false});
  if (!surface || !canvas || !ctx) return;
  const dropCap=new Image();
  dropCap.src='/manuscript/dropcap.webp';
  await Promise.all([document.fonts.load('21px "Furia"'), loadDragonSprites(), dropCap.decode()]);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let width=surface.clientWidth, height=surface.clientHeight;
  let layout=getResponsiveLayout(width,height);
  let offset=getPageOffset(layout,width,height);
  let scale=getPageScale(width);
  let prepared=prepareWithSegments(STORY_TEXT.slice(1),layout.font);
  let lines:Line[]=[];
  let dirty=true, frame=0, frames=0, visible=true;
  let mouse={x:0,y:0}, lastMove=-Infinity, held=false;
  let bounds=surface.getBoundingClientRect();
  const glyphWidths=new Map<string,number>();
  const dragon=createDragon(0,0,scale);

  function dropCapSize() {
    const height=layout.lineHeight*7;
    const drawWidth=dropCap.naturalWidth*height/dropCap.naturalHeight;
    return {width:drawWidth+12,height,drawWidth};
  }
  function restPosition() {
    return {x:offset.x+layout.margin+dropCapSize().width*.8,y:offset.y+layout.margin-70*scale};
  }
  function placeDragon() {
    const rest=restPosition();
    dragon.segments.forEach((segment,index)=>{
      segment.angle=-(index/19)*(Math.PI/2)*1.4;
      const previous=dragon.segments[index-1];
      segment.x=previous ? previous.x-Math.cos(segment.angle)*30*scale : rest.x;
      segment.y=previous ? previous.y-Math.sin(segment.angle)*30*scale : rest.y-2;
    });
  }
  function resize() {
    const nextWidth=surface!.clientWidth, nextHeight=surface!.clientHeight;
    const changed=nextWidth!==width;
    width=nextWidth; height=nextHeight; bounds=surface!.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio || 1,2);
    canvas!.width=Math.round(width*dpr); canvas!.height=Math.round(height*dpr);
    ctx!.setTransform(dpr,0,0,dpr,0,0);
    layout=getResponsiveLayout(width,height); offset=getPageOffset(layout,width,height);
    scale=getPageScale(width); updateDragonScale(dragon,scale);
    prepared=prepareWithSegments(STORY_TEXT.slice(1),layout.font); glyphWidths.clear();
    if (changed) placeDragon();
    dirty=true; schedule();
  }
  function layoutText() {
    lines=[];
    const cap=dropCapSize();
    let cursor={segmentIndex:0,graphemeIndex:0};
    const baselineOffset=(layout.lineHeight-layout.fontSize*.857)/2;
    for (let y=layout.margin;y+layout.lineHeight<=layout.pageHeight-layout.margin;y+=layout.lineHeight) {
      let ranges:Range[]=[{left:layout.margin,right:layout.pageWidth-layout.margin}];
      if (y<layout.margin-4+cap.height) ranges=subtractRanges(ranges,{left:layout.margin-4,right:layout.margin-4+cap.width});
      const top=y+offset.y,bottom=top+layout.lineHeight;
      for (const exclusion of [...getDragonExclusions(dragon,top,bottom,10),...getFireExclusions(dragon,top,bottom,6)]) {
        ranges=subtractRanges(ranges,{left:exclusion.left-offset.x,right:exclusion.right-offset.x});
      }
      for (const range of ranges.filter(range=>range.right-range.left>=40)) {
        const line=layoutNextLine(prepared,cursor,range.right-range.left);
        if (!line) {dirty=false;return;}
        lines.push({text:line.text,x:range.left,y:y+baselineOffset});cursor=line.end;
      }
    }
    dirty=false;
  }
  function drawText() {
    ctx!.save(); ctx!.translate(offset.x,offset.y); ctx!.font=layout.font; ctx!.textBaseline='top';
    const cap=dropCapSize();
    ctx!.drawImage(dropCap,layout.margin,layout.margin,cap.drawWidth,cap.height);
    for (const line of lines) {
      if (!hasActiveFire(dragon)) {ctx!.fillStyle=TEXT_COLOR;ctx!.fillText(line.text,Math.round(line.x),Math.round(line.y));continue;}
      let x=line.x;
      const halfAscent=layout.fontSize*.857/2;
      for (const char of line.text) {
        let charWidth=glyphWidths.get(char);
        if (charWidth===undefined) {charWidth=ctx!.measureText(char).width;glyphWidths.set(char,charWidth);}
        const influence=getFireInfluence(dragon,x+charWidth/2+offset.x,line.y+halfAscent+offset.y);
        const strength=influence.strength;
        if (strength<.01) {ctx!.fillStyle=TEXT_COLOR;ctx!.fillText(char,x,line.y);}
        else {
          ctx!.save();
          ctx!.translate(x+charWidth/2+influence.dx*strength*45,line.y+halfAscent+influence.dy*strength*45);
          ctx!.rotate(strength*(influence.dx>0 ? 1 : -1)*1.2);
          ctx!.globalAlpha=Math.max(0,1-strength*.8);
          ctx!.fillStyle=`rgb(${Math.round(42+strength*200)},${Math.round(26+strength*80)},10)`;
          ctx!.fillText(char,-charWidth/2,-halfAscent);ctx!.restore();
        }
        x+=charWidth;
      }
    }
    ctx!.restore();
  }
  function render(time:number) {
    frame=0;
    if (!visible || document.hidden) return;
    const animated=!motion.matches;
    const rest=restPosition();
    const moved=animated && updateDragon(dragon,time,mouse.x,mouse.y,time-lastMove>MOUSE_IDLE_TIMEOUT,rest.x,rest.y);
    // Keep the reference's sustained breath without unbounded particle work.
    if (animated && held && dragon.fire.length<180) spawnFire(dragon);
    const fire=hasActiveFire(dragon);
    if (fire) updateFire(dragon,time);
    if (dirty || moved || fire) layoutText();
    ctx!.fillStyle=BG_COLOR;ctx!.fillRect(0,0,width,height);
    drawText();drawFire(ctx,dragon);drawDragon(ctx,dragon,animated);
    surface!.dataset.ready='true';
    canvas!.dataset.frame=String(++frames);canvas!.dataset.headX=String(Math.round(dragon.segments[0].x));
    canvas!.dataset.headY=String(Math.round(dragon.segments[0].y));canvas!.dataset.fireCount=String(dragon.fire.length);
    if (animated) schedule();
  }
  function schedule() {if (!frame && visible && !document.hidden) frame=requestAnimationFrame(render);}
  function release() {held=false;}
  function point(event:PointerEvent) {
    if (motion.matches) return;
    mouse={x:Math.max(0,Math.min(width,event.clientX-bounds.left)),y:Math.max(0,Math.min(height,event.clientY-bounds.top))};
    lastMove=performance.now();schedule();
  }
  canvas.addEventListener('pointermove',point);
  canvas.addEventListener('pointerdown',event=>{
    if (event.button!==0 || motion.matches) return;
    point(event);held=true;
    if (event.pointerType==='touch') canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointerleave',()=>{release();lastMove=-Infinity;});
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  window.addEventListener('pointerup',release);
  window.addEventListener('blur',release);
  window.addEventListener('scroll',()=>{bounds=surface.getBoundingClientRect();},{passive:true});
  document.addEventListener('visibilitychange',()=>{release();if (!document.hidden) schedule();});
  motion.addEventListener('change',()=>{
    release();dragon.fire=[];placeDragon();dirty=true;
    surface.dataset.paused=String(motion.matches);surface.dataset.running=String(visible && !motion.matches);schedule();
  });
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;surface.dataset.running=String(visible && !motion.matches);
    if (visible) schedule();
    else {release();dragon.fire=[];lastMove=-Infinity;if (frame) cancelAnimationFrame(frame);frame=0;}
  }).observe(surface);
  new ResizeObserver(resize).observe(surface);
  surface.dataset.paused=String(motion.matches);
  placeDragon();resize();
}
