import {mountScene} from './scene.js';
import {projects} from './data.js';
import type {Track} from './spotify.js';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); node.className=className; node.textContent=text; return node;
}
const safeUrl = (value: unknown): value is string => typeof value === 'string' && value.startsWith('https://');

function mountProjects() {
  document.querySelectorAll<HTMLDetailsElement>('.project-detail').forEach(details => {
    const project = projects[Number(details.dataset.project)];
    const illustration = details.querySelector<HTMLElement>('.project-illustration')!;
    details.addEventListener('toggle', () => {
      const video = illustration.querySelector('video');
      if (!details.open) {video?.pause(); return;}
      document.querySelectorAll<HTMLDetailsElement>('.project-detail[open]').forEach(other => {if (other !== details) other.open=false;});
      if (!project.motion || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (project.motion.type === 'gif') {
        illustration.querySelector('img')!.src=project.motion.src;
      } else if (video) void video.play().catch(() => {});
      else {
        const media = element('video'); media.src=project.motion.src; media.poster=project.preview;
        media.muted=true; media.loop=true; media.playsInline=true; media.controls=true;
        media.setAttribute('aria-label', project.title+' project demonstration');
        illustration.replaceChildren(media); void media.play().catch(() => {});
      }
    });
  });
}

function mountSpotify() {
  const container = document.querySelector<HTMLElement>('#spotify');
  if (!container) return;
  let track: Track | null = null;
  let synced = Date.now();
  let signature = '';
  let loading = false;
  let ended = false;
  let progressBar: HTMLSpanElement | null = null;

  function paint(next: Track) {
    track=next; synced=Date.now(); ended=false;
    container!.dataset.state=next.title ? 'track' : 'empty';
    const nextSignature=JSON.stringify([next.title, next.artist, next.albumArt, next.url, next.isPlaying]);
    if (nextSignature === signature) return;
    signature=nextSignature;
    const record=element('div', 'record');
    if (safeUrl(next.albumArt)) {const image=element('img'); image.src=next.albumArt; image.alt='Album cover for '+next.title; image.width=64; image.height=64; record.append(image);}
    else record.append(element('span', '', 'z'));
    const info=element('div', 'track-info');
    info.append(element('span', 'eyebrow', next.title ? next.isPlaying ? 'Currently playing' : 'Last listened to' : 'A moment of quiet'));
    const title=element('p');
    if (next.title && safeUrl(next.url)) {const link=element('a', '', next.title); link.href=next.url; link.target='_blank'; link.rel='noopener noreferrer'; title.append(link);}
    else title.textContent=next.title || 'I listen to a lot of music.';
    info.append(title);
    if (next.artist) info.append(element('span', 'track-artist', next.artist));
    const mark=element('span', 'music-note', '♫'); mark.setAttribute('aria-hidden', 'true');
    container!.replaceChildren(record, info, mark);
    progressBar=null;
    if (next.isPlaying && typeof next.durationMs === 'number' && next.durationMs > 0 && typeof next.progressMs === 'number') {
      const rail=element('div', 'playback-rail'); rail.setAttribute('aria-hidden', 'true');
      progressBar=element('span'); progressBar.dataset.playbackProgress=''; rail.append(progressBar); info.append(rail);
    }
  }
  async function poll() {
    if (loading || document.hidden) return;
    loading=true;
    try {
      const response=await fetch('/api/spotify/now-playing', {signal:AbortSignal.timeout(12_000)});
      if (!response.ok) throw new Error('Unavailable');
      const next=await response.json() as Track;
      if (typeof next.isPlaying !== 'boolean' || !(typeof next.title === 'string' || next.title === null)) throw new Error('Invalid track');
      paint(next);
    } catch {if (track) paint({...track, isPlaying:false, progressMs:null});}
    finally {loading=false;}
  }
  setInterval(() => {
    if (!track?.isPlaying || !progressBar || !track.durationMs || typeof track.progressMs !== 'number') return;
    const progress=Math.min(track.durationMs, track.progressMs+Date.now()-synced);
    progressBar.style.width=(progress/track.durationMs*100)+'%';
    if (progress >= track.durationMs && !ended) {ended=true; setTimeout(poll, 2000);}
  }, 1000);
  setInterval(poll, 30_000);
  document.addEventListener('visibilitychange', () => {if (!document.hidden) void poll();});
  void poll();
}

type Day = {date: string; count: number; level: number};
function validDays(body: unknown): Day[] {
  if (!body || typeof body !== 'object' || !('contributions' in body) || !Array.isArray(body.contributions)) throw new Error('Invalid calendar');
  const days=body.contributions.filter((day: unknown): day is Day => {
    if (!day || typeof day !== 'object') return false;
    const candidate=day as Day;
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate.date) && Number.isFinite(Date.parse(candidate.date)) && Number.isSafeInteger(candidate.count) && candidate.count >= 0 && Number.isInteger(candidate.level) && candidate.level >= 0 && candidate.level <= 4;
  });
  if (!days.length) throw new Error('Empty calendar');
  return [...new Map(days.map(day => [day.date, day])).values()].sort((a,b) => a.date.localeCompare(b.date)).slice(-365);
}

