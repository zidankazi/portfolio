// Canvas composition adapted from Illustrated Manuscript (ISC).
// The portfolio below this surface uses ordinary browser layout and links.
import {prepareRichInline,layoutNextRichInlineLineRange,materializeRichInlineLineRange,measureRichInlineStats} from '@chenglou/pretext/rich-inline';
import {biographyBlocks,biographyInline,biographyMarkup,type BioTrack,type BioImage} from './bio.ts';
import {playbackBars} from './playing.ts';
import {BG_COLOR, TEXT_COLOR, getResponsiveLayout, getPageOffset, getPageScale} from './reference/config.js';
import {loadDragonSprites, createDragon, updateDragonScale, updateDragon, getDragonExclusions, getFireExclusions, getFireInfluence, spawnFire, hasActiveFire, updateFire, drawDragon, drawFire} from './reference/dragon.js';

type Range = {left:number; right:number};
type Picture = {image:BioImage; x:number; y:number; size:number; textX:number; textY:number};
type Line = {text:string; x:number; y:number; font:string; fontSize:number; color:string};

export function subtractRanges(ranges:Range[], exclusion:Range):Range[] {
  return ranges.flatMap(range => {
    if (exclusion.right<=range.left || exclusion.left>=range.right) return [range];
    const remaining:Range[]=[];
    if (exclusion.left>range.left) remaining.push({left:range.left,right:exclusion.left});
    if (exclusion.right<range.right) remaining.push({left:exclusion.right,right:range.right});
    return remaining;
  });
}

