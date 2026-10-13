export type Axis = {position:number; velocity:number};

export function springAxis(axis:Axis,target:number,seconds:number):Axis {
  const frequency=24;
  const offset=axis.position-target;
  const combined=axis.velocity+frequency*offset;
  const decay=Math.exp(-frequency*seconds);
  const position=target+(offset+combined*seconds)*decay;
  const velocity=(axis.velocity-frequency*combined*seconds)*decay;
  if (Math.abs(position-target)<.04 && Math.abs(velocity)<.15) return {position:target,velocity:0};
  return {position,velocity};
}

export function angleDifference(to:number,from:number):number {
  return Math.atan2(Math.sin(to-from),Math.cos(to-from));
}
