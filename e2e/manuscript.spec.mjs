import {test,expect} from '@playwright/test';
const calendar={contributions:Array.from({length:365},(_,index)=>({date:new Date(Date.UTC(2025,9,14+index)).toISOString().slice(0,10),count:index%5,level:index%5}))};
const track={title:'Test track',artist:'Test artist',url:'https://open.spotify.com/track/test',albumArt:null,isPlaying:true,progressMs:30000,durationMs:120000};
test.beforeEach(async({page})=>{
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.fulfill({json:calendar}));
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:track}));
});

test('manuscript, all projects, live widgets, and studio work',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Zidan Kazi',exact:true})).toBeVisible();
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#flow-text span')).not.toHaveCount(0);
  await expect(page.getByText('Test track',{exact:true})).toBeVisible();
  await expect(page.locator('[data-playback-progress]')).toHaveCSS('width',/\d+/);
  await expect(page.locator('[data-slot="github-activity"]')).toContainText('contributions in the last year');
  await expect(page.locator('[data-date]')).toHaveCount(365);
  await expect(page.locator('.project-row')).toHaveCount(7);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.project-detail').first().locator('summary').click();
  await expect(page.locator('.project-illustration').first()).toBeVisible();
  await page.locator('.project-detail').nth(1).locator('summary').click();
  await expect(page.locator('.project-detail').first()).not.toHaveAttribute('open','');
  await page.getByRole('link',{name:'Studio',exact:true}).click();
  await expect(page).toHaveURL(/\/studio$/); await expect(page).toHaveTitle('studio · zidan kazi');
  await expect(page.getByRole('heading',{name:'The studio'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Visit OMU'})).toBeVisible();
  await page.getByRole('link',{name:'Back to the manuscript'}).click();
  await expect(page.getByRole('heading',{name:'Zidan Kazi',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('Pretext copy stays complete during pointer-driven text exclusion',async({page},info)=>{
  await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  const normalized=await page.locator('#flow-text').evaluate(el=>el.textContent.replace(/\s/g,''));
  expect(normalized).toContain("'mZidan,ajunioratStevensInstituteofTechnology");
  expect(normalized).toContain('betweenthebrowserandtheterminal.');
  if(info.project.name==='desktop') {
    const before=await page.locator('#flow-text span').evaluateAll(nodes=>nodes.map(n=>n.style.transform).join('|'));
    const box=await page.locator('#manuscript-scene').boundingBox();
    await page.mouse.move(box.x+box.width*.45,box.y+100);
    await expect.poll(()=>page.locator('#flow-text span').evaluateAll(nodes=>nodes.map(n=>n.style.transform).join('|'))).not.toBe(before);
    await expect.poll(()=>page.locator('#flow-text').evaluate(el=>el.textContent.replace(/\s/g,''))).toContain('betweenthebrowserandtheterminal.');
  }
  expect(await page.locator('#flow-text').evaluate(el=>[...el.querySelectorAll('span:not([hidden])')].every(span=>span.getBoundingClientRect().bottom<=el.getBoundingClientRect().bottom+1))).toBe(true);
});

test('reduced motion starts paused and the animation can be controlled',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  const toggle=page.getByRole('button',{name:'Wake dragon'});await expect(toggle).toHaveAttribute('aria-pressed','true');
  await toggle.click();await expect(page.getByRole('button',{name:'Pause dragon'})).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Pause dragon'}).click();await expect(toggle).toHaveAttribute('aria-pressed','true');
});

test('small phones and tablets keep their content inside the page',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await expect(page.locator('#manuscript-scene')).toHaveAttribute('data-ready','true');
  for (const width of [320,768]) {
    await page.setViewportSize({width,height:900});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect.poll(()=>page.locator('#flow-text').evaluate(el=>el.textContent.replace(/\s/g,''))).toContain('betweenthebrowserandtheterminal.');
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

test('Spotify polls, handles an empty response, and marks stale data honestly',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.clock.install();
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:{title:null,isPlaying:false}}));
  await page.goto('/');await expect(page.locator('#spotify')).toHaveAttribute('data-state','empty');
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:track}));
  await page.clock.fastForward(31000);await expect(page.getByText('Test track',{exact:true})).toBeVisible();
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({status:503}));
  await page.clock.fastForward(31000);await expect(page.getByText('Test track',{exact:true})).toBeVisible();
  await expect(page.getByText('Last listened to',{exact:true})).toBeVisible();await expect(page.locator('[data-playback-progress]')).toHaveCount(0);
});

test('server HTML, routes, and content work without JavaScript',async({browser,request})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('http://localhost:3001/');
  await expect(page.getByRole('heading',{name:'Zidan Kazi',exact:true})).toBeVisible();
  await expect(page.getByText(/Stevens Institute of Technology/)).toBeVisible();
  await page.locator('summary').first().click();await expect(page.locator('.project-illustration').first()).toBeVisible();
  expect((await request.get('/missing-page')).status()).toBe(404);
  expect((await (await request.get('/manifest.webmanifest')).json()).name).toBe('Zidan Kazi');
  const video=await request.get('/projects/relic-loop.mp4',{headers:{Range:'bytes=0-100'}});expect(video.status()).toBe(206);
  await context.close();
});
