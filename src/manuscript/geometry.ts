export type Point = {x:number; y:number};

export function convexHull(points:Point[]):Point[] {
  const sorted=[...points].sort((a,b)=>a.x-b.x || a.y-b.y);
  if (sorted.length<3) return sorted;
  const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const lower:Point[]=[], upper:Point[]=[];
  for (const point of sorted) {
    while (lower.length>=2 && cross(lower[lower.length-2],lower[lower.length-1],point)<=0) lower.pop();
    lower.push(point);
  }
  for (const point of sorted.reverse()) {
    while (upper.length>=2 && cross(upper[upper.length-2],upper[upper.length-1],point)<=0) upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0,-1),...upper.slice(0,-1)];
}

// Intersect the silhouette with one text row instead of excluding its whole box.
export function polygonRange(points:Point[],top:number,bottom:number,padding:number):{left:number; right:number} | null {
  const low=top-padding, high=bottom+padding;
  const intersections:number[]=[];
  for (let i=0;i<points.length;i++) {
    const point=points[i], next=points[(i+1)%points.length];
    if (point.y>=low && point.y<=high) intersections.push(point.x);
    if (point.y===next.y) continue;
    for (const y of [low,high]) {
      if (y<Math.min(point.y,next.y) || y>Math.max(point.y,next.y)) continue;
      intersections.push(point.x+(next.x-point.x)*(y-point.y)/(next.y-point.y));
    }
  }
  if (!intersections.length) return null;
  return {left:Math.min(...intersections)-padding,right:Math.max(...intersections)+padding};
}
