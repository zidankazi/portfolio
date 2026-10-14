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
  await expect(page.locator('.bio-cue')).toHaveCount(0);
  await expect(page.locator('.manuscript-fallback')).toContainText('I like trying new foods.');
  await expect(page.locator('.manuscript-fallback')).toContainText('I also collect CS2 skins. Right now I have a FN Damascus Steel Karambit and MW Snow Leopards.');
  await expect(page.locator('.manuscript-fallback')).toContainText('I used to be Challenger (top 300 out of 3,000,000).');
  await expect(page.locator('.manuscript-fallback')).toContainText("Right now I'm listening to");
  await expect(page.locator('.manuscript-fallback')).toContainText('Test track');
  await expect(page.locator('.manuscript-fallback')).toContainText('by Test artist');
  await expect(page.getByRole('link',{name:'email',exact:true})).toBeVisible();
  await expect(page.locator('.bio-music')).toContainText('Test track');
  await expect(page.locator('[data-slot="github-activity"]')).toContainText('contributions in the last year');
  await expect(page.locator('[data-date]')).toHaveCount(365);
  await expect(page.locator('.project-row')).toHaveCount(7);
  await expect(page.locator('#portfolio .intro-copy,#portfolio #spotify')).toHaveCount(0);
  await expect(page.locator('#portfolio')).not.toContainText('I design and build');
  await expect(page.locator('.text-fragment')).toHaveCount(0);
  await expect(page.locator('nav,h1,h2,h3,header,footer,details')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole('link',{name:'studio',exact:true})).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('project previews stay beside the list and play the original media',async({page},info)=>{
  test.skip(info.project.name!=='desktop','Side previews require a mouse and spare horizontal room');
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  const rows=page.locator('.project-row'),preview=page.locator('.project-hover-preview');
  await expect(preview).toBeHidden();await expect(preview.locator('video')).toHaveCount(0);
  const names=['relic','roster','multi-agent hide and seek','sponge','zilean','sage','orbital'];
  for (const [index,name] of names.entries()) {
    const row=rows.nth(index);await row.scrollIntoViewIfNeeded();await row.hover();
    await expect(preview).toHaveAttribute('data-active-project',name);await expect(preview).toBeVisible();
    const rowBox=await row.boundingBox(),box=await preview.boundingBox();
    expect(box.x>=rowBox.x+rowBox.width+20 || box.x+box.width<=rowBox.x-20).toBe(true);
    expect(box.x).toBeGreaterThanOrEqual(16);expect(box.y).toBeGreaterThanOrEqual(16);
    expect(box.x+box.width).toBeLessThanOrEqual(1440-16);expect(box.y+box.height).toBeLessThanOrEqual(1000-16);
    await expect.poll(()=>preview.locator('img').first().evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
    if ([0,1,5].includes(index)) {
      await expect(preview.locator('video')).toHaveAttribute('data-ready','true');
      expect(await preview.locator('video').evaluate(video=>!video.paused && video.muted && video.loop)).toBe(true);
    }
    if ([2,6].includes(index)) await expect(preview.locator('.project-preview-motion')).toHaveAttribute('data-ready','true');
    if (index===5) expect(box.height).toBeGreaterThan(box.width);
    if (index===0) await page.screenshot({path:info.outputPath('project-side-preview.png')});
    await page.mouse.move(20,20);await expect(preview).toBeHidden();
    if ([0,1,5].includes(index)) expect(await preview.locator('video').evaluate(video=>video.paused)).toBe(true);
  }
  await page.getByRole('link',{name:'relic',exact:true}).focus();
  await expect(preview).toHaveAttribute('data-active-project','relic');
  await page.keyboard.press('Escape');await expect(preview).toBeHidden();
  await page.emulateMedia({reducedMotion:'reduce'});
  await rows.first().hover();await expect(preview).toBeVisible();
  await expect(preview.locator('video,.project-preview-motion')).toHaveCount(0);
  await page.setViewportSize({width:900,height:800});await rows.first().hover();
  await expect(preview).toBeHidden();expect(errors).toEqual([]);
});

test('a failed preview clip leaves its poster visible and links usable',async({page},info)=>{
  test.skip(info.project.name!=='desktop','Side previews require a mouse');
  await page.route('**/projects/relic-loop.mp4',route=>route.fulfill({status:503}));
  await page.goto('/');await page.locator('.project-row').first().hover();
  const preview=page.locator('.project-hover-preview');
  await expect(preview).toBeVisible();
  await expect.poll(()=>preview.locator('img').evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
  await expect(preview.locator('video')).toHaveAttribute('data-ready','false');
  await expect(page.getByRole('link',{name:'relic',exact:true})).toHaveAttribute('href','https://tryrelic.io');
});

test('a separate scroll hint fades out and returns at the top',async({page})=>{
  await page.goto('/');
  const hint=page.locator('.scroll-hint'),surface=page.locator('#manuscript-scene');
  await expect(surface).toHaveAttribute('data-ready','true');
  await expect(hint).toHaveText('↓');
  await expect(hint).toHaveCSS('opacity','1');
  const hintBox=await hint.boundingBox(),heroBox=await surface.boundingBox();
  expect(Math.abs(hintBox.x+hintBox.width/2-heroBox.width/2)).toBeLessThan(1);
  expect(hintBox.y).toBeGreaterThan(heroBox.height-90);
  await page.evaluate(()=>window.scrollTo(0,100));
  await expect(hint).toHaveCSS('opacity','0');
  await page.evaluate(()=>window.scrollTo(0,0));
  await expect(hint).toHaveCSS('opacity','1');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.scroll-hint-arrow')).toHaveCSS('animation-name','none');
});

test('the entire dragon stops above the lower manuscript edge while scrolling',async({page})=>{
  await page.clock.install();await page.goto('/');
  const canvas=page.locator('#manuscript'),surface=page.locator('#manuscript-scene');
  await expect(surface).toHaveAttribute('data-ready','true');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const hero=await canvas.boundingBox();
  for (const x of [.8,.5,.2]) {
    await page.mouse.move(hero.width*x,hero.height-2);await page.clock.runFor(1600);
    expect(Number(await canvas.getAttribute('data-dragon-bottom'))).toBeLessThanOrEqual(hero.height-15.9);
  }
  await page.evaluate(height=>window.scrollTo(0,height*.35),hero.height);
  await page.mouse.move(hero.width*.8,hero.height*.65-2);await page.clock.runFor(1600);
  expect(Number(await canvas.getAttribute('data-dragon-bottom'))).toBeLessThanOrEqual(hero.height-15.9);
  // The boundary has clear parchment below it, rather than slicing any sprite.
  const darkPixels=await canvas.evaluate(node=>{
    const pixels=node.getContext('2d').getImageData(0,node.height-12,node.width,12).data;
    let count=0;for(let i=0;i<pixels.length;i+=4) if(pixels[i]<100 && pixels[i+1]<100 && pixels[i+2]<100) count++;
    return count;
  });
  expect(darkPixels).toBe(0);
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
  const pageOffset=(box.width-Math.min(760,box.width-16))/2;
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
      expect(image.textX-image.x).toBe(image.size+(image.kind==='album' ? 12 : 8));
      if(image.kind!=='album') expect(Math.abs(image.textY-image.y)).toBeLessThan(image.size/2);
    }
    const music=JSON.parse(await canvas.getAttribute('data-music-group'));
    const album=images.find(image=>image.kind==='album');
    expect(music.detailsX).toBe(album.textX);
    expect(music.titleY).toBeGreaterThan(music.statusY);
    expect(music.artistY).toBeGreaterThan(music.titleY);
    expect(album.y).toBeGreaterThanOrEqual(music.y);
    expect(album.y+album.size).toBeLessThanOrEqual(music.y+music.height);
    moved ||= images.some(image=>{const before=initial.find(item=>item.kind===image.kind);return image.x!==before.x || image.y!==before.y;});
  }
  expect(moved).toBe(true);
});

