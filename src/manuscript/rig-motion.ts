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
    const nextAngle=segment.angle+turn;
    const bend=angleDifference(nextAngle,previous.angle);
    const constrained=previous.angle+Math.max(-.25,Math.min(.25,bend));
    segment.angle+=Math.max(-maxTurn,Math.min(maxTurn,angleDifference(constrained,segment.angle)));
    const x=previous.x-Math.cos(segment.angle)*30*dragon.scale;
    const y=previous.y-Math.sin(segment.angle)*30*dragon.scale;
    movement=Math.max(movement,Math.hypot(x-segment.x,y-segment.y));
    segment.x=x;segment.y=y;
  }
  return movement;
}

// Curl the same articulated chain upright, with its chest resting on the ledge.
// The neck gradually stops steering the whole body as the head looks around.
export function perchDragonBody(dragon:Dragon,amount:number,alpha:number,maxTurn:number):number {
  let movement=0;
  for(let index=1;index<dragon.segments.length;index++) {
    const segment=dragon.segments[index],previous=dragon.segments[index-1];
    const following=Math.atan2(previous.y-segment.y,previous.x-segment.x);
    const resting=-.9-(index-1)*.25;
    const turn=angleDifference(following,segment.angle)*(1-amount)+angleDifference(resting,segment.angle)*amount;
    const wanted=segment.angle+turn*alpha;
    const flex=index===1 ? .25+amount*Math.PI : .25;
    const constrained=previous.angle+Math.max(-flex,Math.min(flex,angleDifference(wanted,previous.angle)));
    // Apply the speed limit last: anatomical constraints must never teleport a live joint.
    segment.angle+=Math.max(-maxTurn,Math.min(maxTurn,angleDifference(constrained,segment.angle)));
    const x=previous.x-Math.cos(segment.angle)*30*dragon.scale;
    const y=previous.y-Math.sin(segment.angle)*30*dragon.scale;
    movement=Math.max(movement,Math.hypot(x-segment.x,y-segment.y));
    segment.x=x;segment.y=y;
  }
  return movement;
}
