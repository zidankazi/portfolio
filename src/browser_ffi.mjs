import { Result$Ok, Result$Error } from './gleam.mjs';
import { next_index } from './lib/calendar.mjs';
import { mount_rail, mount_threads } from './motion_ffi.mjs';

export const format_number = value => value.toLocaleString('en-US');
export const pathname = () => window.location.pathname;
export const initial_track = () => document.getElementById('initial-track')?.dataset.track ?? '{"title":null}';
export const skip_entrance = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clock = () => Date.now();
export const delay = (ms, callback) => { setTimeout(callback, ms); };
export const preload = (src, callback) => {
  const image = new Image();
  image.onload = callback;
  image.src = src;
};
export const scroll_down = () => window.scrollBy({top: window.innerHeight * 0.8, behavior: skip_entrance() ? 'instant' : 'smooth'});
export const navigate = path => {
  if (window.location.pathname !== path) history.pushState(null, '', path);
  document.title = path === '/studio' ? 'studio · zidan kazi' : 'zidan kazi';
  document.querySelector('meta[name="description"]').content = path === '/studio' ? 'A few websites I have built: OMU, Relic, and Mille Works.' : 'builder portfolio of zidan kazi';
  window.scrollTo({top: 0, behavior: 'instant'});
};

export function request_text(url, callback) {
  fetch(url, {cache:'no-store', signal:AbortSignal.timeout(12_000)})
    .then(async response => callback(response.ok ? Result$Ok(await response.text()) : Result$Error(undefined)))
    .catch(() => callback(Result$Error(undefined)));
}

export function extract_colors(src, dispatch) {
  import('colorthief').then(({default: ColorThief}) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const colors = new ColorThief().getPalette(image, 3);
        if (colors?.length >= 2) {
          const [[r1,g1,b1],[r2,g2,b2]] = colors;
          dispatch(JSON.stringify({kind:'palette',src,r1,g1,b1,r2,g2,b2}));
        }
      } catch { /* Keep the last palette if the image cannot be sampled. */ }
    };
    image.src = src;
  }).catch(() => {});
}

let emit = () => {};
let calendarObserver;
export function measure_calendar() {
  calendarObserver?.disconnect();
  const container = document.querySelector('[data-slot="github-activity"]');
  if (!container) return;
  const measure = () => emit({kind:'size',width:Math.max(0, container.clientWidth - 32)});
  calendarObserver = new ResizeObserver(measure);
  calendarObserver.observe(container);
  measure();
}

export function clamp_tooltip() {
  const tooltip=document.getElementById('calendar-tooltip');
  if (!tooltip) return;
  const half=tooltip.offsetWidth/2;
  const left=parseFloat(tooltip.style.left);
  tooltip.style.left=Math.min(Math.max(left,8+half),window.innerWidth-8-half)+'px';
}

export function listen(dispatch) {
  emit = data => dispatch(JSON.stringify(data));
  const hover=matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
  const preview=matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const capability=() => emit({kind:'capability',hover:hover.matches});
  hover.addEventListener('change',capability);
  preview.addEventListener('change',() => emit({kind:'dismiss'}));
  capability();
  setInterval(() => { if (!document.hidden) emit({kind:'tick',now:Date.now()}); },1000);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) emit({kind:'poll'}); });
  let pointer;
  let pointerFrame=0;
  const move=() => {
    pointerFrame=0;
    if (!preview.matches || !pointer) return;
    const row=document.elementFromPoint(pointer.x,pointer.y)?.closest('[data-project-preview]');
    if (!row) { emit({kind:'dismiss'}); return; }
    const box=row.getBoundingClientRect();
    emit({kind:'hover',title:row.dataset.projectPreview,...pointer,left:box.left,right:box.right,width:window.innerWidth,height:window.innerHeight});
  };
  document.addEventListener('pointermove',event => {
    if(event.pointerType!=='mouse' || !preview.matches) return;
    pointer={x:event.clientX,y:event.clientY};
    if(!pointerFrame) pointerFrame=requestAnimationFrame(move);
  },{passive:true});
  const cue=() => emit({kind:'cue',visible:document.documentElement.scrollHeight-window.scrollY-window.innerHeight>140});
  window.addEventListener('scroll',() => {
    emit({kind:'hide-tooltip'}); cue();
    if(pointer && !pointerFrame) pointerFrame=requestAnimationFrame(move);
  },{passive:true});
  window.addEventListener('resize',() => { pointer=undefined; emit({kind:'dismiss'}); emit({kind:'hide-tooltip'}); cue(); });
  window.addEventListener('blur',() => { pointer=undefined; emit({kind:'dismiss'}); });
  document.addEventListener('pointerleave',() => { pointer=undefined; emit({kind:'dismiss'}); });
  document.addEventListener('keydown',event => {
    if(event.key==='Escape' || event.key==='Tab') { pointer=undefined; emit({kind:'dismiss'}); emit({kind:'hide-tooltip'}); }
    const cell=event.target.closest('[data-date]');
    if(!cell || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const cells=[...document.querySelectorAll('[data-date]')];
    cells[next_index(event.key,cells.indexOf(cell),cells.length)]?.focus();
  });
  const showTooltip=event => {
    const cell=event.target.closest('[data-date]');
    if(!cell) return;
    const rect=cell.getBoundingClientRect();
    emit({kind:'tooltip',label:cell.getAttribute('aria-label'),date:cell.dataset.date,x:rect.left+rect.width/2,y:rect.top});
  };
  document.addEventListener('pointerover',showTooltip);
  document.addEventListener('pointerdown',showTooltip);
  document.addEventListener('pointerout',event => { if(event.target.closest('[data-date]')) emit({kind:'hide-tooltip'}); });
  document.addEventListener('focusin',event => {
    emit({kind:'focus',inside:!!event.target.closest('#projects')});
    showTooltip(event);
  });
  document.addEventListener('focusout',event => {
    if(!event.relatedTarget?.closest('#projects')) emit({kind:'focus',inside:false});
    emit({kind:'hide-tooltip'});
  });
  document.addEventListener('click',event => {
    const link=event.target.closest('a');
    if(!link || event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target==='_blank' || link.hasAttribute('download')) return;
    const url=new URL(link.href);
    if(url.origin!==location.origin || !['/','/studio'].includes(url.pathname) || url.hash) return;
    event.preventDefault();
    pointer=undefined;
    emit({kind:'navigate',path:url.pathname});
  });
  window.addEventListener('popstate',() => emit({kind:'navigate',path:location.pathname}));
  const observer=new ResizeObserver(cue);
  observer.observe(document.documentElement);
  cue();
  document.addEventListener('loadeddata',event => {
    const media=event.target;
    if(media.matches?.('video.preview-motion')) { media.muted=true; media.play().catch(() => {}); }
  },true);
  document.addEventListener('playing',event => { if(event.target.matches('.preview-motion')) event.target.classList.add('media-ready'); },true);
  document.addEventListener('load',event => { if(event.target.matches?.('.preview-motion')) event.target.classList.add('media-ready'); },true);
  document.addEventListener('error',event => { if(event.target.matches?.('.preview-motion')) event.target.classList.remove('media-ready'); },true);
}