test('music stays readable when artwork or artist metadata is missing',async({page})=>{
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:{...track,albumArt:null,artist:null,isPlaying:false}}));
  await page.goto('/');
  const canvas=page.locator('#manuscript'),music=page.locator('.bio-music');
  await expect(music).toContainText('I last listened to');
  await expect(music).toContainText('Test track');
  await expect(music.locator('img')).toHaveCount(1);
  await expect(music.getByAltText('Spotify')).toHaveAttribute('src','/manuscript/spotify.svg');
  await expect(canvas).toHaveAttribute('data-media-count','2');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-bio-complete','true');
  const group=JSON.parse(await canvas.getAttribute('data-music-group'));
  expect(group.artistY).toBeNull();expect(group.detailsX).toBe(group.x);
});

test('live playback bars animate and disappear when listening stops',async({page})=>{
  await page.clock.install();await page.goto('/');
  const canvas=page.locator('#manuscript');
  await expect(canvas).toHaveAttribute('data-media-count','3');
  await expect(page.locator('.bio-music .now-playing')).toHaveCount(1);
  await expect(page.locator('#portfolio .now-playing')).toHaveCount(0);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const crop=async()=>{
    const box=await canvas.boundingBox();
    const music=JSON.parse(await canvas.getAttribute('data-music-group'));
    return page.screenshot({clip:{x:box.x+Math.round((box.width-Math.min(760,box.width-16))/2)+music.detailsX+20,y:box.y+20+music.iconY,width:14,height:12}});
  };
  const before=await crop();await page.clock.runFor(240);
  expect(await crop()).not.toEqual(before);
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:{...track,isPlaying:false}}));
  await page.clock.runFor(31000);
  await expect(page.locator('.bio-music')).toContainText('I last listened to');
  await expect(page.locator('.now-playing')).toHaveCount(0);
  const paused=await crop();await page.clock.runFor(240);
  expect(await crop()).toEqual(paused);
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

