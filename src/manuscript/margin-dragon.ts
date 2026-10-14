import {getRestPose,updateDragonScale,updateDragon,getDragonBounds,drawDragon} from './reference/dragon.js';
import type {createDragon} from './reference/dragon.js';

type Pose={x:number;y:number;angle:number};
type Dragon=ReturnType<typeof createDragon>;

// One shared dragon is painted on a persistent overlay, from the hero into its gutter.
export function mountMarginDragon(dragon:Dragon,onChange:()=>void) {
  const hero=document.querySelector<HTMLElement>('#manuscript-scene')!;
  const projects=document.querySelector<HTMLElement>('#projects')!;
  const portfolio=document.querySelector<HTMLElement>('#portfolio')!;
  const canvas=document.createElement('canvas');canvas.id='project-dragon';
  canvas.className='margin-dragon';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d')!;
  const rest=getRestPose(0,0,1);
  const natural=getDragonBounds({...dragon,scale:1,segments:rest});
  let width=0,height=0,dpr=0,heroTop=0,goal=0,progress=0,visible=true,frames=0,lastTime=0,lift=0;
  let target:{poses:Pose[];scale:number;bottom:number;right:number} | null=null;
  let snapshot:{poses:Pose[];original:Pose[];scale:number;home:Dragon} | null=null;
  let applied='';
  let painted:{left:number;right:number;top:number;bottom:number} | null=null;
  let paintedHeroTop:number | null=null;
  let pointer:{x:number;y:number} | null=null;
  let follower:Dragon | null=null;
  let following:Pose[]=[];
  let destination:{poses:Pose[];fit:number} | null=null;

  function restore() {
    if(snapshot) {
      updateDragonScale(dragon,snapshot.scale);
      dragon.segments.forEach((segment,index)=>Object.assign(segment,snapshot!.original[index]));
      snapshot=null;
    }
    applied='';
    lift=0;
  }
  function sync() {
    const nextDpr=Math.min(devicePixelRatio || 1,2);
    const left=portfolio.getBoundingClientRect().left;
    const gutter=left-40;
    if(width!==innerWidth || height!==innerHeight || dpr!==nextDpr || canvas.dataset.gutter!==String(left)) {
      width=innerWidth;height=innerHeight;dpr=nextDpr;
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      painted=null;
      ctx.setTransform(dpr,0,0,dpr,0,0);canvas.dataset.gutter=String(left);
      if(gutter>=180 && height>=300) {
        const slotWidth=Math.min(260,gutter),slotHeight=Math.min(400,height*.65);
        const scale=Math.min(.5,(slotWidth-24)/(natural.right-natural.left),(slotHeight-24)/(natural.bottom-natural.top));
        const poses=getRestPose(0,0,scale);
        const box=getDragonBounds({...dragon,scale,segments:poses});
        const x=Math.max(16,(left-24-slotWidth)/2)+(slotWidth-(box.right-box.left))/2-box.left;
        const y=height/2-(box.bottom+box.top)/2;
        target={scale,poses:poses.map(pose=>({...pose,x:pose.x+x,y:pose.y+y})),bottom:box.bottom+y,right:box.right+x};
      } else target=null;
      applied='';
      follower=null;
    }
    const heroBox=hero.getBoundingClientRect(),projectBox=projects.getBoundingClientRect();
    heroTop=heroBox.top;
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
    const alpha=animated ? 1-Math.exp(-dt/(goal<progress ? 220 : 140)) : 1;
    progress+= (goal-progress)*alpha;
    if(Math.abs(goal-progress)<.0005) progress=goal;
    if(!target) {const changed=!!snapshot;restore();return changed;}
    if(!snapshot && !progress && heroTop>=0) return false;
    if(!snapshot) {
      const original=dragon.segments.map(({x,y,angle})=>({x,y,angle}));
      const poses=original.map(pose=>({...pose,y:pose.y+(paintedHeroTop ?? heroTop)}));
      snapshot={scale:dragon.scale,original,poses,home:{...dragon,fire:[],segments:poses.map((pose,index)=>({...dragon.segments[index],...pose}))}};
    }
    let homeMoved=false;
    if(animated && pointer) {
      const home=snapshot.home;
      if(time-home.lastStepTime>=home.stepInterval) {
        const bottomRoom=Math.max(0,getDragonBounds(home).bottom-home.segments[0].y);
        updateDragon(home,time,pointer.x,Math.min(pointer.y,height-16-bottomRoom));
        const overflow=Math.max(0,getDragonBounds(home).bottom-height+16);
        if(overflow) for(const segment of home.segments) segment.y-=overflow;
      }
      snapshot.poses.forEach((pose,index)=>{
        const end=home.segments[index];
        const turn=Math.atan2(Math.sin(end.angle-pose.angle),Math.cos(end.angle-pose.angle));
        if(Math.hypot(end.x-pose.x,end.y-pose.y)>.01 || Math.abs(turn)>.0001) homeMoved=true;
        pose.x+=(end.x-pose.x)*alpha;pose.y+=(end.y-pose.y)*alpha;pose.angle+=turn*alpha;
      });
    }
    if(!follower) {
      follower={...dragon,scale:target.scale,fire:[],segments:target.poses.map((pose,index)=>({...dragon.segments[index],...pose}))};
      updateDragonScale(follower,target.scale);
      following=target.poses.map(pose=>({...pose}));
      destination=null;
    }
    const moved=animated && pointer && updateDragon(follower,time,pointer.x,pointer.y);
    // Fit the moving chain inside the left gutter, including its wings at their widest.
    const room={left:16,right:portfolio.getBoundingClientRect().left-40,top:24,bottom:height-24};
    // Reuse the fit between reference movement steps; only the cheap pose easing runs each frame.
    if(moved || !destination) {
      const box=getDragonBounds(follower);
      const fit=Math.min(1,(room.right-room.left)/(box.right-box.left),(room.bottom-room.top)/(box.bottom-box.top));
      const head=follower.segments[0];
      const poses=follower.segments.map(({x,y,angle})=>({x:head.x+(x-head.x)*fit,y:head.y+(y-head.y)*fit,angle}));
      const fitted=getDragonBounds({...follower,scale:target.scale*fit,segments:poses});
      const dx=Math.max(room.left-fitted.left,Math.min(0,room.right-fitted.right));
      const dy=Math.max(room.top-fitted.top,Math.min(0,room.bottom-fitted.bottom));
      for(const segment of follower.segments) {segment.x+=dx;segment.y+=dy;}
      destination={fit,poses:poses.map(pose=>({...pose,x:pose.x+dx,y:pose.y+dy}))};
    }
    const {fit,poses}=destination;
    let followingMoved=false;
    following.forEach((pose,index)=>{
      const end=poses[index];
      const x=end.x,y=end.y;
      const turn=Math.atan2(Math.sin(end.angle-pose.angle),Math.cos(end.angle-pose.angle));
      if(Math.hypot(x-pose.x,y-pose.y)>.01 || Math.abs(turn)>.0001) followingMoved=true;
      pose.x+=(x-pose.x)*alpha;pose.y+=(y-pose.y)*alpha;pose.angle+=turn*alpha;
    });
    const key=progress+':'+heroTop+':'+width+':'+height+':'+lift+':'+fit;
    if(applied===key && canvas.dataset.settled==='true' && !moved && !followingMoved && !homeMoved) return false;
    applied=key;
    const t=progress*progress*progress*(progress*(progress*6-15)+10);
    const wantedScale=snapshot.scale+(target.scale*fit-snapshot.scale)*t;
    const wanted=dragon.segments.map((segment,index)=>{
      const start=snapshot!.poses[index],end=following[index];
      const turn=Math.atan2(Math.sin(end.angle-start.angle),Math.cos(end.angle-start.angle));
      return {...segment,x:start.x+(end.x-start.x)*t,y:start.y+(end.y-start.y)*t,angle:start.angle+turn*t};
    });
    // Keep a connected chain throughout growth; blending two entire poses stretched its joints.
    for(let index=1;index<wanted.length;index++) {
      const segment=wanted[index],previous=wanted[index-1];
      segment.x=previous.x-Math.cos(segment.angle)*30*wantedScale;
      segment.y=previous.y-Math.sin(segment.angle)*30*wantedScale;
    }
    const bounds=getDragonBounds({...dragon,scale:wantedScale,segments:wanted});
    const projectTop=projects.getBoundingClientRect().top;
    // Correct the destination, then ease toward it. Never shove the painted creature at a boundary.
    const dx=t===1 ? Math.max(room.left+8-bounds.left,Math.min(0,room.right-8-bounds.right)) : 0;
    const dy=t===1 ? Math.max(room.top+8-bounds.top,Math.min(0,room.bottom-8-bounds.bottom)) : 0;
    lift=bounds.right+dx>room.right+16 ? Math.max(0,bounds.bottom+dy-projectTop+48) : 0;
    const head=dragon.segments[0],previousTop=paintedHeroTop ?? heroTop;
    const desiredX=wanted[0].x+dx,desiredY=wanted[0].y+dy-lift;
    const easing=animated ? 1-Math.exp(-dt/170) : 1;
    const nextX=head.x+(desiredX-head.x)*easing;
    const nextY=head.y+previousTop+(desiredY-head.y-previousTop)*easing;
    const nextScale=dragon.scale+(wantedScale-dragon.scale)*easing;
    updateDragonScale(dragon,Math.abs(nextScale-wantedScale)<.0001 ? wantedScale : nextScale);
    let angleError=0;
    dragon.segments.forEach((segment,index)=>{
      const turn=Math.atan2(Math.sin(wanted[index].angle-segment.angle),Math.cos(wanted[index].angle-segment.angle));
      segment.angle+=turn*easing;angleError=Math.max(angleError,Math.abs(turn));
      const previous=dragon.segments[index-1];
      segment.x=previous ? previous.x-Math.cos(segment.angle)*30*dragon.scale : nextX;
      segment.y=previous ? previous.y-Math.sin(segment.angle)*30*dragon.scale : nextY-heroTop;
    });
    const settled=progress===goal && Math.hypot(desiredX-nextX,desiredY-nextY)<.3 && Math.abs(wantedScale-dragon.scale)<.0001 && angleError<.002;
    if(settled && !progress && heroTop>=0) {
      // Cursor tracking takes over from exactly the final painted pose.
      updateDragonScale(dragon,snapshot.scale);dragon.lastStepTime=time;snapshot=null;applied='';
    }
    canvas.dataset.settled=String(settled);
    return true;
  }
  function draw(animated:boolean) {
    const local=getDragonBounds(dragon);
    const bounds={...local,top:local.top+heroTop,bottom:local.bottom+heroTop};
    const left=Math.max(0,Math.min(painted?.left ?? bounds.left,bounds.left)-2);
    const top=Math.max(0,Math.min(painted?.top ?? bounds.top,bounds.top)-2);
    const right=Math.min(width,Math.max(painted?.right ?? bounds.right,bounds.right)+2);
    const bottom=Math.min(height,Math.max(painted?.bottom ?? bounds.bottom,bounds.bottom)+2);
    if(right>left && bottom>top) ctx.clearRect(left,top,right-left,bottom-top);
    painted=bounds;
    if(!visible) return;
    ctx.save();
    if(!snapshot) {ctx.beginPath();ctx.rect(0,0,width,Math.max(0,hero.getBoundingClientRect().bottom));ctx.clip();}
    ctx.translate(0,heroTop);drawDragon(ctx,dragon,animated);ctx.restore();
    canvas.dataset.bounds=JSON.stringify(bounds);
    canvas.dataset.scale=String(dragon.scale);canvas.dataset.frame=String(++frames);
    canvas.dataset.mode=!visible ? 'hidden' : progress===0 && !snapshot ? 'hero' : progress===1 && canvas.dataset.settled==='true' ? 'margin' : 'transition';
    canvas.dataset.drawnMode=canvas.dataset.mode;
    canvas.dataset.drawnScroll=String(-heroTop);
    canvas.dataset.paused=String(!animated);
    canvas.dataset.renderedProgress=String(progress);paintedHeroTop=heroTop;
    canvas.dataset.head=JSON.stringify({x:dragon.segments[0].x,y:dragon.segments[0].y+heroTop,angle:dragon.segments[0].angle});
    if(!snapshot) canvas.dataset.settled='true';
  }
  window.addEventListener('scroll',sync,{passive:true});
  window.addEventListener('resize',sync);
  window.addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY};if(snapshot && canvas.dataset.paused!=='true') onChange();},{passive:true});
  new ResizeObserver(sync).observe(portfolio);
  sync();
  return {canvas,sync,update,draw,restore,get active(){return !!target && (heroTop<0 || progress>0 || !!snapshot);},get visible(){return visible;}};
}
