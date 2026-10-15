import {updateDragonScale,getDragonBounds,drawDragon,drawFire} from './reference/dragon.js';
import type {createDragon} from './reference/dragon.js';
import {angleDifference,followDragonBody,perchDragonBody} from './rig-motion.ts';

type Pose={x:number;y:number;angle:number};
type Dragon=ReturnType<typeof createDragon>;

// One live dragon follows the bio, then rests on the project glass at its original size.
export function mountMarginDragon(dragon:Dragon,onChange:()=>void) {
  const hero=document.querySelector<HTMLElement>('#manuscript-scene')!;
  const projects=document.querySelector<HTMLElement>('#projects')!;
  const heading=document.querySelector<HTMLElement>('#projects-heading')!;
  const portfolio=document.querySelector<HTMLElement>('#portfolio')!;
  const canvas=document.createElement('canvas');canvas.id='project-dragon';
  canvas.className='margin-dragon';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d')!;
  let width=0,height=0,dpr=0,heroTop=0,goal=0,progress=0,visible=true,frames=0,lastTime=0;
  let columnLeft=0,headingTop=0,heroBottom=0;
  let target:{x:number;y:number} | null=null;
  let snapshot:{original:Pose[];scale:number;anchor:{x:number;y:number}} | null=null;
  let painted:{left:number;right:number;top:number;bottom:number} | null=null;
  let paintedHeroTop:number | null=null;
  let pointer:{x:number;y:number} | null=null;

  function restore() {
    dragon.perch=0;
    if(snapshot) {
      updateDragonScale(dragon,snapshot.scale);
      dragon.segments.forEach((segment,index)=>Object.assign(segment,snapshot!.original[index]));
      snapshot=null;
    }
  }
  function sync() {
    const nextDpr=Math.min(devicePixelRatio || 1,2);
    const left=portfolio.getBoundingClientRect().left;
    columnLeft=left;headingTop=heading.getBoundingClientRect().top;
    if(width!==innerWidth || height!==innerHeight || dpr!==nextDpr) {
      width=innerWidth;height=innerHeight;dpr=nextDpr;
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      painted=null;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    const sheet=document.querySelector<HTMLElement>('.portfolio-glass')!.getBoundingClientRect();
    target=width>=1100 && height>=400 ? {x:sheet.right-150*dragon.scale,y:headingTop-346*dragon.scale} : null;
    const heroBox=hero.getBoundingClientRect(),projectBox=projects.getBoundingClientRect();
    heroTop=heroBox.top;heroBottom=heroBox.bottom;
    // Start settling only as the projects enter, while the original bio remains free to flow.
    goal=target ? Math.max(0,Math.min(1,(height*.98-headingTop)/(height*.3))) : 0;
    if(goal>.9995) goal=1;else if(goal<.0005) goal=0;
    visible=heroBox.bottom>0 || (!!target && headingTop>-120 && projectBox.bottom>0);
    canvas.dataset.visible=String(visible);
    canvas.dataset.progress=String(goal);
    onChange();
  }
  function update(time:number,animated:boolean):boolean {
    const dt=Math.max(0,Math.min(48,lastTime ? time-lastTime : 16));lastTime=time;
    const phaseAlpha=animated ? 1-Math.exp(-dt/(goal<progress ? 220 : 140)) : 1;
    progress+=(goal-progress)*phaseAlpha;
    if(Math.abs(goal-progress)<.0005) progress=goal;
    if(!target) {const changed=!!snapshot;restore();return changed;}
    if(!snapshot) {
      const original=dragon.segments.map(({x,y,angle})=>({x,y,angle}));
      snapshot={scale:dragon.scale,original,anchor:{x:original[0].x,y:original[0].y}};
    }
    const travel=progress*progress*progress*(progress*(progress*6-15)+10);
    dragon.perch=travel;
    const positionAlpha=animated ? 1-Math.exp(-dt/(100+travel*100)) : 1;
    const angleAlpha=animated ? 1-Math.exp(-dt/140) : 1;
    const head=dragon.segments[0];
    const previousTop=paintedHeroTop ?? heroTop;
    const scrollShift=heroTop-previousTop;
    const headX=head.x,headY=head.y+previousTop+scrollShift;
    // The perch belongs to the document, so it scrolls with the glass, in both directions.
    for(const segment of dragon.segments) segment.y+=previousTop+scrollShift;
    const cursor=pointer ?? {x:snapshot.anchor.x,y:snapshot.anchor.y+heroTop};
    const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
    const perchX=target.x+(pointer ? clamp((cursor.x-target.x)*.025,-10,10) : 0);
    const perchY=target.y+(pointer ? clamp((cursor.y-target.y)*.015,-5,7) : 0);
    const x=cursor.x+(perchX-cursor.x)*travel;
    let y=cursor.y+(perchY-cursor.y)*travel;
    const current=getDragonBounds(dragon);
    if(!progress) y=Math.min(y,height-16-current.bottom+head.y);
    const aim=pointer && Math.hypot(cursor.x-head.x,cursor.y-head.y)>4 ? Math.atan2(cursor.y-head.y,cursor.x-head.x) : head.angle;
    const glance=pointer ? clamp(aim,-.65,2.3) : .35;
    const wantedAngle=aim+angleDifference(glance,aim)*travel;
    const turn=angleDifference(wantedAngle,head.angle),maxTurn=animated ? dt*.006 : Infinity;
    head.angle+=clamp(turn*angleAlpha,-maxTurn,maxTurn);
    const distance=Math.hypot(x-head.x,y-head.y);
    const headAlpha=distance ? Math.min(positionAlpha,(animated ? dt*1.5 : Infinity)/distance) : 0;
    head.x+=(x-head.x)*headAlpha;head.y+=(y-head.y)*headAlpha;
    const bodyMovement=travel ? perchDragonBody(dragon,travel,angleAlpha,maxTurn)
      : followDragonBody(dragon,!pointer,angleAlpha,maxTurn);
    const actual=getDragonBounds(dragon);
    let shiftY=0;
    if(progress && actual.right>columnLeft-24 && actual.bottom>headingTop-24) {
      shiftY=-Math.min(actual.bottom-headingTop+24,animated ? dt*.6 : Infinity);
    }
    // Cursor following and boundary contact share one travel budget.
    let shiftX=0;
    if(animated) {
      const dx=head.x-headX,dy=head.y-headY+shiftY;
      const movement=Math.hypot(dx,dy),limit=dt*1.5;
      if(movement>limit) {
        shiftX=dx*limit/movement-(head.x-headX);
        shiftY=dy*limit/movement-(head.y-headY);
      }
    }
    for(const segment of dragon.segments) {segment.x+=shiftX;segment.y+=shiftY-heroTop;}
    const settled=progress===goal && Math.hypot(x-head.x,y-head.y-heroTop)<.5
      && Math.abs(turn)<.002 && bodyMovement<.05;
    if(animated && time-dragon.lastStepTime>=dragon.stepInterval) {dragon.lastStepTime=time;dragon.jitterSeed=Math.random()*1000;}
    canvas.dataset.settled=String(settled);
    return Math.abs(heroTop-previousTop)>.01 || distance*headAlpha>.01
      || Math.abs(turn*angleAlpha)>.0001 || bodyMovement>.01 || Math.abs(shiftX)+Math.abs(shiftY)>.01;
  }
  function draw(animated:boolean) {
    const local=getDragonBounds(dragon);
    const bounds={...local,top:local.top+heroTop,bottom:local.bottom+heroTop};
    const ink={...bounds};
    // Include visible flames in the dirty rectangle so fading particles leave no trails.
    for(const particle of dragon.fire) {
      const radius=particle.size*2,y=particle.y+heroTop;
      if(particle.x-radius>=width || particle.x+radius<=0 || y+radius<=0 || y-radius>=height) continue;
      ink.left=Math.min(ink.left,Math.max(0,particle.x-radius));ink.right=Math.max(ink.right,Math.min(width,particle.x+radius));
      ink.top=Math.min(ink.top,Math.max(0,y-radius));ink.bottom=Math.max(ink.bottom,Math.min(height,y+radius));
    }
    const left=Math.max(0,Math.min(painted?.left ?? ink.left,ink.left)-2);
    const top=Math.max(0,Math.min(painted?.top ?? ink.top,ink.top)-2);
    const right=Math.min(width,Math.max(painted?.right ?? ink.right,ink.right)+2);
    const bottom=Math.min(height,Math.max(painted?.bottom ?? ink.bottom,ink.bottom)+2);
    if(right>left && bottom>top) ctx.clearRect(left,top,right-left,bottom-top);
    painted=ink;
    if(!visible) return;
    // Fire shares the dragon's viewport layer, including across the glass boundary.
    ctx.save();ctx.translate(0,heroTop);drawFire(ctx,dragon);ctx.restore();
    ctx.save();
    if(!progress) {ctx.beginPath();ctx.rect(0,0,width,Math.max(0,heroBottom));ctx.clip();}
    ctx.translate(0,heroTop);drawDragon(ctx,dragon,animated);ctx.restore();
    canvas.dataset.bounds=JSON.stringify(bounds);
    canvas.dataset.scale=String(dragon.scale);canvas.dataset.frame=String(++frames);
    canvas.dataset.mode=!visible ? 'hidden' : progress===0 ? 'hero' : progress===1 ? 'perched' : 'transition';
    canvas.dataset.drawnMode=canvas.dataset.mode;
    canvas.dataset.drawnScroll=String(window.scrollY);
    canvas.dataset.paused=String(!animated);
    canvas.dataset.renderedProgress=String(progress);paintedHeroTop=heroTop;
    canvas.dataset.head=JSON.stringify({x:dragon.segments[0].x,y:dragon.segments[0].y+heroTop,angle:dragon.segments[0].angle});
    canvas.dataset.fireCount=String(dragon.fire.length);
    if(!snapshot) canvas.dataset.settled='true';
  }
  window.addEventListener('scroll',sync,{passive:true});
  window.addEventListener('resize',sync);
  window.addEventListener('pointermove',event=>{
    if(event.clientX<0 || event.clientX>width || event.clientY<0 || event.clientY>height) return;
    pointer={x:event.clientX,y:event.clientY};if(snapshot && canvas.dataset.paused!=='true') onChange();
  },{passive:true});
  new ResizeObserver(sync).observe(portfolio);
  sync();
  return {canvas,sync,update,draw,restore,get active(){return !!target;},get fireAllowed(){return !!target && visible;},get visible(){return visible;}};
}
