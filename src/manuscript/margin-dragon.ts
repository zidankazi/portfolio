import {getRestPose,updateDragonScale,getDragonBounds,drawDragon} from './reference/dragon.js';
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
  let snapshot:{poses:Pose[];original:Pose[];scale:number} | null=null;
  let applied='';
  let painted:{left:number;right:number;top:number;bottom:number} | null=null;
  let paintedHeroTop:number | null=null;

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
    const alpha=animated ? 1-Math.exp(-dt/140) : 1;
    progress+= (goal-progress)*alpha;
    if(Math.abs(goal-progress)<.0005) progress=goal;
    if(!target || (!progress && heroTop>=0)) {const changed=!!snapshot;restore();return changed;}
    if(!snapshot) {
      const original=dragon.segments.map(({x,y,angle})=>({x,y,angle}));
      snapshot={scale:dragon.scale,original,poses:original.map(pose=>({...pose,y:pose.y+(paintedHeroTop ?? heroTop)}))};
    }
    const key=progress+':'+heroTop+':'+width+':'+height+':'+lift;
    if(applied===key) return false;
    applied=key;
    const t=progress*progress*progress*(progress*(progress*6-15)+10);
    updateDragonScale(dragon,snapshot.scale+(target.scale-snapshot.scale)*t);
    dragon.segments.forEach((segment,index)=>{
      const start=snapshot!.poses[index],end=target!.poses[index];
      const turn=Math.atan2(Math.sin(end.angle-start.angle),Math.cos(end.angle-start.angle));
      segment.x=start.x+(end.x-start.x)*t;
      segment.y=start.y+(end.y-start.y)*t-heroTop;
      segment.angle=start.angle+turn*t;
    });
    // During travel, keep the whole illustration above native text until it fits the gutter.
    const bounds=getDragonBounds(dragon);
    const projectTop=projects.getBoundingClientRect().top;
    const required=bounds.right>portfolio.getBoundingClientRect().left-24 ? Math.max(0,bounds.bottom+heroTop-projectTop+24) : 0;
    // Enforce clearance immediately, but ease the release so entering the gutter cannot drop the body.
    lift=Math.max(required,lift+(required-lift)*alpha);
    if(Math.abs(lift-required)<.05) lift=required;
    if(lift) for(const segment of dragon.segments) segment.y-=lift;
    canvas.dataset.settled=String(progress===goal && lift===required);
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
    canvas.dataset.mode=!visible ? 'hidden' : progress===0 ? 'hero' : progress===1 ? 'margin' : 'transition';
    canvas.dataset.drawnMode=canvas.dataset.mode;
    canvas.dataset.drawnScroll=String(-heroTop);
    canvas.dataset.paused=String(!animated);
    canvas.dataset.renderedProgress=String(progress);paintedHeroTop=heroTop;
    if(!snapshot) canvas.dataset.settled='true';
  }
  window.addEventListener('scroll',sync,{passive:true});
  window.addEventListener('resize',sync);
  new ResizeObserver(sync).observe(portfolio);
  sync();
  return {canvas,sync,update,draw,restore,get active(){return !!target && (heroTop<0 || progress>0);},get visible(){return visible;}};
}
