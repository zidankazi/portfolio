import {getRestPose,updateDragonScale,getDragonBounds,drawDragon,drawFire} from './reference/dragon.js';
import type {createDragon} from './reference/dragon.js';
import {angleDifference,followDragonBody} from './rig-motion.ts';

type Pose={x:number;y:number;angle:number};
type Dragon=ReturnType<typeof createDragon>;

// One shared dragon is painted on a persistent overlay, from the hero into its gutter.
export function mountMarginDragon(dragon:Dragon,onChange:()=>void) {
  const hero=document.querySelector<HTMLElement>('#manuscript-scene')!;
  const projects=document.querySelector<HTMLElement>('#projects')!;
  const heading=document.querySelector<HTMLElement>('#projects-heading')!;
  const portfolio=document.querySelector<HTMLElement>('#portfolio')!;
  const canvas=document.createElement('canvas');canvas.id='project-dragon';
  canvas.className='margin-dragon';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d')!;
  const rest=getRestPose(0,0,1);
  const natural=getDragonBounds({...dragon,scale:1,segments:rest});
  // Reserve room for a straight, turning dragon once, rather than resizing on every turn.
  let turningSpan=0;
  for(let step=0;step<24;step++) {
    const angle=step*Math.PI/12;
    const poses=rest.map((pose,index)=>({...pose,x:-index*30*Math.cos(angle),y:-index*30*Math.sin(angle),angle}));
    const bounds=getDragonBounds({...dragon,scale:1,segments:poses});
    turningSpan=Math.max(turningSpan,bounds.right-bounds.left,bounds.bottom-bounds.top);
  }
  turningSpan*=1.1;
  let width=0,height=0,dpr=0,heroTop=0,goal=0,progress=0,visible=true,frames=0,lastTime=0;
  let columnLeft=0,headingTop=0,heroBottom=0;
  let target:{poses:Pose[];scale:number;bottom:number;right:number} | null=null;
  let snapshot:{original:Pose[];scale:number;anchor:{x:number;y:number}} | null=null;
  let painted:{left:number;right:number;top:number;bottom:number} | null=null;
  let paintedHeroTop:number | null=null;
  let pointer:{x:number;y:number} | null=null;

  function restore() {
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
    const gutter=left-40;
    if(width!==innerWidth || height!==innerHeight || dpr!==nextDpr || canvas.dataset.gutter!==String(left)) {
      width=innerWidth;height=innerHeight;dpr=nextDpr;
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      painted=null;
      ctx.setTransform(dpr,0,0,dpr,0,0);canvas.dataset.gutter=String(left);
      if(gutter>=180 && height>=300) {
        const slotWidth=Math.min(260,gutter),slotHeight=Math.min(400,height*.65);
        const scale=Math.min(.5,(slotWidth-24)/(natural.right-natural.left),(slotHeight-24)/(natural.bottom-natural.top),(left-72)/turningSpan,(height-64)/turningSpan);
        const poses=getRestPose(0,0,scale);
        const box=getDragonBounds({...dragon,scale,segments:poses});
        const x=Math.max(16,(left-24-slotWidth)/2)+(slotWidth-(box.right-box.left))/2-box.left;
        const y=height/2-(box.bottom+box.top)/2;
        target={scale,poses:poses.map(pose=>({...pose,x:pose.x+x,y:pose.y+y})),bottom:box.bottom+y,right:box.right+x};
      } else target=null;
    }
    const heroBox=hero.getBoundingClientRect(),projectBox=projects.getBoundingClientRect();
    heroTop=heroBox.top;
    heroBottom=heroBox.bottom;
    // Keep full size until projects reach the lower screen; settle as they approach reading height.
    const projectPageTop=projectBox.top-heroTop;
    const start=Math.max(0,projectPageTop-height*.9);
    const finish=Math.max(start+200,projectPageTop-height*.32);
    goal=target ? Math.max(0,Math.min(1,(-heroTop-start)/(finish-start))) : 0;
    visible=heroBox.bottom>0 || (!!target && projectBox.bottom>0);
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
    const t=progress*progress*progress*(progress*(progress*6-15)+10);
    const travel=1-(1-t)*(1-t);
    const positionAlpha=animated ? 1-Math.exp(-dt/100) : 1;
    const angleAlpha=animated ? 1-Math.exp(-dt/220) : 1;
    const scaleAlpha=animated ? 1-Math.exp(-dt/160) : 1;
    const wantedScale=snapshot.scale+(target.scale-snapshot.scale)*t;
    const nextScale=dragon.scale+(wantedScale-dragon.scale)*scaleAlpha;
    const scale=Math.abs(nextScale-wantedScale)<.0001 ? wantedScale : nextScale;
    const ratio=scale/dragon.scale,head=dragon.segments[0];
    const previousTop=paintedHeroTop ?? heroTop;
    const scrollShift=(heroTop-previousTop)*(1-travel);
    // One pose stays alive. Convert it to viewport coordinates and resize about its current head.
    const headX=head.x,headY=head.y+previousTop+scrollShift;
    for(const segment of dragon.segments) {
      segment.x=headX+(segment.x-headX)*ratio;
      segment.y=headY+(segment.y+previousTop+scrollShift-headY)*ratio;
    }
    updateDragonScale(dragon,scale);
    const columnEdge=columnLeft-24;
    const room={left:24,right:columnEdge-24,top:32,bottom:height-32};
    const projectedRatio=target.scale/scale;
    const projected=dragon.segments.map(segment=>({...segment,x:head.x+(segment.x-head.x)*projectedRatio,y:head.y+(segment.y-head.y)*projectedRatio}));
    const endBounds=getDragonBounds({...dragon,scale:target.scale,segments:projected});
    const cursor=pointer ?? {x:snapshot.anchor.x,y:snapshot.anchor.y+heroTop};
    const restHead=target.poses[0];
    const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
    const marginX=clamp(pointer ? cursor.x : restHead.x,room.left-endBounds.left+head.x,room.right-endBounds.right+head.x);
    const marginY=clamp(pointer ? cursor.y : restHead.y,room.top-endBounds.top+head.y,room.bottom-endBounds.bottom+head.y);
    let x=cursor.x+(marginX-cursor.x)*travel;
    let y=cursor.y+(marginY-cursor.y)*travel;
    const current=getDragonBounds(dragon);
    if(!progress) y=Math.min(y,height-16-current.bottom+head.y);
    const aboveHeading=progress<1 && headingTop>24;
    if(aboveHeading) {
      const nearText=clamp((x+current.right-head.x-columnEdge+96)/96,0,1);
      const influence=nearText*nearText*(3-2*nearText)*(1-travel);
      y-=Math.max(0,y+current.bottom-head.y-headingTop+120)*influence;
    }
    if(travel>.95 && current.right-current.left<=room.right-room.left && current.bottom-current.top<=room.bottom-room.top) {
      x=clamp(x,room.left-current.left+head.x,room.right-current.right+head.x);
      y=clamp(y,room.top-current.top+head.y,room.bottom-current.bottom+head.y);
    }
    const wantedAngle=pointer && Math.hypot(cursor.x-head.x,cursor.y-head.y)>4 ? Math.atan2(cursor.y-head.y,cursor.x-head.x)
      : pointer ? head.angle : 0;
    const turn=angleDifference(wantedAngle,head.angle);
    const maxTurn=animated ? dt*.006 : Infinity;
    head.angle+=clamp(turn*angleAlpha,-maxTurn,maxTurn);
    const distance=Math.hypot(x-head.x,y-head.y);
    const headAlpha=distance ? Math.min(positionAlpha,(animated ? dt*1.5 : Infinity)/distance) : 0;
    head.x+=(x-head.x)*headAlpha;head.y+=(y-head.y)*headAlpha;
    const bodyMovement=followDragonBody(dragon,!pointer,angleAlpha,maxTurn);
    const actual=getDragonBounds(dragon);
    const fitsRoom=actual.right-actual.left<=room.right-room.left && actual.bottom-actual.top<=room.bottom-room.top;
    const insideRoom=actual.left>=room.left-.25 && actual.right<=room.right+.25 && actual.top>=room.top-.25 && actual.bottom<=room.bottom+.25;
    // Finish only after the live body has arrived, rather than snapping it into the margin.
    if(animated && progress===1 && !insideRoom) progress=.9995;
    let shiftX=0,shiftY=0;
    if(progress===1) {
      shiftX=Math.max(room.left-actual.left,Math.min(0,room.right-actual.right));
      shiftY=Math.max(room.top-actual.top,Math.min(0,room.bottom-actual.bottom));
    } else if(travel>.95 && fitsRoom) {
      const contactSpeed=animated ? dt*.6 : Infinity;
      shiftX=clamp(Math.max(room.left-actual.left,Math.min(0,room.right-actual.right)),-contactSpeed,contactSpeed);
      shiftY=clamp(Math.max(room.top-actual.top,Math.min(0,room.bottom-actual.bottom)),-contactSpeed,contactSpeed);
    } else if(aboveHeading && actual.right>columnEdge) {
      // Ease contact with the heading; a turn must never teleport the entire body upward.
      const overflow=Math.max(0,actual.bottom-headingTop+24);
      shiftY=-Math.min(overflow,animated ? dt*.9 : Infinity);
    }
    for(const segment of dragon.segments) {segment.x+=shiftX;segment.y+=shiftY-heroTop;}
    const settled=progress===goal && Math.hypot(x-head.x,y-head.y-heroTop)<.4
      && Math.abs(wantedScale-scale)<.0001 && Math.abs(turn)<.002 && bodyMovement<.05;
    if(animated && time-dragon.lastStepTime>=dragon.stepInterval) {dragon.lastStepTime=time;dragon.jitterSeed=Math.random()*1000;}
    canvas.dataset.settled=String(settled);
    return Math.abs(heroTop-previousTop)>.01 || Math.abs(ratio-1)>.00001 || distance*headAlpha>.01
      || Math.abs(turn*angleAlpha)>.0001 || bodyMovement>.01 || Math.abs(shiftX)+Math.abs(shiftY)>.01;
  }
  function draw(animated:boolean) {
    const local=getDragonBounds(dragon);
    const bounds={...local,top:local.top+heroTop,bottom:local.bottom+heroTop};
    const fireTop=Math.max(0,heroBottom);
    const ink={...bounds};
    // Include visible flames in the dirty rectangle so fading particles leave no trails.
    if(target && heroTop<0) for(const particle of dragon.fire) {
      const radius=particle.size*2,y=particle.y+heroTop;
      if(particle.x-radius>=width || particle.x+radius<=0 || y+radius<=fireTop || y-radius>=height) continue;
      ink.left=Math.min(ink.left,Math.max(0,particle.x-radius));ink.right=Math.max(ink.right,Math.min(width,particle.x+radius));
      ink.top=Math.min(ink.top,Math.max(fireTop,y-radius));ink.bottom=Math.max(ink.bottom,Math.min(height,y+radius));
    }
    const left=Math.max(0,Math.min(painted?.left ?? ink.left,ink.left)-2);
    const top=Math.max(0,Math.min(painted?.top ?? ink.top,ink.top)-2);
    const right=Math.min(width,Math.max(painted?.right ?? ink.right,ink.right)+2);
    const bottom=Math.min(height,Math.max(painted?.bottom ?? ink.bottom,ink.bottom)+2);
    if(right>left && bottom>top) ctx.clearRect(left,top,right-left,bottom-top);
    painted=ink;
    if(!visible) return;
    if(target && heroTop<0 && fireTop<height) {
      ctx.save();ctx.beginPath();ctx.rect(0,fireTop,width,height-fireTop);ctx.clip();
      ctx.translate(0,heroTop);drawFire(ctx,dragon);ctx.restore();
    }
    ctx.save();
    if(!progress) {ctx.beginPath();ctx.rect(0,0,width,Math.max(0,heroBottom));ctx.clip();}
    ctx.translate(0,heroTop);drawDragon(ctx,dragon,animated);ctx.restore();
    canvas.dataset.bounds=JSON.stringify(bounds);
    canvas.dataset.scale=String(dragon.scale);canvas.dataset.frame=String(++frames);
    canvas.dataset.mode=!visible ? 'hidden' : progress===0 && dragon.scale===snapshot?.scale ? 'hero' : progress===1 && Math.abs(dragon.scale-(target?.scale ?? 0))<.0001 ? 'margin' : 'transition';
    canvas.dataset.drawnMode=canvas.dataset.mode;
    canvas.dataset.drawnScroll=String(-heroTop);
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
  return {canvas,sync,update,draw,restore,get active(){return !!target;},get fireAllowed(){return !!target && visible && heroTop<0;},get visible(){return visible;}};
}
