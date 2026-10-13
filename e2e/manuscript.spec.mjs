import {test,expect} from '@playwright/test';
const calendar={contributions:Array.from({length:365},(_,index)=>({date:new Date(Date.UTC(2025,9,14+index)).toISOString().slice(0,10),count:index%5,level:index%5}))};
const track={title:'Test track',artist:'Test artist',url:'https://open.spotify.com/track/test',albumArt:null,isPlaying:true,progressMs:30000,durationMs:120000};
const visibleText = node => [...node.querySelectorAll('.text-fragment:not([hidden])')].map(fragment=>fragment.textContent).join('').replace(/\s/g,'');

test.beforeEach(async({page})=>{
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.fulfill({json:calendar}));
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:track}));
});

test('plain text, live widgets, links, and no decorative UI',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await expect(page.getByRole('link',{name:'Zidan Kazi',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Test track',exact:true})).toBeVisible();
  await expect(page.locator('[data-slot="github-activity"]')).toContainText('contributions in the last year');
  await expect(page.locator('[data-date]')).toHaveCount(365);
  await expect(page.locator('.project-row')).toHaveCount(7);
  await expect(page.locator('nav,h1,h2,h3,header,footer,details,img')).toHaveCount(0);
  await expect(page.getByRole('button',{name:/pause dragon|wake dragon/i})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const website=page.getByRole('link',{name:'websites for clients',exact:true});
  await expect(website).toHaveAttribute('href','/studio');await website.click();
  await expect(page).toHaveURL(/\/studio$/);await expect(page).toHaveTitle('studio · zidan kazi');
  await expect(page.getByRole('link',{name:'OMU',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Zidan Kazi',exact:true}).click();
  await expect(page).toHaveURL('/');
  expect(errors).toEqual([]);
});

test('dragon follows the whole viewport and reflows project paragraphs',async({page},info)=>{
  await page.goto('/');await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  const canvas=page.locator('#manuscript');await expect(canvas).toHaveCSS('position','fixed');
  await expect.poll(()=>page.locator('.flow-copy').first().evaluate(visibleText)).toContain("I'mZidanKazi,ajunioratStevensInstituteofTechnology");
  const firstProject=page.locator('.project-row').first();
  if(info.project.name==='desktop') {
    await firstProject.scrollIntoViewIfNeeded();
    const before=await firstProject.locator('.text-fragment').evaluateAll(nodes=>nodes.map(n=>n.style.transform).join('|'));
    const box=await firstProject.boundingBox();
    const x=box.x+box.width*.5,y=box.y+40;
    await page.mouse.move(x,y);
    await expect.poll(()=>canvas.getAttribute('data-head-x')).toMatch(/\d/);
    await expect.poll(async()=>Math.abs(Number(await canvas.getAttribute('data-head-x'))-x)).toBeLessThan(60);
    await expect.poll(()=>firstProject.locator('.text-fragment').evaluateAll(nodes=>nodes.map(n=>n.style.transform).join('|'))).not.toBe(before);
  }
  await expect.poll(()=>firstProject.evaluate(visibleText)).toContain('withasourcebehindeveryfact.');
  const lastProject=page.locator('.project-row').last();
  await expect.poll(()=>lastProject.evaluate(visibleText)).toContain('livesgp4mechanics.');
});

test('reflow moves persistent words through intermediate positions',async({page},info)=>{
  test.skip(info.project.name==='mobile','Pointer-driven reflow is a desktop interaction');
  await page.clock.install();await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const paragraph=page.locator('.project-row').first();
  const before=await paragraph.locator('.text-word').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.wordId,text:node.textContent,x:node.getBoundingClientRect().x,y:node.getBoundingClientRect().y})));
  const box=await paragraph.boundingBox();await page.mouse.move(box.x+box.width*.58,box.y+50);
  let previous=before,largestStep=0,changed=false;
  for(let frame=0;frame<24;frame++) {
    await page.clock.runFor(16);
    const current=await paragraph.locator('.text-word').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.wordId,text:node.textContent,x:node.getBoundingClientRect().x,y:node.getBoundingClientRect().y})));
    expect(current.map(word=>[word.id,word.text])).toEqual(before.map(word=>[word.id,word.text]));
    for(let i=0;i<current.length;i++) {const step=Math.hypot(current[i].x-previous[i].x,current[i].y-previous[i].y);largestStep=Math.max(largestStep,step);if(step>.2) changed=true;}
    previous=current;
  }
  expect(changed).toBe(true);expect(largestStep).toBeLessThan(110);
});

test('reduced motion keeps a static dragon without a visible control',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-paused','true');
  const head=await page.locator('#manuscript').getAttribute('data-head-x');
  await page.mouse.move(100,400);await page.mouse.move(700,250);
  expect(await page.locator('#manuscript').getAttribute('data-head-x')).toBe(head);
  await expect(page.getByRole('button',{name:/dragon/i})).toHaveCount(0);
});

