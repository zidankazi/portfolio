import {test,expect} from '@playwright/test';
const calendar={contributions:Array.from({length:365},(_,index)=>({date:new Date(Date.UTC(2025,9,14+index)).toISOString().slice(0,10),count:index%5,level:index%5}))};
const cover='https://i.scdn.co/image/portfolio-test-cover';
const track={title:'Test track',artist:'Test artist',url:'https://open.spotify.com/track/test',albumArt:cover,isPlaying:true,progressMs:30000,durationMs:120000};

test.beforeEach(async({page})=>{
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.fulfill({json:calendar}));
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:track}));
  await page.route(cover,route=>route.fulfill({path:'public/android-chrome-192x192.png',contentType:'image/png',headers:{'Access-Control-Allow-Origin':'*'}}));
});

test('manuscript sits above a normal portfolio with live widgets and project links',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#manuscript-scene a')).toHaveCount(0);
  await expect(page.locator('.manuscript-fallback')).toContainText('I like trying new foods.');
  await expect(page.locator('.manuscript-fallback')).toContainText('I also collect CS2 skins.');
  await expect(page.locator('.manuscript-fallback')).toContainText('I used to be Challenger.');
  await expect(page.locator('.manuscript-fallback')).toContainText('Listening now');
  await expect(page.locator('.manuscript-fallback')).toContainText('Test track');
  await expect(page.locator('.manuscript-fallback')).toContainText('by Test artist');
  await expect(page.getByRole('link',{name:'Zidan Kazi',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Test track',exact:true})).toBeVisible();
  await expect(page.locator('[data-slot="github-activity"]')).toContainText('contributions in the last year');
  await expect(page.locator('[data-date]')).toHaveCount(365);
  await expect(page.locator('.project-row')).toHaveCount(7);
  await expect(page.locator('.text-fragment')).toHaveCount(0);
  await expect(page.locator('nav,h1,h2,h3,header,footer,details')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('link',{name:'websites for clients',exact:true}).click();
  await expect(page).toHaveURL(/\/studio$/);await expect(page).toHaveTitle('studio · zidan kazi');
  await expect(page.locator('#manuscript')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'OMU',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Zidan Kazi',exact:true}).click();
  await expect(page).toHaveURL('/');expect(errors).toEqual([]);
});

test('real game logos and album artwork flow together with their text',async({page})=>{
  await page.clock.install();await page.goto('/');
  const canvas=page.locator('#manuscript');
  await expect(canvas).toHaveAttribute('data-media-count','3');
  await expect(page.getByAltText('League of Legends logo')).toHaveAttribute('src','/manuscript/league.png');
  await expect(page.getByAltText('Counter-Strike 2 logo')).toHaveAttribute('src','/manuscript/cs2.jpg');
  await expect(page.getByAltText('Test track album cover')).toHaveAttribute('src',cover);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const read=async()=>JSON.parse(await canvas.getAttribute('data-inline-media'));
  const initial=await read(),box=await canvas.boundingBox();
  const pageOffset=(box.width-Math.min(760,box.width-24))/2;
  let moved=false;
  for (const delta of [0,70,-50]) {
    const league=initial.find(image=>image.kind==='league');
    await page.mouse.move(box.x+pageOffset+league.textX+delta,box.y+12+league.y);
    await page.clock.runFor(650);
    const images=await read();
    expect(images.map(image=>image.kind)).toEqual(['league','cs2','album']);
    await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-bio-complete','true');
    for (const image of images) {
      // The occupied inline item carries both artwork and adjacent words.
      expect(image.textX-image.x).toBe(image.size+8);
      expect(Math.abs(image.textY-image.y)).toBeLessThan(image.size/2);
    }
    moved ||= images.some(image=>{const before=initial.find(item=>item.kind===image.kind);return image.x!==before.x || image.y!==before.y;});
  }
  expect(moved).toBe(true);
});

test('holding the manuscript sustains fire until release',async({page})=>{
  await page.clock.install();await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const canvas=page.locator('#manuscript');const box=await canvas.boundingBox();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.4);await page.mouse.down();
  await page.clock.runFor(400);expect(Number(await canvas.getAttribute('data-fire-count'))).toBeGreaterThan(0);
  await page.clock.runFor(1800);expect(Number(await canvas.getAttribute('data-fire-count'))).toBeGreaterThan(0);
  expect(Number(await canvas.getAttribute('data-fire-count'))).toBeLessThan(185);
  await page.mouse.up();await page.clock.runFor(1800);
  expect(await canvas.getAttribute('data-fire-count')).toBe('0');
});

test('touch supports sustained fire and normal page scrolling',async({page,context},info)=>{
  test.skip(info.project.name!=='mobile','Touch input is verified in the phone configuration');
  await page.clock.install();await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const input=await context.newCDPSession(page);
  const {width,height}=page.viewportSize(),x=Math.round(width*.6),y=Math.round(height*.6);
  await input.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await page.clock.runFor(1400);
  expect(Number(await page.locator('#manuscript').getAttribute('data-fire-count'))).toBeGreaterThan(0);
  for(let step=1;step<=5;step++) await input.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*40}]});
  await input.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.clock.runFor(1800);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(50);
  expect(await page.locator('#manuscript').getAttribute('data-fire-count')).toBe('0');
  await input.detach();
});

