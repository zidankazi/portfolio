import {getDragonBounds,drawDragon,drawFire} from './reference/dragon.js';
import type {createDragon} from './reference/dragon.js';
import {angleDifference,followDragonBody} from './rig-motion.ts';

type Dragon=ReturnType<typeof createDragon>;
const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=(value:number)=>value*value*(3-2*value);

// One live dragon keeps following the cursor. The project glass softens only
// the parts behind its surface; scrolling never sends it to a scripted pose.
export function mountDragonLayer(dragon:Dragon,onChange:()=>void) {
  const hero=document.querySelector<HTMLElement>('#manuscript-scene')!;
  const portfolio=document.querySelector<HTMLElement>('#portfolio')!;
  const glass=document.querySelector<HTMLElement>('.portfolio-glass')!;
  const canvas=document.createElement('canvas');canvas.id='project-dragon';
  canvas.className='margin-dragon';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d')!;
  const ink=document.createElement('canvas'),drawing=ink.getContext('2d')!;
  ink.id='dragon-ink';
  let width=0,height=0,dpr=0,heroTop=0,heroBottom=0,lastTime=0,frames=0;
  let goal=0,progress=0,enabled=false,visible=true,settled=false;
  let sheet={left:0,right:0,top:0,bottom:0,width:0,height:0};
  let pointer:{x:number;y:number} | null=null;
  let painted:{left:number;right:number;top:number;bottom:number} | null=null;
  let paintedHeroTop:number | null=null;

  function restore() {progress=goal;lastTime=0;paintedHeroTop=null;}
  function sync() {
    const nextDpr=Math.min(devicePixelRatio || 1,2);
    if(width!==innerWidth || height!==innerHeight || dpr!==nextDpr) {
      width=innerWidth;height=innerHeight;dpr=nextDpr;
      canvas.width=ink.width=Math.round(width*dpr);canvas.height=ink.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);drawing.setTransform(dpr,0,0,dpr,0,0);painted=null;
    }
    const box=hero.getBoundingClientRect();heroTop=box.top;heroBottom=box.bottom;
    // Narrow layouts have one continuous sheet: retain their opening behavior
    // and let that illustration leave with the intro, without a second scene.
    enabled=width>=1100 && height>=400;
    const rect=glass.getBoundingClientRect();
    sheet={left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height};
    goal=enabled ? clamp((height*.98-sheet.top)/(height*.76)) : 0;
    if(goal>.9995) goal=1;else if(goal<.0005) goal=0;
    visible=heroBottom>0 || (enabled && sheet.top<height && sheet.bottom>0);
    if(!visible) {ctx.clearRect(0,0,width,height);painted=null;canvas.dataset.visible='false';canvas.dataset.mode='hidden';}
    onChange();
  }
  function update(time:number,animated:boolean):boolean {
    const dt=Math.max(0,Math.min(48,lastTime ? time-lastTime : 16));lastTime=time;
    if(!enabled) return false;
    const phaseAlpha=animated ? 1-Math.exp(-dt/240) : 1;
    progress+=(goal-progress)*phaseAlpha;
    if(Math.abs(goal-progress)<.0005) progress=goal;
    const travel=smooth(progress),head=dragon.segments[0];
    // The opening retains its document position. Once projects take over,
    // compensate for scrolling so the dragon keeps swimming around the cursor.
    const scrollShift=(heroTop-(paintedHeroTop ?? heroTop))*travel;
    for(const segment of dragon.segments) segment.y+=heroTop-scrollShift;
    const cursor=pointer ?? (progress ? {x:width*.62,y:height*.45} : {x:head.x,y:head.y});
    const x=cursor.x;
    let y=cursor.y;
    const bounds=getDragonBounds(dragon);
    const bottomLimit=progress ? height : Math.min(height,heroBottom);
    y=Math.min(y,bottomLimit-16-bounds.bottom+head.y);
    const positionAlpha=animated ? 1-Math.exp(-dt/100) : 1;
    const angleAlpha=animated ? 1-Math.exp(-dt/140) : 1;
    const aim=pointer && Math.hypot(cursor.x-head.x,cursor.y-head.y)>4 ? Math.atan2(cursor.y-head.y,cursor.x-head.x) : head.angle;
    const turn=angleDifference(aim,head.angle);
    const maxTurn=animated ? dt*.006 : Infinity;
    head.angle+=clamp(turn*angleAlpha,-maxTurn,maxTurn);
    const distance=Math.hypot(x-head.x,y-head.y);
    const headAlpha=distance ? Math.min(positionAlpha,(animated ? dt*1.5 : Infinity)/distance) : 0;
    head.x+=(x-head.x)*headAlpha;head.y+=(y-head.y)*headAlpha;
    const bodyMovement=followDragonBody(dragon,!pointer,angleAlpha,maxTurn);
    const overflow=Math.max(0,getDragonBounds(dragon).bottom-bottomLimit+16);
    for(const segment of dragon.segments) segment.y-=overflow+heroTop;
    settled=progress===goal && distance*headAlpha<.5 && Math.abs(turn)<.002 && bodyMovement<.05;
    if(animated && time-dragon.lastStepTime>=dragon.stepInterval) {dragon.lastStepTime=time;dragon.jitterSeed=Math.random()*1000;}
    return Math.abs(heroTop-(paintedHeroTop ?? heroTop))>.01 || distance*headAlpha>.01 || Math.abs(turn*angleAlpha)>.0001 || bodyMovement>.01;
  }
  function draw(animated:boolean) {
    const local=getDragonBounds(dragon);
    const bounds={...local,top:local.top+heroTop,bottom:local.bottom+heroTop};
    const behindGlass=enabled && progress>0;
    const ghostOpacity=.24;
    const shown=visible;
    const inkBounds={...bounds};
    for(const particle of dragon.fire) {
      const radius=particle.size*2,y=particle.y+heroTop;
      inkBounds.left=Math.min(inkBounds.left,particle.x-radius);inkBounds.right=Math.max(inkBounds.right,particle.x+radius);
      inkBounds.top=Math.min(inkBounds.top,y-radius);inkBounds.bottom=Math.max(inkBounds.bottom,y+radius);
    }
    const left=Math.max(0,Math.min(painted?.left ?? inkBounds.left,inkBounds.left)-20);
    const top=Math.max(0,Math.min(painted?.top ?? inkBounds.top,inkBounds.top)-20);
    const right=Math.min(width,Math.max(painted?.right ?? inkBounds.right,inkBounds.right)+20);
    const bottom=Math.min(height,Math.max(painted?.bottom ?? inkBounds.bottom,inkBounds.bottom)+20);
    if(right>left && bottom>top) ctx.clearRect(left,top,right-left,bottom-top);
    painted=inkBounds;
    if(shown) {
      if(behindGlass) {
        // Composite one drawing twice: sharp in front, soft and faint beneath
        // the rounded glass. Blur only the occupied area, rather than filtering
        // a viewport of empty pixels every frame. Text stays on its native layer.
        const x=Math.max(0,Math.floor(inkBounds.left-20)),y=Math.max(0,Math.floor(inkBounds.top-20));
        const w=Math.min(width,Math.ceil(inkBounds.right+20))-x,h=Math.min(height,Math.ceil(inkBounds.bottom+20))-y;
        if(w>0 && h>0) drawing.clearRect(x,y,w,h);
        drawing.save();drawing.translate(0,heroTop);drawFire(drawing,dragon);drawDragon(drawing,dragon,animated);drawing.restore();
        if(w>0 && h>0) {
          const composite=()=>ctx.drawImage(ink,x*dpr,y*dpr,w*dpr,h*dpr,x,y,w,h);
          ctx.save();
          ctx.beginPath();ctx.rect(0,0,width,height);ctx.roundRect(sheet.left,sheet.top,sheet.width,sheet.height,20);ctx.clip('evenodd');
          composite();ctx.restore();
          ctx.save();ctx.beginPath();ctx.roundRect(sheet.left,sheet.top,sheet.width,sheet.height,20);ctx.clip();
          ctx.filter='blur(5px)';ctx.globalAlpha=ghostOpacity;composite();ctx.restore();
        }
      } else {
        ctx.save();ctx.translate(0,heroTop);drawFire(ctx,dragon);drawDragon(ctx,dragon,animated);ctx.restore();
      }
    }
    canvas.dataset.visible=String(shown);
    canvas.dataset.mode=!shown ? 'hidden' : behindGlass ? 'glass' : 'hero';
    canvas.dataset.drawnMode=canvas.dataset.mode;
    canvas.dataset.bounds=JSON.stringify(bounds);canvas.dataset.head=JSON.stringify({x:dragon.segments[0].x,y:dragon.segments[0].y+heroTop,angle:dragon.segments[0].angle});
    canvas.dataset.scale=String(dragon.scale);canvas.dataset.frame=String(++frames);
    canvas.dataset.progress=String(goal);canvas.dataset.renderedProgress=String(progress);
    canvas.dataset.ghostOpacity=String(behindGlass ? ghostOpacity : 0);
    canvas.dataset.drawnScroll=String(window.scrollY);canvas.dataset.paused=String(!animated);
    canvas.dataset.fireCount=String(dragon.fire.length);canvas.dataset.settled=String(settled);
    paintedHeroTop=heroTop;
  }
  window.addEventListener('scroll',sync,{passive:true});window.addEventListener('resize',sync);
  window.addEventListener('pointermove',event=>{
    if(event.clientX<0 || event.clientX>width || event.clientY<0 || event.clientY>height) return;
    if(canvas.dataset.paused==='true') return;
    pointer={x:event.clientX,y:event.clientY};if(enabled) onChange();
  },{passive:true});
  const observer=new ResizeObserver(sync);observer.observe(portfolio);observer.observe(hero);
  sync();
  return {canvas,sync,update,draw,restore,get active(){return enabled;},get fireAllowed(){return enabled && visible;},get visible(){return visible;}};
}
