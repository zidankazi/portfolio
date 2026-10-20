type Segment={x:number;y:number;width:number;angle:number};
type Flame={x:number;y:number;size:number;life:number};
export type CalendarDot={x:number;y:number;vx:number;vy:number;heat:number};
export const restingDot=():CalendarDot=>({x:0,y:0,vx:0,vy:0,heat:0});

// Follow the closest part of the body, including the links between joints.
export function bodyRipple(x:number,y:number,segments:Segment[],scale:number,limit=4.5) {
  let nearest=Infinity,dx=0,dy=0;
  const reach=24*scale;
  for(let index=0;index<segments.length;index++) {
    const a=segments[index],b=segments[index+1] ?? a;
    const sx=b.x-a.x,sy=b.y-a.y,length=sx*sx+sy*sy;
    const t=length ? Math.max(0,Math.min(1,((x-a.x)*sx+(y-a.y)*sy)/length)) : 0;
    const ex=x-a.x-sx*t,ey=y-a.y-sy*t,distance=Math.hypot(ex,ey);
    const edge=distance-(a.width+(b.width-a.width)*t)/2;
    if(edge>=nearest || edge>=reach) continue;
    nearest=edge;
    const amount=Math.pow(1-Math.max(0,edge)/reach,2)*limit;
    dx=(distance>.01 ? ex/distance : -Math.sin(a.angle))*amount;
    dy=(distance>.01 ? ey/distance : Math.cos(a.angle))*amount;
  }
  return {x:dx,y:dy};
}

// Heat comes from actual flame particles, not from the cursor or dragon alone.
export function flameHeat(x:number,y:number,fire:Flame[],dotRadius:number) {
  let heat=0;
  for(const particle of fire) {
    const radius=particle.size*1.7+dotRadius;
    const distance=Math.hypot(x-particle.x,y-particle.y);
    if(distance>=radius) continue;
    heat=Math.max(heat,Math.sqrt(1-distance/radius)*Math.min(1,particle.life*2));
  }
  return heat;
}

export function stepCalendarDot(dot:CalendarDot,target:{x:number;y:number},heat:number,elapsed:number) {
  // Small integration steps keep the spring stable after a slow frame.
  let remaining=Math.min(48,Math.max(0,elapsed))/1000;
  while(remaining>0) {
    const dt=Math.min(remaining,1/120);remaining-=dt;
    dot.vx+=((target.x-dot.x)*170-dot.vx*22)*dt;
    dot.vy+=((target.y-dot.y)*170-dot.vy*22)*dt;
    dot.x+=dot.vx*dt;dot.y+=dot.vy*dt;
  }
  if(Math.abs(dot.x-target.x)+Math.abs(dot.y-target.y)+Math.abs(dot.vx)+Math.abs(dot.vy)<.02) {
    dot.x=target.x;dot.y=target.y;dot.vx=dot.vy=0;
  }
  dot.heat=Math.max(heat,dot.heat*Math.exp(-Math.max(0,elapsed)/180));
  if(dot.heat<.008) dot.heat=0;
}