test('idle wings keep moving while the pointer is still',async({page})=>{
  await page.clock.install();await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const canvas=page.locator('#manuscript');const before=await canvas.screenshot();
  await page.clock.runFor(400);expect(await canvas.screenshot()).not.toEqual(before);
});

test('dragon is clipped to the manuscript and stops rendering below it',async({page})=>{
  await page.clock.install();await page.goto('/');
  const surface=page.locator('#manuscript-scene'),canvas=page.locator('#manuscript');
  await expect(surface).toHaveAttribute('data-ready','true');
  await expect(canvas).toHaveCSS('position','absolute');await expect(surface).toHaveCSS('overflow','hidden');
  const heroBox=await surface.boundingBox(),portfolioBox=await page.locator('#portfolio').boundingBox();
  expect(portfolioBox.y).toBeGreaterThanOrEqual(heroBox.y+heroBox.height);
  await page.locator('.project-row').last().scrollIntoViewIfNeeded();
  await expect(surface).toHaveAttribute('data-running','false');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const frame=await canvas.getAttribute('data-frame');
  const before=await page.locator('.project-row').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return [b.x,b.y,b.width,b.height,node.textContent];}));
  await page.mouse.move(100,200);await page.mouse.move(300,500,{steps:12});await page.clock.runFor(1500);
  expect(await canvas.getAttribute('data-frame')).toBe(frame);
  expect(await page.locator('.project-row').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return [b.x,b.y,b.width,b.height,node.textContent];}))).toEqual(before);
  await expect(page.locator('#portfolio')).toHaveCSS('transform','none');
});

test('reduced motion keeps the manuscript static and disables fire',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install();await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-paused','true');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const canvas=page.locator('#manuscript'),before=await canvas.screenshot(),frame=await canvas.getAttribute('data-frame');
  await page.mouse.move(100,400);await page.mouse.down();await page.clock.runFor(500);await page.mouse.up();
  expect(await canvas.screenshot()).toEqual(before);expect(await canvas.getAttribute('data-frame')).toBe(frame);
  expect(await canvas.getAttribute('data-fire-count')).toBe('0');
});

test('every project title and secondary link opens after cursor movement',async({page,context},info)=>{
  test.setTimeout(60_000);
  await context.route(/^https:\/\/(tryrelic\.io|github\.com|roster-dev\.vercel\.app|sponge-alpha\.vercel\.app|zilean\.app|youtu\.be|x\.com|arxiv\.org)(?:\/.*)?$/,route=>route.fulfill({contentType:'text/html',body:'<p>Project destination</p>'}));
  await page.goto('/');await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  const links=page.locator('.project-row a');await expect(links).toHaveCount(12);
  for(let index=0;index<12;index++) {
    const link=links.nth(index);await link.scrollIntoViewIfNeeded();const box=await link.boundingBox();
    await page.mouse.move(box.x+280,box.y+120);await page.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:8});
    const expected=new URL(await link.getAttribute('href')).href,opened=page.waitForEvent('popup');
    if(info.project.name==='mobile') await link.tap();else await link.click();
    const popup=await opened;await expect(popup).toHaveURL(expected);await popup.close();
  }
});

