import {projects} from './data.ts';

export function mountProjectPreviews():void {
  const list=document.querySelector<HTMLElement>('.project-list');
  if (!list) return;
  const hover=matchMedia('(hover: hover) and (pointer: fine)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const preview=document.createElement('div');
  preview.className='project-hover-preview';preview.dataset.visible='false';
  preview.setAttribute('aria-hidden','true');document.body.append(preview);
  let active:HTMLElement | null=null;
  let video:HTMLVideoElement | null=null;
  let pointer:{row:HTMLElement;x:number;y:number} | null=null;
  let frame=0;

  function dismiss() {
    active?.removeAttribute('data-preview-active');active=null;
    preview.dataset.visible='false';delete preview.dataset.activeProject;
    video?.pause();
    pointer=null;
    if (frame) cancelAnimationFrame(frame);frame=0;
  }
  function show(row:HTMLElement,y:number) {
    const project=projects[Number(row.dataset.project)];
    if (!project || !hover.matches || document.hidden) {dismiss();return;}
    const box=row.getBoundingClientRect();
    const gap=24,inset=16;
    const rightSpace=innerWidth-box.right-gap-inset;
    const leftSpace=document.querySelector('#project-dragon[data-visible="true"]') ? 0 : box.left-gap-inset;
    const side=rightSpace>=180 ? 'right' : leftSpace>=180 ? 'left' : null;
    // Keep the preview beside the list; never cover text or links to fit it in.
    if (!side || box.bottom<=0 || box.top>=innerHeight) {dismiss();return;}
    const preferred=project.previewSize ?? {width:280,height:210};
    const ratio=Math.min(1,(side==='right' ? rightSpace : leftSpace)/preferred.width,(innerHeight-inset*2)/preferred.height);
    const width=Math.round(preferred.width*ratio),height=Math.round(preferred.height*ratio);
    const x=side==='right' ? box.right+gap : box.left-gap-width;
    const top=Math.max(inset,Math.min(y-height/2,innerHeight-height-inset));
    preview.style.width=width+'px';preview.style.height=height+'px';
    preview.style.transform=`translate3d(${Math.round(x)}px,${Math.round(top)}px,0)`;
    if (active!==row) {
      active?.removeAttribute('data-preview-active');video?.pause();video=null;
      const poster=new Image();poster.src=project.preview;poster.alt='';
      preview.replaceChildren(poster);
      if (project.motion && !reduced.matches) {
        if (project.motion.type==='video') {
          video=document.createElement('video');video.className='project-preview-motion';
          video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';
          const clip=video;
          clip.addEventListener('playing',()=>{clip.dataset.ready='true';});
          clip.addEventListener('error',()=>{clip.dataset.ready='false';});
          preview.append(clip);clip.src=project.motion.src;
          void clip.play().catch(()=>{clip.dataset.ready='false';});
        } else {
          const animation=new Image();animation.className='project-preview-motion';animation.alt='';
          animation.onload=()=>{animation.dataset.ready='true';};
          animation.onerror=()=>{animation.dataset.ready='false';};
          preview.append(animation);animation.src=project.motion.src;
        }
      }
      active=row;row.dataset.previewActive='true';
    }
    preview.dataset.activeProject=project.title;preview.dataset.visible='true';
  }
  list.addEventListener('pointermove',event=>{
    if (event.pointerType!=='mouse') return;
    const row=(event.target as Element).closest<HTMLElement>('.project-row');
    if (!row) return;
    pointer={row,x:event.clientX,y:event.clientY};
    if (!frame) frame=requestAnimationFrame(()=>{frame=0;if(pointer) show(pointer.row,pointer.y);});
  },{passive:true});
  list.addEventListener('pointerleave',dismiss);
  list.addEventListener('focusin',event=>{
    const row=(event.target as Element).closest<HTMLElement>('.project-row');
    if(row) {const box=row.getBoundingClientRect();show(row,box.top+box.height/2);}
  });
  list.addEventListener('focusout',event=>{
    if (!(event.relatedTarget instanceof Node) || !list.contains(event.relatedTarget)) dismiss();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape') dismiss();});
  window.addEventListener('scroll',()=>{
    if (frame) cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      frame=0;
      const row=pointer ? document.elementFromPoint(pointer.x,pointer.y)?.closest<HTMLElement>('.project-row') : document.activeElement?.closest<HTMLElement>('.project-row');
      if (row) {const box=row.getBoundingClientRect();show(row,pointer?.y ?? box.top+box.height/2);}
      else dismiss();
    });
  },{passive:true});
  window.addEventListener('resize',dismiss);
  window.addEventListener('blur',dismiss);
  document.addEventListener('visibilitychange',()=>{if(document.hidden) dismiss();});
  hover.addEventListener('change',dismiss);reduced.addEventListener('change',dismiss);
}
