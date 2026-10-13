// Sprite artwork and articulated chain adapted from Illustrated Manuscript.
// See public/manuscript/NOTICE.txt for the upstream ISC license and credits.
export type Segment = {x: number; y: number; angle: number; width: number};
type Spark = {x: number; y: number; vx: number; vy: number; life: number; size: number};
export type Range = {left: number; right: number};
const widths = [221, 130, 203, 223, 285, 299, 281, 224, 192, 174, 191, 156, 155, 122, 126, 125, 107, 101, 101, 81];

export class Dragon {
  segments: Segment[] = [];
  sparks: Spark[] = [];
  private sprites = new Map<string, HTMLImageElement>();
  private previous = 0;
  scale = 1;
  static async load(): Promise<Dragon> {
    const dragon = new Dragon();
    const names = ['head', 'tongue', 'wing-front', 'wing-back', ...Array.from({length: 19}, (_, i) => 'body-'+(i+1))];
    await Promise.all(names.map(name => new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {dragon.sprites.set(name, image); resolve();};
      image.onerror = () => reject(new Error('Dragon artwork unavailable'));
      image.src = '/manuscript/'+name+'.webp';
    })));
    return dragon;
  }
  rest(x: number, y: number, scale: number) {
    this.scale = scale;
    this.segments = this.restPose(x, y);
  }
  private restPose(x: number, y: number): Segment[] {
    const positions: Segment[] = [{x, y, angle: 0, width: widths[0] * .24 * this.scale}];
    for (let i = 1; i < 20; i++) {
      const angle = -(i / 19) * Math.PI * .72;
      const previous = positions[i-1];
      positions.push({x: previous.x - Math.cos(angle)*22*this.scale, y: previous.y - Math.sin(angle)*22*this.scale, angle, width: widths[i]*.24*this.scale});
    }
    return positions;
  }
  update(time: number, target: {x: number; y: number} | null, restX: number, restY: number): boolean {
    if (time-this.previous < 40) return false;
    this.previous = time;
    if (!target) {
      const rest = this.restPose(restX, restY);
      this.segments.forEach((segment, i) => {
        segment.x += (rest[i].x-segment.x)*.1;
        segment.y += (rest[i].y-segment.y)*.1;
        const difference = Math.atan2(Math.sin(rest[i].angle-segment.angle), Math.cos(rest[i].angle-segment.angle));
        segment.angle += difference*.1;
      });
    } else {
      const head = this.segments[0];
      const dx = target.x-head.x, dy = target.y-head.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 3) {
        head.x += dx*.15; head.y += dy*.15;
        head.angle = Math.atan2(dy, dx);
      }
      for (let i = 1; i < this.segments.length; i++) {
        const previous = this.segments[i-1], segment = this.segments[i];
        let angle = Math.atan2(previous.y-segment.y, previous.x-segment.x);
        const difference = Math.atan2(Math.sin(angle-previous.angle), Math.cos(angle-previous.angle));
        angle = previous.angle+Math.max(-.25, Math.min(.25, difference));
        segment.angle = angle;
        segment.x = previous.x-Math.cos(angle)*22*this.scale;
        segment.y = previous.y-Math.sin(angle)*22*this.scale;
      }
    }
    this.sparks.forEach(spark => {spark.x+=spark.vx; spark.y+=spark.vy; spark.vx*=.96; spark.vy-=.2; spark.life-=.045;});
    this.sparks = this.sparks.filter(spark => spark.life > 0);
    return true;
  }
  breathe() {
    const head = this.segments[0];
    for (let i = 0; i < 9; i++) {
      const angle = head.angle+(Math.random()-.5)*.6;
      this.sparks.push({x: head.x+Math.cos(head.angle)*48*this.scale, y: head.y+Math.sin(head.angle)*48*this.scale, vx: Math.cos(angle)*(5+Math.random()*8)*this.scale, vy: Math.sin(angle)*9*this.scale, life: 1, size: (5+Math.random()*12)*this.scale});
    }
  }
  exclusions(top: number, bottom: number): Range[] {
    const circles = [...this.segments.map(segment => ({...segment, radius: segment.width/2+12*this.scale})), ...this.sparks.map(spark => ({...spark, radius: spark.size+8}))];
    const ranges = circles.flatMap(circle => {
      const gap = Math.max(0, Math.abs(circle.y-(top+bottom)/2)-(bottom-top)/2);
      if (gap >= circle.radius) return [];
      const half = Math.sqrt(circle.radius**2-gap**2);
      return [{left: circle.x-half, right: circle.x+half}];
    });
    // Reserve the transformed sprite bounds, including the full wing-flap arc.
    const wing = this.segments[5];
    const sprites: {name: string; segment: Segment; ox: number; oy: number; angle: number}[] = [
      {name:'wing-front',segment:wing,ox:-1,oy:-1,angle:-.18},
      {name:'wing-front',segment:wing,ox:-1,oy:-1,angle:.18},
      {name:'wing-back',segment:wing,ox:-1,oy:-1,angle:-.18},
      {name:'wing-back',segment:wing,ox:-1,oy:-1,angle:.18},
      {name:'head',segment:this.segments[0],ox:-.45,oy:-.5,angle:0},
    ];
    for (const {name,segment,ox,oy,angle} of sprites) {
      const image=this.sprites.get(name)!;
      const width=image.naturalWidth*.24*this.scale, height=image.naturalHeight*.24*this.scale;
      const rotation=segment.angle+angle;
      const points=[[ox*width,oy*height],[(ox+1)*width,oy*height],[ox*width,(oy+1)*height],[(ox+1)*width,(oy+1)*height]].map(([x,y])=>({x:segment.x+x*Math.cos(rotation)-y*Math.sin(rotation),y:segment.y+x*Math.sin(rotation)+y*Math.cos(rotation)}));
      const padding=10*this.scale;
      if (bottom > Math.min(...points.map(point=>point.y))-padding && top < Math.max(...points.map(point=>point.y))+padding) ranges.push({left:Math.min(...points.map(point=>point.x))-padding,right:Math.max(...points.map(point=>point.x))+padding});
    }
    return ranges;
  }
  draw(ctx: CanvasRenderingContext2D, time: number, animate: boolean) {
    const wing = this.segments[5];
    const flap = animate ? Math.sin(time/550)*.18 : 0;
    this.drawSprite(ctx, 'wing-back', wing, -1, -1, flap);
    for (let i = 19; i >= 0; i--) {
      const segment = this.segments[i];
      if (i === 0) {
        this.drawSprite(ctx, 'tongue', {...segment, x: segment.x+Math.cos(segment.angle)*32*this.scale, y: segment.y+Math.sin(segment.angle)*32*this.scale}, 0, -.5);
        this.drawSprite(ctx, 'head', segment, -.45, -.5);
      } else this.drawSprite(ctx, 'body-'+i, segment, -.5, -.5);
      if (i === 5) this.drawSprite(ctx, 'wing-front', segment, -1, -1, -flap);
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
