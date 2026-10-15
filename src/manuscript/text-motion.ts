export type TextPoint={x:number;y:number};

// Move complete content groups from their current position, including during
// reversals. Text and artwork share one anchor so they cannot drift apart.
export function createTextMotion() {
  const positions=new Map<string,TextPoint>();
  let alpha=1,lastTime=0;
  const used=new Set<string>();
  return {
    begin(time:number,animate:boolean) {
      alpha=animate && lastTime ? 1-Math.exp(-Math.min(48,Math.max(0,time-lastTime))/80) : 1;
      lastTime=time;used.clear();
    },
    point(key:string,x:number,y:number):TextPoint {
      used.add(key);
      const previous=positions.get(key) ?? {x,y};
      previous.x+=(x-previous.x)*alpha;previous.y+=(y-previous.y)*alpha;
      if(Math.abs(previous.x-x)+Math.abs(previous.y-y)<.05) {previous.x=x;previous.y=y;}
      positions.set(key,previous);return previous;
    },
    end() {for(const key of positions.keys()) if(!used.has(key)) positions.delete(key);},
    clear() {positions.clear();lastTime=0;},
  };
}
