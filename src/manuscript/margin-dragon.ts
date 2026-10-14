import {createDragon,setDragonRestPose,updateDragonScale,updateDragon,getDragonBounds,drawDragon} from './reference/dragon.js';

// Uses the sprites already loaded by the manuscript; native project layout stays independent.
export function mountMarginDragon():void {
  const hero=document.querySelector<HTMLElement>('#manuscript-scene');
  const projects=document.querySelector<HTMLElement>('#projects');
  const portfolio=document.querySelector<HTMLElement>('#portfolio');
  if (!hero || !projects || !portfolio) return;
  const canvas=document.createElement('canvas');canvas.id='project-dragon';
  canvas.className='margin-dragon';canvas.dataset.visible='false';
  canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  const ctx=canvas.getContext('2d');if (!ctx) return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const dragon=createDragon(0,0,1);
  setDragonRestPose(dragon);
  const natural=getDragonBounds(dragon);
  let width=0,height=0,visible=false,frame=0,frames=0,needsDraw=true;
  let origin={x:0,y:0};

  function stop() {if(frame) cancelAnimationFrame(frame);frame=0;}
  function schedule() {if(!frame && visible && !document.hidden) frame=requestAnimationFrame(render);}
  function sync() {
    const wasVisible=visible;
    const gutter=portfolio!.getBoundingClientRect().left-40;
    const nextWidth=Math.round(Math.min(260,gutter));
    const nextHeight=Math.round(Math.min(400,innerHeight*.65));
    const nextVisible=hero!.getBoundingClientRect().bottom<=0 && projects!.getBoundingClientRect().bottom>0 && gutter>=180 && innerHeight>=300;
    visible=nextVisible;canvas.dataset.visible=String(visible);
    canvas.dataset.paused=String(motion.matches);
    if(!wasVisible && visible) needsDraw=true;
    if (!visible || document.hidden) {stop();return;}
    if (nextWidth!==width || nextHeight!==height) {
      needsDraw=true;
      width=nextWidth;height=nextHeight;
      const scale=Math.min(.5,(width-24)/(natural.right-natural.left),(height-24)/(natural.bottom-natural.top));
      updateDragonScale(dragon,scale);setDragonRestPose(dragon);
      const bounds=getDragonBounds(dragon);
      origin={x:(width-(bounds.right-bounds.left))/2-bounds.left,y:(height-(bounds.bottom-bounds.top))/2-bounds.top};
      const dpr=Math.min(devicePixelRatio || 1,2);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx!.setTransform(dpr,0,0,dpr,0,0);
      canvas.style.width=width+'px';canvas.style.height=height+'px';
      canvas.dataset.scale=String(scale);
    }
    canvas.style.left=Math.max(16,Math.round((portfolio!.getBoundingClientRect().left-24-width)/2))+'px';
    canvas.style.top=Math.round((innerHeight-height)/2)+'px';
    if(!motion.matches || needsDraw) schedule();
  }
  function render(time:number) {
    frame=0;if(!visible || document.hidden) return;
    const animated=!motion.matches;
    if(animated) updateDragon(dragon,time,0,0,true,0,0);
    ctx!.clearRect(0,0,width,height);ctx!.save();ctx!.translate(origin.x,origin.y);
    drawDragon(ctx!,dragon,animated);ctx!.restore();
    needsDraw=false;
    canvas.dataset.frame=String(++frames);
    if(animated) schedule();
  }
  window.addEventListener('scroll',sync,{passive:true});
  window.addEventListener('resize',sync);
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change',()=>{needsDraw=true;sync();});
  new ResizeObserver(sync).observe(portfolio);
  sync();
}