function mountCalendar() {
  const container=document.querySelector<HTMLElement>('#github-activity');
  if (!container) return;
  let tooltip: HTMLElement | null=null;
  function hideTooltip() {tooltip?.remove(); tooltip=null;}
  function showTooltip(button: HTMLButtonElement) {
    hideTooltip();
    tooltip=element('div', 'calendar-tooltip', button.getAttribute('aria-label')!); tooltip.role='tooltip'; tooltip.id='calendar-tooltip';
    document.body.append(tooltip); button.setAttribute('aria-describedby', tooltip.id);
    const bounds=button.getBoundingClientRect();
    const tip=tooltip.getBoundingClientRect();
    tooltip.style.left=Math.max(8, Math.min(innerWidth-tip.width-8, bounds.left+bounds.width/2-tip.width/2))+'px';
    tooltip.style.top=Math.max(8, bounds.top-tip.height-9)+'px';
  }
  async function load() {
    hideTooltip(); container!.setAttribute('aria-busy', 'true');
    container!.replaceChildren(element('p', 'calendar-status', 'Fetching the record of work…'));
    try {
      const response=await fetch('https://github-contributions-api.jogruber.de/v4/zidankazi?y=last', {signal:AbortSignal.timeout(12_000)});
      if (!response.ok) throw new Error('Unavailable');
      const days=validDays(await response.json());
      const firstDay=new Date(days[0].date+'T00:00:00Z').getUTCDay();
      const weeks=Math.ceil((firstDay+days.length)/7);
      const scroll=element('div', 'calendar-scroll');
      const months=element('div', 'calendar-months'); months.style.gridTemplateColumns=`repeat(${weeks}, 1fr)`;
      let previousMonth=-1;
      for (let week=0; week<weeks; week++) {
        const date=new Date(days[Math.min(days.length-1, Math.max(0, week*7-firstDay))].date+'T00:00:00Z');
        const label=element('span');
        if (date.getUTCMonth() !== previousMonth) {label.textContent=date.toLocaleDateString('en-US', {month:'short', timeZone:'UTC'}); previousMonth=date.getUTCMonth();}
        months.append(label);
      }
      const grid=element('div', 'calendar-grid'); grid.setAttribute('role','group'); grid.setAttribute('aria-label','Daily GitHub contributions');
      grid.style.gridTemplateColumns=`repeat(${weeks}, 1fr)`;
      for (let i=0; i<firstDay; i++) {const spacer=element('span', 'day-spacer'); spacer.setAttribute('aria-hidden','true'); grid.append(spacer);}
      const buttons=days.map((day,i) => {
        const button=element('button', 'calendar-day'); button.type='button'; button.dataset.date=day.date; button.dataset.level=String(day.level);
        button.tabIndex=i===days.length-1 ? 0 : -1;
        const date=new Date(day.date+'T00:00:00Z').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric', timeZone:'UTC'});
        button.setAttribute('aria-label', `${day.count} ${day.count===1 ? 'contribution' : 'contributions'} on ${date}`);
        button.addEventListener('pointerenter', () => showTooltip(button));
        button.addEventListener('pointerleave', hideTooltip);
        button.addEventListener('focus', () => {buttons.forEach(item => {item.tabIndex=item===button ? 0 : -1;}); showTooltip(button);});
        button.addEventListener('blur', () => {button.removeAttribute('aria-describedby'); hideTooltip();});
        button.addEventListener('keydown', event => {
          if (event.key==='Escape') {hideTooltip(); return;}
          const movement: Record<string,number>={ArrowLeft:-7, ArrowRight:7, ArrowUp:-1, ArrowDown:1};
          let index=i;
          if (event.key==='Home') index=0;
          else if (event.key==='End') index=buttons.length-1;
          else if (event.key in movement) index=Math.max(0, Math.min(buttons.length-1, i+movement[event.key]));
          else return;
          event.preventDefault(); buttons[index].focus();
        });
        return button;
      });
      grid.append(...buttons); scroll.append(months, grid);
      const caption=element('div','calendar-caption');
      caption.append(element('span','', `${days.reduce((total,day) => total+day.count,0).toLocaleString()} contributions in the last year`));
      const legend=element('span','calendar-legend','Less ');
      for (let i=0; i<5; i++) {const swatch=element('i'); swatch.dataset.level=String(i); swatch.setAttribute('aria-hidden','true'); legend.append(swatch);}
      legend.append(' More'); caption.append(legend);
      container!.replaceChildren(scroll, caption);
      scroll.scrollLeft=scroll.scrollWidth;
    } catch {
      const error=element('div','calendar-error'); error.append(element('p','','The record is taking a little longer to arrive.'));
      const retry=element('button','','Try again'); retry.type='button'; retry.addEventListener('click', () => {void load();}); error.append(retry); container!.replaceChildren(error);
    } finally {container!.setAttribute('aria-busy','false');}
  }
  window.addEventListener('scroll',hideTooltip,{passive:true});
  window.addEventListener('resize',hideTooltip);
  void load();
}

mountProjects(); mountSpotify(); mountCalendar();
void mountScene().catch(() => {
  document.querySelector('#manuscript-scene')?.setAttribute('data-ready','false');
  const toggle=document.querySelector<HTMLButtonElement>('#motion-toggle'); if (toggle) toggle.hidden=true;
});