test('project text copies normally without changing selection',async({page})=>{
  await page.clock.install();await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await page.locator('.project-row').first().scrollIntoViewIfNeeded();
  const selected=await page.locator('.project-row').first().evaluate(paragraph=>{
    const range=document.createRange();range.selectNodeContents(paragraph);
    const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);return selection.toString();
  });
  expect(selected).toContain('memory that builds itself from your team');
  await page.mouse.move(100,400);await page.clock.runFor(350);
  expect(await page.evaluate(()=>window.getSelection().toString())).toBe(selected);
});

test('small phones and tablets retain complete content without horizontal overflow',async({page})=>{
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:{...track,title:'Supercalifragilisticexpialidocious (live)'}}));
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  for(const [width,height] of [[320,600],[390,844],[768,900],[1512,698]]) {
    await page.setViewportSize({width,height});
    await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-bio-complete','true');
    const section=await page.locator('#manuscript-scene').boundingBox();
    expect(section.height).toBe(height);
    if(width===390) await page.screenshot({path:test.info().outputPath('one-screen-phone.png')});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('.project-row').last()).toContainText('live sgp4 mechanics.');
    expect(await page.locator('.project-row a').evaluateAll(links=>links.every(link=>getComputedStyle(link).position==='static'))).toBe(true);
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

test('Spotify updates and recovers without moving or rewriting projects',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install();
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:{title:null,isPlaying:false}}));
  await page.goto('/');await expect(page.locator('#spotify')).toHaveAttribute('data-state','empty');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  const before=await page.locator('#manuscript').getAttribute('data-frame');
  const projects=await page.locator('.project-row').allTextContents();
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:track}));
  await page.clock.fastForward(31000);await expect(page.getByRole('link',{name:'Test track',exact:true})).toBeVisible();
  await expect(page.locator('.manuscript-fallback')).toContainText('Listening now');
  await expect(page.locator('.manuscript-fallback')).toContainText('Test track');
  await expect(page.locator('.manuscript-fallback')).toContainText('by Test artist');
  await expect.poll(()=>page.locator('#manuscript').getAttribute('data-frame')).not.toBe(before);
  const nextCover=cover+'-next';
  await page.route(nextCover,route=>route.fulfill({path:'public/android-chrome-192x192.png',contentType:'image/png',headers:{'Access-Control-Allow-Origin':'*'}}));
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:{...track,albumArt:nextCover}}));
  await page.clock.fastForward(31000);
  await expect(page.getByAltText('Test track album cover')).toHaveAttribute('src',nextCover);
  await expect(page.locator('#manuscript')).toHaveAttribute('data-media-count','3');
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({status:503}));
  await page.clock.fastForward(31000);await expect(page.locator('#spotify')).toContainText('Last listened to Test track');
  await expect(page.locator('.manuscript-fallback')).toContainText('Last listened to');
  await expect(page.locator('#manuscript-scene a')).toHaveCount(0);
  expect(await page.locator('.project-row').allTextContents()).toEqual(projects);
});

test('manuscript fallback and portfolio links work without JavaScript',async({browser,request})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('http://localhost:3001/');
  await expect(page.locator('.manuscript-fallback')).toBeVisible();
  await expect(page.getByRole('link',{name:'Zidan Kazi',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'relic',exact:true})).toHaveAttribute('href','https://tryrelic.io');
  expect((await request.get('/missing-page')).status()).toBe(404);
  expect((await (await request.get('/manifest.webmanifest')).json()).name).toBe('Zidan Kazi');
  const video=await request.get('/projects/relic-loop.mp4',{headers:{Range:'bytes=0-100'}});expect(video.status()).toBe(206);
  await context.close();
});
