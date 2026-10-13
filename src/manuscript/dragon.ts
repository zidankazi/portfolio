// Sprite artwork and articulated chain adapted from Illustrated Manuscript.
// See public/manuscript/NOTICE.txt for the upstream ISC license and credits.
import {convexHull,polygonRange,type Point} from './geometry.ts';
import {angleDifference} from './text-motion.ts';
export type Segment = {x: number; y: number; angle: number; width: number};
type Spark = {x: number; y: number; vx: number; vy: number; life: number; size: number};
export type Range = {left: number; right: number};
const widths = [221, 130, 203, 223, 285, 299, 281, 224, 192, 174, 191, 156, 155, 122, 126, 125, 107, 101, 101, 81];

export class Dragon {
  segments: Segment[] = [];
  sparks: Spark[] = [];
  private sprites = new Map<string, HTMLImageElement>();
  private outlines = new Map<string,Point[]>();
  private collision:Point[][] | null=null;
  private previous = 0;
  scale = 1;
  private jitterSeed=Math.random()*1000;
  static async load(): Promise<Dragon> {
    const dragon = new Dragon();
    const names = ['head', 'tongue', 'wing-front', 'wing-back', ...Array.from({length: 19}, (_, i) => 'body-'+(i+1))];
    await Promise.all(names.map(name => new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        dragon.sprites.set(name, image);
        const mask=document.createElement('canvas');
        mask.width=image.naturalWidth; mask.height=image.naturalHeight;
        const ctx=mask.getContext('2d',{willReadFrequently:true});
        if (ctx) {
          ctx.drawImage(image,0,0);
          const pixels=ctx.getImageData(0,0,mask.width,mask.height).data;
          const points:Point[]=[];
          for (let y=0;y<mask.height;y+=4) {
            let left=mask.width, right=-1;
            for (let x=0;x<mask.width;x++) if (pixels[(y*mask.width+x)*4+3]>16) {left=Math.min(left,x); right=x;}
            if (right>=0) points.push({x:left,y},{x:right,y});
          }
          dragon.outlines.set(name,convexHull(points));
        }
        resolve();
      };
      image.onerror = () => reject(new Error('Dragon artwork unavailable'));
      image.src = '/manuscript/'+name+'.webp';
    })));
    return dragon;
  }
  rest(x: number, y: number, scale: number) {
    this.scale = scale;
    this.segments = this.restPose(x, y);
    this.collision=null;
    this.previous=0;
  }
  private restPose(x: number, y: number): Segment[] {
    const positions: Segment[] = [{x, y:y-2, angle: 0, width: widths[0] * .24 * this.scale}];
    for (let i = 1; i < 20; i++) {
      const angle = -(i / 19) * Math.PI * .7;
      const previous = positions[i-1];
      positions.push({x: previous.x - Math.cos(angle)*30*this.scale, y: previous.y - Math.sin(angle)*30*this.scale, angle, width: widths[i]*.24*this.scale});
    }
    return positions;
  }
  update(time: number, target: {x: number; y: number} | null, restX: number, restY: number): boolean {
    // Preserve the reference's deliberate 80ms cadence and articulated chain.
    if (time-this.previous<80) return false;
    this.previous=time;
    this.jitterSeed=Math.random()*1000;
    if (!target) {
      const rest=this.restPose(restX,restY);
      this.segments.forEach((segment,index)=>{
        segment.x+=(rest[index].x-segment.x)*.12;
        segment.y+=(rest[index].y-segment.y)*.12;
        segment.angle+=angleDifference(rest[index].angle,segment.angle)*.12;
      });
    } else {
      const head=this.segments[0];
      const dx=target.x-head.x,dy=target.y-head.y,distance=Math.hypot(dx,dy);
      if (distance>4) {
        const speed=Math.min(distance,Math.max(12,distance*.15));
        head.x+=dx/distance*speed;head.y+=dy/distance*speed;
        head.angle=Math.atan2(dy,dx);
      }
      for (let i=1;i<this.segments.length;i++) {
        const previous=this.segments[i-1],segment=this.segments[i];
        let angle=Math.atan2(previous.y-segment.y,previous.x-segment.x);
        const difference=angleDifference(angle,previous.angle);
        if (difference>.25) angle=previous.angle+.25;
        else if (difference<-.25) angle=previous.angle-.25;
        segment.angle=angle;
        segment.x=previous.x-Math.cos(angle)*30*this.scale;
        segment.y=previous.y-Math.sin(angle)*30*this.scale;
      }
    }
    this.sparks.forEach(spark=>{spark.x+=spark.vx*2;spark.y+=spark.vy*2;spark.vx*=.96**2;spark.vy-=.4;spark.life-=.09;});
    this.sparks=this.sparks.filter(spark=>spark.life>0);
    this.collision=null;
    return true;
  }
  stopFire() {this.sparks=[]; this.collision=null;}
  hold(time:number) {this.previous=time;}
  breathe() {
    this.collision=null;
    const head = this.segments[0];
    for (let i = 0; i < 9; i++) {
      const angle = head.angle+(Math.random()-.5)*.6;
      this.sparks.push({x: head.x+Math.cos(head.angle)*48*this.scale, y: head.y+Math.sin(head.angle)*48*this.scale, vx: Math.cos(angle)*(5+Math.random()*8)*this.scale, vy: Math.sin(angle)*9*this.scale, life: 1, size: (5+Math.random()*12)*this.scale});
    }
  }
  exclusions(top: number, bottom: number): Range[] {
    const circles = this.sparks.map(spark => ({...spark,radius:spark.size+8}));
    const ranges = circles.flatMap(circle => {
      const gap = Math.max(0, Math.abs(circle.y-(top+bottom)/2)-(bottom-top)/2);
      if (gap >= circle.radius) return [];
      const half = Math.sqrt(circle.radius**2-gap**2);
      return [{left: circle.x-half, right: circle.x+half}];
    });
    if (!this.collision) this.collision=this.buildCollision();
    for (const points of this.collision) {
      const range=polygonRange(points,top,bottom,10*this.scale+2);
      if (range) ranges.push(range);
    }
    return ranges;
  }
  private buildCollision():Point[][] {
    const polygons:Point[][]=[];
    const add=(name:string,segment:Segment,ox:number,oy:number,angle=0)=>{
      const image=this.sprites.get(name);
      if (!image) return;
      const outline=this.outlines.get(name) ?? [{x:0,y:0},{x:image.naturalWidth,y:0},{x:image.naturalWidth,y:image.naturalHeight},{x:0,y:image.naturalHeight}];
      const rotation=segment.angle+angle;
      polygons.push(outline.map(point=>{
        const x=(point.x+image.naturalWidth*ox)*.24*this.scale;
        const y=(point.y+image.naturalHeight*oy)*.24*this.scale;
        return {x:segment.x+x*Math.cos(rotation)-y*Math.sin(rotation),y:segment.y+x*Math.sin(rotation)+y*Math.cos(rotation)};
      }));
    };
    const head=this.segments[0];
    add('head',head,-.45,-.5);
    add('tongue',{...head,x:head.x+Math.cos(head.angle)*(this.sprites.get('head')?.naturalWidth ?? 477)*.24*.3*this.scale,y:head.y+Math.sin(head.angle)*(this.sprites.get('head')?.naturalWidth ?? 477)*.24*.3*this.scale},0,-.5);
    for (let i=1;i<20;i++) add('body-'+i,this.segments[i],-.5,-.5);
    for (const name of ['wing-front','wing-back']) for (const angle of [-.4,0,.4]) add(name,this.segments[5],-1,-1,angle);
    return polygons;
  }
  draw(ctx: CanvasRenderingContext2D, time: number, animate: boolean) {
    const pose=(index:number):Segment=>{
      const segment=this.segments[index];
      if (!animate) return segment;
      const hash=(seed:number)=>{const value=Math.sin(seed*12.9898+78.233)*43758.5453;return value-Math.floor(value);};
      const seed=this.jitterSeed+index*37;
      return {...segment,x:segment.x+(hash(seed)-.5)*1.5,y:segment.y+(hash(seed+100)-.5)*1.5,angle:segment.angle+(hash(seed+200)-.5)*.04};
    };
    const seconds=time/1000;
    this.drawSprite(ctx,'wing-back',pose(5),-1,-1,animate ? Math.sin(seconds*3)*.4 : 0);
    for (let i=19;i>=0;i--) {
      const segment=pose(i);
      if (i===0) {
        const tongueOffset=(this.sprites.get('head')?.naturalWidth ?? 477)*.24*.3*this.scale;
        this.drawSprite(ctx,'tongue',{...segment,x:segment.x+Math.cos(segment.angle)*tongueOffset,y:segment.y+Math.sin(segment.angle)*tongueOffset},0,-.5);
        this.drawSprite(ctx,'head',segment,-.45,-.5);
      } else this.drawSprite(ctx,'body-'+i,segment,-.5,-.5);
      if (i===5) this.drawSprite(ctx,'wing-front',segment,-1,-1,animate ? -Math.sin(seconds*3+.5)*.4 : 0);
    }
    for (const spark of this.sparks) {
      ctx.save(); ctx.translate(spark.x, spark.y); ctx.rotate(Math.atan2(spark.vy, spark.vx));
      ctx.globalAlpha = spark.life;
      ctx.fillStyle = spark.life > .5 ? '#a63c25' : '#b98b32';
      ctx.beginPath(); ctx.moveTo(spark.size, 0); ctx.lineTo(0, -spark.size*.6); ctx.lineTo(-spark.size, 0); ctx.lineTo(0, spark.size*.6); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  private drawSprite(ctx: CanvasRenderingContext2D, name: string, segment: Segment, originX: number, originY: number, angle = 0) {
    const image = this.sprites.get(name);
    if (!image) return;
    const width = image.naturalWidth*.24*this.scale, height = image.naturalHeight*.24*this.scale;
    ctx.save(); ctx.translate(segment.x, segment.y); ctx.rotate(segment.angle+angle);
    ctx.drawImage(image, width*originX, height*originY, width, height); ctx.restore();
  }
}
