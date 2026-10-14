import type {createDragon} from './reference/dragon.js';

type Dragon=ReturnType<typeof createDragon>;
export const angleDifference=(to:number,from:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));

// Follow each joint's previous position, as in the reference rig. Never morph between two bodies.
export function followDragonBody(dragon:Dragon,idle:boolean,alpha:number,maxTurn=Infinity):number {
  let movement=0;
  for(let index=1;index<dragon.segments.length;index++) {
    const segment=dragon.segments[index],previous=dragon.segments[index-1];
    const angle=idle ? segment.angle+angleDifference(-(index/19)*(Math.PI/2)*1.4,segment.angle)*alpha
      : Math.atan2(previous.y-segment.y,previous.x-segment.x);
    const turn=angleDifference(angle,segment.angle);
    const nextAngle=segment.angle+Math.max(-maxTurn,Math.min(maxTurn,turn));
    const bend=angleDifference(nextAngle,previous.angle);
    segment.angle=previous.angle+Math.max(-.25,Math.min(.25,bend));
    const x=previous.x-Math.cos(segment.angle)*30*dragon.scale;
    const y=previous.y-Math.sin(segment.angle)*30*dragon.scale;
    movement=Math.max(movement,Math.hypot(x-segment.x,y-segment.y));
    segment.x=x;segment.y=y;
  }
  return movement;
}