let disposeScene = () => {};
export function mount_scene(path, skip, dispatch) {
  disposeScene();
  calendarObserver?.disconnect();
  const emit=data => dispatch(JSON.stringify(data));
  const disposals=[];
  let disposed=false;
  disposeScene=() => { disposed=true; disposals.forEach(dispose => dispose()); };
  if(path==='/studio') { mountStudio(disposals, emit); return; }
  measure_calendar();
  const rows=document.getElementById('project-rows');
  const list=document.querySelector('.project-list');
  if(rows && list) {
    const measure=() => list.style.setProperty('--project-list-height',rows.scrollHeight+'px');
    const observer=new ResizeObserver(measure); observer.observe(rows); measure();
    disposals.push(() => observer.disconnect());
  }
  document.querySelectorAll('[data-sigil-side]').forEach(rail => disposals.push(mount_rail(rail,rail.dataset.sigilSide)));
  const root=document.querySelector('.puppet-scene');
  const front=document.querySelector('[data-puppet-front]');
  if(!root || !front) return;
  const animations=[];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const finish=() => {
    if(disposed) return;
    emit({kind:'stage',stage:skip || reduced.matches ? 'ready':'threading'});
    disposals.push(mount_threads(root,front,skip,() => emit({kind:'stage',stage:'ready'})));
  };
  const cancel=() => animations.forEach(animation => animation.finish());
  const keyboard=event => { if(event.key==='Tab') cancel(); };
  reduced.addEventListener('change',cancel);
  window.addEventListener('keydown',keyboard);
  disposals.push(() => { reduced.removeEventListener('change',cancel); window.removeEventListener('keydown',keyboard); animations.forEach(animation=>animation.cancel()); });
  if(skip || reduced.matches) { finish(); return; }
  for(const side of ['left','right']) {
    const hand=root.querySelector(`[data-puppet-hand="${side}"]`);
    const from=side==='left'?'translate3d(-9px,-260px,0) rotate(-7deg)':'translate3d(11px,-275px,0) rotate(9deg)';
    const animation=hand.animate([{transform:from},{transform:'translate3d(0,0,0) rotate(0deg)'}],{duration:side==='left'?1220:1340,delay:side==='left'?40:180,easing:'cubic-bezier(.22,.1,.25,1)',fill:'both'});
    animations.push(animation);
  }
  Promise.all(animations.map(animation=>animation.finished.catch(()=>{}))).then(finish);
}

function mountStudio(disposals, emit) {
  const media=matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  document.querySelectorAll('[data-live-src]').forEach(container => {
    if(!container.dataset.liveSrc) return;
    const update=() => emit({kind:'studio-size',name:container.dataset.liveName,width:media.matches?container.clientWidth:0});
    const observer=new ResizeObserver(update); observer.observe(container);
    media.addEventListener('change',update); update();
    disposals.push(() => { observer.disconnect(); media.removeEventListener('change',update); });
  });
}
