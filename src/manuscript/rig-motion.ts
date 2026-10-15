import type {createDragon} from './reference/dragon.js';

type Dragon=ReturnType<typeof createDragon>;
export const angleDifference=(to:number,from:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
export const PERCH_FOOT=9;
const SHOULDER=-1.9,NECK_LINKS=5,BEND=.25;
export const perchLookAngle=(aim:number)=>SHOULDER+Math.max(-NECK_LINKS*BEND,Math.min(NECK_LINKS*BEND,angleDifference(aim,SHOULDER)));
function restingAngle(index:number,head:number):number {
  return index<=NECK_LINKS ? head+angleDifference(SHOULDER,head)*index/NECK_LINKS : SHOULDER-(index-NECK_LINKS)*BEND;
}
export function perchFootOffset(scale:number) {
  let x=0,y=0;
  for(let index=1;index<=PERCH_FOOT;index++) {
    const angle=restingAngle(index,-.65);
    x-=Math.cos(angle)*30*scale;y-=Math.sin(angle)*30*scale;
  }
  return {x,y};
}

// Intersect the turn budget with the parent's bend range. All joints, including
// the head, share that budget, so these ranges overlap for a connected chain.
function jointAngle(wanted:number,current:number,parent:number,maxTurn:number):number {
  const parentNear=current+angleDifference(parent,current);
  const lower=Math.max(current-maxTurn,parentNear-BEND);
  const upper=Math.min(current+maxTurn,parentNear+BEND);
  const aim=current+angleDifference(wanted,current);
  return Math.max(lower,Math.min(upper,aim));
}

function followingAngle(dragon:Dragon,index:number,release:number):number {
  const segment=dragon.segments[index],previous=dragon.segments[index-1];
  const following=Math.atan2(previous.y-segment.y,previous.x-segment.x);
  // A stationary chain otherwise preserves the exact curl it landed in forever.
  return following+angleDifference(previous.angle,following)*release;
}

// Follow each joint's previous position, as in the reference rig. Never morph between two bodies.
export function followDragonBody(dragon:Dragon,idle:boolean,alpha:number,maxTurn=Infinity,release=0):number {
  let movement=0;
  for(let index=1;index<dragon.segments.length;index++) {
    const segment=dragon.segments[index],previous=dragon.segments[index-1];
    const angle=idle && !release ? segment.angle+angleDifference(-(index/19)*(Math.PI/2)*1.4,segment.angle)*alpha
      : followingAngle(dragon,index,release*alpha);
    segment.angle=jointAngle(angle,segment.angle,previous.angle,maxTurn);
    const x=previous.x-Math.cos(segment.angle)*30*dragon.scale;
    const y=previous.y-Math.sin(segment.angle)*30*dragon.scale;
    movement=Math.max(movement,Math.hypot(x-segment.x,y-segment.y));
    segment.x=x;segment.y=y;
  }
  return movement;
}

// Curl the same articulated chain upright, with its chest resting on the ledge.
// The resting bias never disconnects the head from its neck.
export function perchDragonBody(dragon:Dragon,amount:number,alpha:number,maxTurn:number,release=0):number {
  let movement=0;
  for(let index=1;index<dragon.segments.length;index++) {
    const segment=dragon.segments[index],previous=dragon.segments[index-1];
    const following=followingAngle(dragon,index,release);
    const resting=restingAngle(index,dragon.segments[0].angle);
    const turn=angleDifference(following,segment.angle)*(1-amount)+angleDifference(resting,segment.angle)*amount;
    const wanted=segment.angle+turn*alpha;
    segment.angle=jointAngle(wanted,segment.angle,previous.angle,maxTurn);
    const x=previous.x-Math.cos(segment.angle)*30*dragon.scale;
    const y=previous.y-Math.sin(segment.angle)*30*dragon.scale;
    movement=Math.max(movement,Math.hypot(x-segment.x,y-segment.y));
    segment.x=x;segment.y=y;
  }
  return movement;
}