export async function mountScene():Promise<void> {
  const surface=document.querySelector<HTMLElement>('#manuscript-scene');
  const canvas=document.querySelector<HTMLCanvasElement>('#manuscript');
  const ctx=canvas?.getContext('2d',{alpha:false});
  if (!surface || !canvas || !ctx) return;
  const fallback=surface.querySelector<HTMLElement>('.manuscript-fallback');
  let track:BioTrack | null=null;
  let bio=JSON.stringify(biographyBlocks());
  let refreshText:(()=>void) | null=null;
  document.addEventListener('manuscript-track',event=>{
    track=(event as CustomEvent<BioTrack>).detail;
    const next=JSON.stringify(biographyBlocks(track));
    if (next===bio) return;
    bio=next;
    if (fallback) fallback.innerHTML=biographyMarkup(track);
    refreshText?.();
  });
  const spotifyIcon=new Image();spotifyIcon.src='/manuscript/spotify.svg';
  const dropCap=new Image();
  dropCap.src='/manuscript/dropcap.webp';
  await Promise.all([document.fonts.load('21px "Furia"'), document.fonts.load('21px "Manuscript Initial"','I'), loadDragonSprites(), dropCap.decode(), spotifyIcon.decode()]);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let width=surface.clientWidth, height=surface.clientHeight;
  let layout=sceneLayout();
  let offset=getPageOffset(layout,width,height);
  let scale=getPageScale(width);
  const media=new Map<string,HTMLCanvasElement>();
  const mediaRequests=new Set<string>();
  let prepared=fitBio();
  let lines:Line[]=[];
  let pictures:Picture[]=[];
  let musicGroup:{x:number;y:number;width:number;height:number;detailsX:number;statusY:number;titleY:number;artistY:number | null;iconY:number} | null=null;
  let dirty=true, frame=0, frames=0, visible=true;
  let mouse={x:0,y:0}, hasPointer=false, held=false;
  let bounds=surface.getBoundingClientRect();
  const glyphWidths=new Map<string,number>();
  const dragon=createDragon(0,0,scale);
  refreshText=()=>{
    const active=new Set(biographyBlocks(track).flatMap(block=>block.image ? [block.image.src] : []));
    for (const src of media.keys()) if (!active.has(src)) {media.delete(src);mediaRequests.delete(src);}
    prepared=fitBio();glyphWidths.clear();dirty=true;schedule();
  };

  function sceneLayout() {
    const next=getResponsiveLayout(width,height);
    return {...next,pageWidth:Math.min(760,width-16),pageHeight:height-24,margin:width<=600 ? 6 : 24};
  }
  function pictureSize(image:BioImage,bodySize:number) {
    return image.kind==='album' ? Math.round(Math.max(40,Math.min(56,bodySize*2.6))) : Math.round(Math.max(24,Math.min(32,bodySize*1.45)));
  }
  // Fit only when the viewport or song changes, keeping type stable during motion.
  function fitBio() {
    const maximum=width<=600 ? 17 : 21;
    let bodySize=maximum;
    let candidate=prepareBio(bodySize);
    while (bodySize>12) {
      const estimated=candidate.reduce((height,block)=>{
        if (block.music) return height+musicGeometry(block,Math.min(360,layout.pageWidth-2*layout.margin)).height+block.gap;
        const stats=measureRichInlineStats(block.prepared,layout.pageWidth-2*layout.margin);
        return height+stats.lineCount*block.lineHeight+Math.max(0,block.imageSize-block.lineHeight)+block.gap;
      },0);
      // Leave room for the illuminated initial and the dragon crossing the text.
      if (estimated<=layout.pageHeight-2*layout.margin-(width<=600 ? 110 : 52)) break;
      bodySize-=.5;candidate=prepareBio(bodySize);
    }
    layout.fontSize=bodySize;layout.lineHeight=Math.round(bodySize*lineSpacing());
    surface!.dataset.bodySize=String(bodySize);
    if (fallback) {fallback.style.fontSize=bodySize+'px';fallback.style.lineHeight=String(lineSpacing());}
    return candidate;
  }
  function lineSpacing() {return width<=600 && height<700 ? 1.25 : 1.35;}
  function paragraphSpacing() {return width<=600 ? (height<700 ? .3 : .45) : .65;}
  function prepareBio(bodySize:number) {
    return biographyBlocks(track).map((block,index)=>{
      let fontSize=bodySize;
      if (block.kind==='name') fontSize=Math.max(26,bodySize*1.7);
      else if (block.kind==='label' || block.kind==='cue') fontSize=Math.max(12,bodySize*.8);
      const lineHeight=Math.round(fontSize*lineSpacing());
      const font=`${fontSize}px "Manuscript Initial", "Furia", Georgia, serif`;
      const color=block.accent ? '#744338' : ['label','cue'].includes(block.kind) ? '#6c665a' : TEXT_COLOR;
      const imageSize=block.image ? (block.music ? (width<=600 ? 48 : 64) : pictureSize(block.image,bodySize)) : 0;
      const parts=biographyInline(index===0 ? {...block,text:block.text.slice(1)} : block);
      const items=parts.map(part=>({text:part.text,font,...(part.noBreak ? {break:'never' as const} : {}),...(part.image ? {extraWidth:imageSize+8} : {})}));
      const music=block.music ? [
        {text:block.music.status,fontSize:Math.max(12,bodySize*.78),color:'#6c665a',indent:block.music.isPlaying ? 40 : 20},
        {text:block.music.title,fontSize:Math.max(18,bodySize*1.25),color:TEXT_COLOR,indent:0},
        ...(block.music.artist ? [{text:'by '+block.music.artist,fontSize:Math.max(12,bodySize*.85),color:'#6c665a',indent:0}] : []),
      ].map(row=>{
        const font=`${row.fontSize}px "Manuscript Initial", "Furia", Georgia, serif`;
        return {...row,font,lineHeight:Math.round(row.fontSize*1.25),prepared:prepareRichInline([{text:row.text,font}])};
      }) : null;
      const imageIndex=parts.findIndex(part=>part.image);
      return {prepared:prepareRichInline(items),itemCount:items.length,font,fontSize,lineHeight,color,gap:block.gap*bodySize/21*paragraphSpacing(),image:block.image,imageSize,imageIndex,parts,music};
    });
  }
  function musicGeometry(block:ReturnType<typeof prepareBio>[number],cardWidth:number) {
    const coverWidth=block.imageSize ? block.imageSize+12 : 0;
    const textWidth=cardWidth-coverWidth;
    const rows=block.music!.map(row=>({...row,count:measureRichInlineStats(row.prepared,Math.max(1,textWidth-row.indent)).lineCount}));
    const textHeight=rows.reduce((height,row)=>height+row.count*row.lineHeight,0)+4;
    return {rows,textWidth,textHeight,height:Math.max(block.imageSize,textHeight),coverWidth};
  }
  function flowRanges(y:number,lineHeight:number):Range[] {
    const cap=dropCapSize();
    let ranges:Range[]=[{left:layout.margin,right:layout.pageWidth-layout.margin}];
    if (y<layout.margin-4+cap.height) ranges=subtractRanges(ranges,{left:layout.margin-4,right:layout.margin-4+cap.width});
    const top=y+offset.y,bottom=top+lineHeight;
    for (const exclusion of [...getDragonExclusions(dragon,top,bottom,10),...getFireExclusions(dragon,top,bottom,6)]) {
      ranges=subtractRanges(ranges,{left:exclusion.left-offset.x,right:exclusion.right-offset.x});
    }
    return ranges;
  }
  function loadPicture(image:BioImage) {
    if (mediaRequests.has(image.src)) return;
    mediaRequests.add(image.src);
    const bitmap=new Image();
    if (image.kind==='album') bitmap.crossOrigin='anonymous';
    bitmap.onload=()=>{
      if (!biographyBlocks(track).some(block=>block.image?.src===image.src)) {mediaRequests.delete(image.src);return;}
      const cached=document.createElement('canvas');
      cached.width=cached.height=(image.kind==='album' ? 64 : 32)*2;
      const drawing=cached.getContext('2d')!;
      if (image.kind==='league') {
        const ratio=Math.min(cached.width/bitmap.naturalWidth,cached.height/bitmap.naturalHeight);
        const w=bitmap.naturalWidth*ratio,h=bitmap.naturalHeight*ratio;
        drawing.drawImage(bitmap,(cached.width-w)/2,(cached.height-h)/2,w,h);
      } else {
        const side=Math.min(bitmap.naturalWidth,bitmap.naturalHeight);
        drawing.drawImage(bitmap,(bitmap.naturalWidth-side)/2,(bitmap.naturalHeight-side)/2,side,side,0,0,cached.width,cached.height);
      }
      media.set(image.src,cached);dirty=true;schedule();
    };
    bitmap.onerror=()=>{dirty=true;schedule();};
    bitmap.src=image.src;
  }
  function dropCapSize() {
    const height=layout.lineHeight*2.5;
    const drawWidth=dropCap.naturalWidth*height/dropCap.naturalHeight;
    return {width:drawWidth+12,height,drawWidth};
  }
  function restPosition() {
    return {x:width<=600 ? width*.72 : offset.x+layout.margin+dropCapSize().width*.8-115*scale,y:offset.y+layout.margin+24*scale};
  }
  function placeDragon() {
    const rest=hasPointer ? mouse : restPosition();
    dragon.segments.forEach((segment,index)=>{
      segment.angle=-(index/19)*(Math.PI/2)*1.4;
      const previous=dragon.segments[index-1];
      segment.x=previous ? previous.x-Math.cos(segment.angle)*30*scale : rest.x;
      segment.y=previous ? previous.y-Math.sin(segment.angle)*30*scale : rest.y-2;
    });
  }
  function resize() {
    const nextWidth=surface!.clientWidth, nextHeight=surface!.clientHeight;
    const changed=nextWidth!==width;
    width=nextWidth; height=nextHeight; bounds=surface!.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio || 1,2);
    canvas!.width=Math.round(width*dpr); canvas!.height=Math.round(height*dpr);
    ctx!.setTransform(dpr,0,0,dpr,0,0);
    layout=sceneLayout(); offset=getPageOffset(layout,width,height);
    scale=getPageScale(width); updateDragonScale(dragon,scale);
    prepared=fitBio(); glyphWidths.clear();
    mouse={x:Math.min(width,mouse.x),y:Math.min(height,mouse.y)};
    if (changed && !hasPointer) placeDragon();
    dirty=true; schedule();
  }
  function layoutText() {
    lines=[];pictures=[];musicGroup=null;
    let cursor={itemIndex:0,segmentIndex:0,graphemeIndex:0},paragraphIndex=0;
    let y=layout.margin;
    while (paragraphIndex<prepared.length) {
      const block=prepared[paragraphIndex];
      const {fontSize,font,color,gap}=block;
      if (block.music) {
        const idealWidth=Math.min(360,layout.pageWidth-2*layout.margin);
        const ideal=musicGeometry(block,idealWidth);
        let placed=false;
        for (const range of flowRanges(y,ideal.height)) {
          const cardWidth=Math.min(idealWidth,Math.floor(range.right-range.left));
          if (cardWidth<Math.min(210,idealWidth)) continue;
          const geometry=musicGeometry(block,cardWidth);
          if (y+geometry.height>layout.pageHeight-layout.margin) continue;
          if (!flowRanges(y,geometry.height).some(space=>space.left<=range.left && space.right>=range.left+cardWidth)) continue;
          const x=range.left,detailsX=x+geometry.coverWidth;
          let rowY=y+(geometry.height-geometry.textHeight)/2;
          const rowYs:number[]=[];
          for (const [index,row] of geometry.rows.entries()) {
            rowYs.push(rowY+(row.lineHeight-row.fontSize*.857)/2);
            let rowCursor={itemIndex:0,segmentIndex:0,graphemeIndex:0};
            while(rowCursor.itemIndex<1) {
              const next=layoutNextRichInlineLineRange(row.prepared,geometry.textWidth-row.indent,rowCursor);
              if (!next) break;
              const materialized=materializeRichInlineLineRange(row.prepared,next);
              lines.push({text:materialized.fragments.map(fragment=>fragment.text).join(''),x:detailsX+row.indent,y:rowY+(row.lineHeight-row.fontSize*.857)/2,font:row.font,fontSize:row.fontSize,color:row.color});
              rowCursor=next.end;rowY+=row.lineHeight;
            }
            if(index<2) rowY+=2;
          }
          if(block.image) {
            loadPicture(block.image);
            pictures.push({image:block.image,x,y:y+(geometry.height-block.imageSize)/2,size:block.imageSize,textX:detailsX,textY:rowYs[1]});
          }
          musicGroup={x,y,width:cardWidth,height:geometry.height,detailsX,statusY:rowYs[0],titleY:rowYs[1],artistY:rowYs[2] ?? null,iconY:rowYs[0]};
          y+=geometry.height+gap;paragraphIndex++;cursor={itemIndex:0,segmentIndex:0,graphemeIndex:0};placed=true;break;
        }
        if(!placed) {if(y+ideal.height>layout.pageHeight-layout.margin) break;y+=block.lineHeight;}
        continue;
      }
      const imageSize=block.imageSize;
      const lineHeight=block.image && cursor.itemIndex<=block.imageIndex ? Math.max(block.lineHeight,imageSize) : block.lineHeight;
      if (y+lineHeight>layout.pageHeight-layout.margin) break;
      const baselineOffset=(lineHeight-fontSize*.857)/2;
      const ranges=flowRanges(y,lineHeight);
      for (const range of ranges.filter(range=>range.right-range.left>=Math.max(40,fontSize*3))) {
        const geometry=layoutNextRichInlineLineRange(block.prepared,range.right-range.left,cursor);
        if (!geometry) {paragraphIndex++;cursor={itemIndex:0,segmentIndex:0,graphemeIndex:0};y+=gap;break;}
        // An indivisible icon + name must wait for a gap wide enough for both.
        if (geometry.width>range.right-range.left+.5) continue;
        const line=materializeRichInlineLineRange(block.prepared,geometry);
        let x=range.left;
        for (const fragment of line.fragments) {
          x+=fragment.gapBefore;
          let textX=x;
          if (block.image && fragment.itemIndex===block.imageIndex) {
            loadPicture(block.image);textX+=imageSize+8;
            pictures.push({image:block.image,x,y:y+(lineHeight-imageSize)/2,size:imageSize,textX,textY:y+baselineOffset});
          }
          lines.push({text:fragment.text,x:textX,y:y+baselineOffset,font,fontSize,color:block.parts[fragment.itemIndex]?.accent ? '#744338' : color});
          x+=fragment.occupiedWidth;
        }
        cursor=line.end;
        if (cursor.itemIndex>=block.itemCount) {
          paragraphIndex++;cursor={itemIndex:0,segmentIndex:0,graphemeIndex:0};y+=gap;break;
        }
      }
      y+=lineHeight;
    }
    surface!.dataset.bioComplete=String(paragraphIndex>=prepared.length);
    dirty=false;
  }
  function drawText(time:number) {
    ctx!.save(); ctx!.translate(offset.x,offset.y); ctx!.textBaseline='top';
    const cap=dropCapSize();
    ctx!.drawImage(dropCap,layout.margin,layout.margin,cap.drawWidth,cap.height);
    for (const picture of pictures) {
      const {x,y,size,image}=picture;
      const bitmap=media.get(image.src);
      if (bitmap) ctx!.drawImage(bitmap,x,y,size,size);
      if (image.kind!=='league') {ctx!.strokeStyle='rgba(0,0,0,.1)';ctx!.strokeRect(x+.5,y+.5,size-1,size-1);}
    }
    if (musicGroup) ctx!.drawImage(spotifyIcon,musicGroup.detailsX,musicGroup.iconY,14,14*spotifyIcon.naturalHeight/spotifyIcon.naturalWidth);
    if (musicGroup && track?.isPlaying) {
      ctx!.fillStyle='#744338';
      playbackBars(motion.matches ? 0 : time).forEach((bar,index)=>{
        const height=12*bar;
        ctx!.fillRect(musicGroup!.detailsX+20+index*4,musicGroup!.iconY+12-height,2,height);
      });
    }
    for (const line of lines) {
      ctx!.font=line.font;
      if (!hasActiveFire(dragon)) {ctx!.fillStyle=line.color;ctx!.fillText(line.text,Math.round(line.x),Math.round(line.y));continue;}
      let x=line.x;
      const halfAscent=line.fontSize*.857/2;
      for (const char of line.text) {
        const glyphKey=line.font+char;
        let charWidth=glyphWidths.get(glyphKey);
        if (charWidth===undefined) {charWidth=ctx!.measureText(char).width;glyphWidths.set(glyphKey,charWidth);}
        const influence=getFireInfluence(dragon,x+charWidth/2+offset.x,line.y+halfAscent+offset.y);
        const strength=influence.strength;
        if (strength<.01) {ctx!.fillStyle=line.color;ctx!.fillText(char,x,line.y);}
        else {
          ctx!.save();
          ctx!.translate(x+charWidth/2+influence.dx*strength*45,line.y+halfAscent+influence.dy*strength*45);
          ctx!.rotate(strength*(influence.dx>0 ? 1 : -1)*1.2);
          ctx!.globalAlpha=Math.max(0,1-strength*.8);
          ctx!.fillStyle=`rgb(${Math.round(42+strength*200)},${Math.round(26+strength*80)},10)`;
          ctx!.fillText(char,-charWidth/2,-halfAscent);ctx!.restore();
        }
        x+=charWidth;
      }
    }
    ctx!.restore();
  }
  function render(time:number) {
    frame=0;
    if (!visible || document.hidden) return;
    const animated=!motion.matches;
    const rest=restPosition();
    const moved=animated && updateDragon(dragon,time,mouse.x,mouse.y,!hasPointer,rest.x,rest.y);
    // Keep the reference's sustained breath without unbounded particle work.
    if (animated && held && dragon.fire.length<180) spawnFire(dragon);
    const fire=hasActiveFire(dragon);
    if (fire) updateFire(dragon,time);
    if (dirty || moved || fire) layoutText();
    ctx!.fillStyle=BG_COLOR;ctx!.fillRect(0,0,width,height);
    drawText(time);drawFire(ctx,dragon);drawDragon(ctx,dragon,animated);
    surface!.dataset.ready='true';
    canvas!.dataset.frame=String(++frames);canvas!.dataset.headX=String(Math.round(dragon.segments[0].x));
    canvas!.dataset.headY=String(Math.round(dragon.segments[0].y));canvas!.dataset.fireCount=String(dragon.fire.length);
    canvas!.dataset.musicGroup=JSON.stringify(musicGroup);
    canvas!.dataset.mediaCount=String(pictures.filter(picture=>media.has(picture.image.src)).length);
    canvas!.dataset.inlineMedia=JSON.stringify(pictures.map(picture=>({kind:picture.image.kind,x:picture.x,y:picture.y,size:picture.size,textX:picture.textX,textY:picture.textY})));
    if (animated) schedule();
  }
  function schedule() {if (!frame && visible && !document.hidden) frame=requestAnimationFrame(render);}
  function release() {held=false;}
  function point(event:PointerEvent) {
    if (motion.matches) return;
    mouse={x:Math.max(0,Math.min(width,event.clientX-bounds.left)),y:Math.max(0,Math.min(height,event.clientY-bounds.top))};
    hasPointer=true;schedule();
  }
  canvas.addEventListener('pointermove',point);
  canvas.addEventListener('pointerdown',event=>{
    if (event.button!==0 || motion.matches) return;
    point(event);held=true;
    if (event.pointerType==='touch') canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointerleave',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  window.addEventListener('pointerup',release);
  window.addEventListener('blur',release);
  window.addEventListener('scroll',()=>{bounds=surface.getBoundingClientRect();},{passive:true});
  document.addEventListener('visibilitychange',()=>{release();if (!document.hidden) schedule();});
  motion.addEventListener('change',()=>{
    release();dragon.fire=[];placeDragon();dirty=true;
    surface.dataset.paused=String(motion.matches);surface.dataset.running=String(visible && !motion.matches);schedule();
  });
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;surface.dataset.running=String(visible && !motion.matches);
    if (visible) schedule();
    else {release();dragon.fire=[];if (frame) cancelAnimationFrame(frame);frame=0;}
  }).observe(surface);
  new ResizeObserver(resize).observe(surface);
  surface.dataset.paused=String(motion.matches);
  placeDragon();resize();
}