test('hovering and focusing a link holds its position while the dragon is nearby',async({page})=>{
  await page.clock.install();await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  const name=page.getByRole('link',{name:'Zidan Kazi',exact:true});
  await name.hover();await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-interaction','reading');
  const before=await name.boundingBox();
  await page.clock.runFor(350);expect(await name.boundingBox()).toEqual(before);
  const project=page.locator('.project-title').first();await project.focus();
  const focused=await project.boundingBox();await page.clock.runFor(350);
  expect(await project.boundingBox()).toEqual(focused);
  await expect(project).toBeFocused();await expect(project).toHaveAttribute('href','https://tryrelic.io');
});

test('every project title and secondary link opens after cursor movement',async({page,context},info)=>{
  test.setTimeout(60_000);
  await context.route(/^https:\/\/(tryrelic\.io|github\.com|roster-dev\.vercel\.app|sponge-alpha\.vercel\.app|zilean\.app|youtu\.be|x\.com|arxiv\.org)(?:\/.*)?$/,route=>route.fulfill({contentType:'text/html',body:'<p>Project destination</p>'}));
  await page.goto('/');await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  const links=page.locator('.project-row a');await expect(links).toHaveCount(12);
  for(let index=0;index<12;index++) {
    const link=links.nth(index);await link.scrollIntoViewIfNeeded();
    const glyph=link.locator('.text-word').first();const box=await glyph.boundingBox();
    await page.mouse.move(box.x+280,box.y+120);await page.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:8});
    const expected=new URL(await link.getAttribute('href')).href;
    const opened=page.waitForEvent('popup');
    if(info.project.name==='mobile') await glyph.tap({timeout:4000});else await glyph.click({timeout:4000});
    const popup=await opened;await expect(popup).toHaveURL(expected);await popup.close();
  }
});

test('selected project text remains readable and does not move during copying',async({page})=>{
  await page.clock.install();await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  const selected=await page.locator('.project-row').first().evaluate(paragraph=>{
    const range=document.createRange();range.selectNodeContents(paragraph);
    const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
    return selection.toString();
  });
  expect(selected.replace(/\s+/g,' ')).toContain('memory that builds itself from your team');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-interaction','reading');
  await page.mouse.move(700,400);await page.clock.runFor(350);
  expect(await page.evaluate(()=>window.getSelection().toString())).toBe(selected);
});

test('small phones and tablets keep complete paragraphs inside the page',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  for (const width of [320,768]) {
    await page.setViewportSize({width,height:900});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect.poll(()=>page.locator('.project-row').last().evaluate(visibleText)).toContain('livesgp4mechanics.');
    expect(await page.locator('.flow-copy').evaluateAll(paragraphs=>paragraphs.every(paragraph=>[...paragraph.querySelectorAll('.text-fragment:not([hidden])')].every(span=>span.getBoundingClientRect().bottom<=paragraph.getBoundingClientRect().bottom+1)))).toBe(true);
  }
});

test('calendar recovers from failure and supports keyboard navigation',async({page})=>{
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.fulfill({status:503}));
  await page.goto('/');await expect(page.getByRole('button',{name:'Try again'})).toBeVisible();
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.fulfill({json:calendar}));
  await page.getByRole('button',{name:'Try again'}).click();await expect(page.locator('[data-date]')).toHaveCount(365);
  await page.locator('[data-date][tabindex="0"]').focus();await page.keyboard.press('Home');
  await expect(page.locator('[data-date]').first()).toBeFocused();await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('End');await expect(page.locator('[data-date]').last()).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('Spotify updates its sentence and recovers without losing project content',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install();
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:{title:null,isPlaying:false}}));
  await page.goto('/');await expect(page.locator('#spotify')).toHaveAttribute('data-state','empty');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:track}));
  await page.clock.fastForward(31000);await expect(page.getByRole('link',{name:'Test track',exact:true})).toBeVisible();
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({status:503}));
  await page.clock.fastForward(31000);await expect(page.getByRole('link',{name:'Test track',exact:true})).toBeVisible();
  await expect.poll(()=>page.locator('#spotify').evaluate(visibleText)).toContain('LastlistenedtoTesttrack');
  await expect.poll(()=>page.locator('.project-row').last().evaluate(visibleText)).toContain('livesgp4mechanics.');
});

test('server HTML and project links work without JavaScript',async({browser,request})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('http://localhost:3001/');
  await expect(page.getByRole('link',{name:'Zidan Kazi',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'relic',exact:true})).toHaveAttribute('href','https://tryrelic.io');
  await expect(page.getByText(/Stevens Institute of Technology/)).toBeVisible();
  expect((await request.get('/missing-page')).status()).toBe(404);
  expect((await (await request.get('/manifest.webmanifest')).json()).name).toBe('Zidan Kazi');
  const video=await request.get('/projects/relic-loop.mp4',{headers:{Range:'bytes=0-100'}});expect(video.status()).toBe(206);
  await context.close();
});
