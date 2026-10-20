import type {createDragon} from './reference/dragon.js';
import {bodyRipple,flameHeat,restingDot,stepCalendarDot,type CalendarDot} from './calendar-motion.ts';

type Cell={button:HTMLButtonElement;cx:number;cy:number;radius:number;seed:number;dot:CalendarDot;paint:string};

export function mountCalendarEffects(dragon:ReturnType<typeof createDragon>) {
  const container=document.querySelector<HTMLElement>('#github-activity');
  let cells:Cell[]=[],grid:HTMLElement | null=null,scroll:HTMLElement | null=null;
  let dirty=true,lastTime=0,hovered=false,focused=false,touching=false,active=false;

  function paint(cell:Cell,time=lastTime) {
    const {x,y,heat}=cell.dot;
    // Stagger small color changes per pixel, without adding animated elements.
    const beat=Math.floor(time/(100+cell.seed*65));
    const flicker=(Math.imul(beat^Math.round(cell.seed*65535),1597334677)>>>0)/4294967296;
    const warmth=heat*(.78+cell.seed*.22)+(flicker-.5)*.36*Math.min(1,heat*4);
    const color=warmth>.8 ? '#ffcb62' : warmth>.6 ? '#f3912d' : warmth>.36 ? '#d35d20' : warmth>.16 ? '#973a19' : '#5f301e';
    const values=[x.toFixed(2)+'px',y.toFixed(2)+'px',heat.toFixed(3)];
    const signature=values.join(',')+color;if(signature===cell.paint) return;
    cell.paint=signature;
    cell.button.style.setProperty('--dot-x',values[0]);cell.button.style.setProperty('--dot-y',values[1]);
    cell.button.style.setProperty('--ember',values[2]);
    if(cell.button.style.getPropertyValue('--ember-color')!==color) cell.button.style.setProperty('--ember-color',color);
  }
  function reset(movementOnly=false) {
    for(const cell of cells) {
      cell.dot.x=cell.dot.y=cell.dot.vx=cell.dot.vy=0;
      if(!movementOnly) cell.dot.heat=0;
      paint(cell);
    }
    if(!movementOnly) {lastTime=0;active=false;}
  }
  if(container) {
    new MutationObserver(()=>{dirty=true;}).observe(container,{childList:true,subtree:true});
    new ResizeObserver(()=>{dirty=true;}).observe(container);
    window.addEventListener('resize',()=>{dirty=true;});
    container.addEventListener('pointerenter',event=>{
      if(event.pointerType==='mouse' || event.pointerType==='pen') {hovered=true;reset(true);}
    });
    container.addEventListener('pointerleave',()=>{hovered=false;});
    container.addEventListener('focusin',()=>{focused=true;reset(true);});
    container.addEventListener('focusout',event=>{focused=event.relatedTarget instanceof Node && container.contains(event.relatedTarget);});
    container.addEventListener('pointerdown',event=>{if(event.pointerType==='touch') {touching=true;reset(true);}});
    window.addEventListener('pointerup',()=>{touching=false;});window.addEventListener('pointercancel',()=>{touching=false;});
    document.addEventListener('visibilitychange',()=>{if(document.hidden) {hovered=touching=false;reset();}});
  }
  return {
    update(time:number,animated:boolean,heroTop:number) {
      if(!container) return;
      if(dirty) {
        grid=container.querySelector<HTMLElement>('.calendar-grid');scroll=container.querySelector<HTMLElement>('.calendar-scroll');
        // Cache original cell centers. Only the pseudo-elements move, so native
        // hit areas, grid geometry, dates, and contribution levels stay fixed.
        const previous=new Map(cells.map(cell=>[cell.button,cell]));
        cells=[...container.querySelectorAll<HTMLButtonElement>('.calendar-day')].map((button,index)=>({
          button,cx:button.offsetLeft+button.offsetWidth/2,cy:button.offsetTop+button.offsetHeight/2,
          seed:(Math.imul(index+1,2654435761)>>>0)/4294967296,
          radius:Math.min(button.offsetWidth,button.offsetHeight)/2,dot:previous.get(button)?.dot ?? restingDot(),paint:previous.get(button)?.paint ?? '',
        }));
        hovered=container.matches(':hover') && matchMedia('(hover:hover)').matches;
        focused=container.contains(document.activeElement);dirty=false;
      }
      if(!animated || !grid || !scroll || document.hidden) {if(active) reset();return;}
      const box=grid.getBoundingClientRect(),clip=scroll.getBoundingClientRect();
      if(clip.bottom<=0 || clip.top>=innerHeight) {if(active) reset();return;}
      const elapsed=lastTime ? Math.max(0,time-lastTime) : 16;lastTime=time;active=true;
      const paused=hovered || focused || touching;
      for(const cell of cells) {
        const x=box.left+cell.cx,y=box.top+cell.cy;
        const shown=x>=clip.left && x<=clip.right && y>=0 && y<=innerHeight;
        const target=shown && !paused ? bodyRipple(x,y-heroTop,dragon.segments,dragon.scale,Math.min(4.5,cell.radius*.65)) : {x:0,y:0};
        const heat=shown && dragon.fire.length ? flameHeat(x+cell.dot.x,y+cell.dot.y-heroTop,dragon.fire,cell.radius) : 0;
        stepCalendarDot(cell.dot,target,heat,elapsed);paint(cell,time);
      }
    },
  };
}
