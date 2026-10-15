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
    {node:projects,label:'projects',major:true},
    ...rows.map(node=>{
      return {node,label:node.querySelector('.project-title')!.textContent!,major:false};
    }),
    {node:activity,label:'github',major:true},
    {node:contact,label:'say hello',major:true},
  ];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const rail=document.createElement('nav');rail.className='page-ticker';
  rail.setAttribute('aria-label','Page sections');
  const links=sections.map(({node,label,major})=>{
    const link=document.createElement('a');link.className='ticker-link';link.href='#'+node.id;
    link.setAttribute('aria-label','Go to '+label);link.dataset.major=String(major);
    const dash=document.createElement('span');dash.className='ticker-dash';dash.setAttribute('aria-hidden','true');
    const caption=document.createElement('span');caption.className='ticker-label';caption.textContent=label;caption.setAttribute('aria-hidden','true');
    link.append(dash,caption);
    link.addEventListener('click',event=>{
      if(event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();history.replaceState(null,'','#'+node.id);
      const top=node===hero ? 0 : node.getBoundingClientRect().top+scrollY-48;
      window.scrollTo({top,behavior:reduced.matches ? 'instant' : 'smooth'});
    });
    rail.append(link);return link;
  });
  document.body.append(rail);
  let offsets:number[]=[];
  let active=-1,frame=0,proximityFrame=0,pointerY:number | null=null;
  let railTop=0,railHeight=0,idle:ReturnType<typeof setTimeout> | undefined;
  function update() {
    frame=0;
    const anchor=scrollY+Math.min(180,innerHeight*.24);
    let next=0;
    offsets.forEach((top,index)=>{if(top<=anchor) next=index;});
    if(scrollY+innerHeight>=document.documentElement.scrollHeight-4) next=links.length-1;
    if(next===active) return;
    links[active]?.removeAttribute('aria-current');active=next;
    links[active].setAttribute('aria-current','location');
  }
  function schedule() {if(!frame) frame=requestAnimationFrame(update);}
  function measure() {
    offsets=sections.map(({node})=>node===hero ? 0 : node.getBoundingClientRect().top+scrollY);
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
