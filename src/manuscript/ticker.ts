// Native document minimap inspired by Rare UI's proximity sidebar.
export function mountTicker():void {
  const hero=document.querySelector<HTMLElement>('#manuscript-scene');
  const projects=document.querySelector<HTMLElement>('#projects');
  const activity=document.querySelector<HTMLElement>('#github-activity');
  const contact=document.querySelector<HTMLElement>('#contact');
  if(!hero || !projects || !activity || !contact) return;
  const rows=[...projects.querySelectorAll<HTMLElement>('.project-row')];
  const sections=[
    {node:hero,label:'about',major:true},
    {node:activity,label:'github',major:true},
    {node:projects,label:'projects',major:true},
    ...rows.map(node=>{
      return {node,label:node.querySelector('.project-title')!.textContent!,major:false};
    }),
    {node:contact,label:'say hello',major:true},
  ];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const rail=document.createElement('nav');rail.className='page-ticker';
  rail.setAttribute('aria-label','Page sections');
  const tickCount=25;
  let maximumScroll=0;
  const links=Array.from({length:tickCount},(_,index)=>{
    const link=document.createElement('a');link.className='ticker-link';
    link.dataset.progress=String(index/(tickCount-1));
    const dash=document.createElement('span');dash.className='ticker-dash';dash.setAttribute('aria-hidden','true');
    const caption=document.createElement('span');caption.className='ticker-label';caption.setAttribute('aria-hidden','true');
    link.append(dash,caption);
    link.addEventListener('click',event=>{
      if(event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();history.replaceState(null,'',link.getAttribute('href')!);
      const top=maximumScroll*index/(tickCount-1);
      window.scrollTo({top,behavior:reduced.matches ? 'instant' : 'smooth'});
    });
    rail.append(link);return link;
  });
  document.body.append(rail);
  let active=-1,frame=0,proximityFrame=0,pointerY:number | null=null;
  let railTop=0,railHeight=0,idle:ReturnType<typeof setTimeout> | undefined;
  function update() {
    frame=0;
    const next=maximumScroll>0 ? Math.max(0,Math.min(tickCount-1,Math.round(scrollY/maximumScroll*(tickCount-1)))) : 0;
    if(next===active) return;
    links[active]?.removeAttribute('aria-current');active=next;
    links[active].setAttribute('aria-current','location');
  }
  function schedule() {if(!frame) frame=requestAnimationFrame(update);}
  function measure() {
    const documentHeight=document.documentElement.scrollHeight;
    maximumScroll=Math.max(0,documentHeight-innerHeight);
    const offsets=sections.map(({node})=>node===hero ? 0 : node.getBoundingClientRect().top+scrollY);
    // Equal intervals represent the whole page. Named landmarks occupy their
    // nearest tick, with room reserved for the remaining landmarks below them.
    const landmarks=new Map<number,typeof sections[number]>();
    let previous=-1;
    sections.forEach((section,index)=>{
      const desired=index===sections.length-1 ? tickCount-1 : Math.round(offsets[index]/documentHeight*(tickCount-1));
      const slot=Math.max(previous+1,Math.min(tickCount-(sections.length-index),desired));
      landmarks.set(slot,section);previous=slot;
    });
    links.forEach((link,index)=>{
      const progress=index/(tickCount-1),landmark=landmarks.get(index);
      const position=progress*documentHeight;
      let context=sections[0];
      sections.forEach((section,sectionIndex)=>{if(offsets[sectionIndex]<=position) context=section;});
      const label=landmark?.label ?? context.label+' · '+Math.round(progress*100)+'%';
      const href='#'+(landmark ?? context).node.id,major=String(landmark?.major ?? false);
      if(link.getAttribute('href')!==href) link.href=href;
      if(link.getAttribute('aria-label')!=='Go to '+label) link.setAttribute('aria-label','Go to '+label);
      if(link.dataset.major!==major) link.dataset.major=major;
      const caption=link.querySelector('.ticker-label')!;
      if(caption.textContent!==label) caption.textContent=label;
    });
    const box=rail.getBoundingClientRect();railTop=box.top;railHeight=box.height;schedule();
  }
  function proximity() {
    proximityFrame=0;
    links.forEach((link,index)=>{
      const distance=pointerY===null ? Infinity : Math.abs(pointerY-railTop-(index+.5)*(railHeight-24)/links.length-12);
      const amount=reduced.matches ? 0 : Math.max(0,1-distance/72);
      link.style.setProperty('--near',String(amount*amount));
    });
  }
  rail.addEventListener('pointermove',event=>{
    pointerY=event.clientY;if(!proximityFrame) proximityFrame=requestAnimationFrame(proximity);
  },{passive:true});
  rail.addEventListener('pointerleave',()=>{pointerY=null;if(!proximityFrame) proximityFrame=requestAnimationFrame(proximity);});
  window.addEventListener('scroll',()=>{
    rail.dataset.scrolling='true';clearTimeout(idle);
    idle=setTimeout(()=>{rail.dataset.scrolling='false';},400);schedule();
  },{passive:true});
  window.addEventListener('resize',measure);
  reduced.addEventListener('change',()=>{pointerY=null;proximity();});
  const observer=new ResizeObserver(measure);observer.observe(hero);observer.observe(document.querySelector('#portfolio')!);
  measure();
}