test('dragon keeps the last cursor position through idle time and tab switching',async({page,context})=>{
  await page.clock.install();await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const canvas=page.locator('#manuscript'),box=await canvas.boundingBox();
  const target={x:Math.round(box.width*.65),y:Math.round(box.height*.4)};
  await page.mouse.move(box.x+target.x,box.y+target.y);await page.clock.runFor(1500);
  await page.mouse.move(box.x+box.width+30,box.y+target.y);
  await page.clock.runFor(3000);
  const nearLastPointer=async()=>{
    expect(Math.abs(Number(await canvas.getAttribute('data-head-x'))-target.x)).toBeLessThan(7);
    expect(Math.abs(Number(await canvas.getAttribute('data-head-y'))-target.y)).toBeLessThan(7);
  };
  await nearLastPointer();
  const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();
  await page.clock.runFor(3500);
  await page.bringToFront();await other.close();await page.clock.runFor(1000);
  await nearLastPointer();
  expect(await canvas.getAttribute('data-fire-count')).toBe('0');
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
  await expect(page.locator('.bio-music .now-playing span').first()).toHaveCSS('animation-name','none');
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
  await page.goto('/');await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-spotify-state','empty');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  const before=await page.locator('#manuscript').getAttribute('data-frame');
  const projects=await page.locator('.project-row').allTextContents();
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:track}));
  await page.clock.fastForward(31000);await expect(page.locator('.bio-music')).toContainText('Test track');
  await expect(page.locator('.manuscript-fallback')).toContainText("Right now I'm listening to");
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
  await page.clock.fastForward(31000);await expect(page.locator('.bio-music')).toContainText('I last listened toTest track');
  await expect(page.locator('.manuscript-fallback')).toContainText('I last listened to');
  await expect(page.locator('#manuscript-scene a')).toHaveCount(0);
  expect(await page.locator('.project-row').allTextContents()).toEqual(projects);
});

test('manuscript fallback and portfolio links work without JavaScript',async({browser,request})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('http://localhost:3001/');
  await expect(page.locator('.manuscript-fallback')).toBeVisible();
  await expect(page.getByRole('link',{name:'email',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'relic',exact:true})).toHaveAttribute('href','https://tryrelic.io');
  expect((await request.get('/missing-page')).status()).toBe(404);
  expect((await request.get('/studio')).status()).toBe(404);
  expect((await (await request.get('/manifest.webmanifest')).json()).name).toBe('Zidan Kazi');
  const video=await request.get('/projects/relic-loop.mp4',{headers:{Range:'bytes=0-100'}});expect(video.status()).toBe(206);
  await context.close();
});
