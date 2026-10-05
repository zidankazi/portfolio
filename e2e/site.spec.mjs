import {test,expect} from '@playwright/test';
const calendar={contributions:Array.from({length:365},(_,index)=>({date:new Date(Date.UTC(2025,9,6+index)).toISOString().slice(0,10),count:index%5,level:index%5}))};
const track={title:'Test track',artist:'Test artist',url:'https://open.spotify.com/track/test',albumArt:null,isPlaying:true,progressMs:30000,durationMs:120000};

test.beforeEach(async({page})=>{
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.fulfill({json:calendar}));
  await page.route('**/api/spotify/now-playing',route=>route.fulfill({json:track}));
  await page.route('https://omu.food/**',route=>route.fulfill({contentType:'text/html',body:'<title>OMU</title><p>OMU</p>'}));
  await page.route('https://tryrelic.io/**',route=>route.fulfill({contentType:'text/html',body:'<title>Relic</title><p>Relic</p>'}));
});

test('conversation, live widgets, SVG entrance, and navigation',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#entrance')).toHaveAttribute('data-puppet-stage','ready',{timeout:10000});
  await expect(page.getByText('Test track',{exact:true})).toBeVisible();
  await expect(page.locator('[data-playback-progress]')).toHaveCSS('width',/\d+/);
  await expect(page.locator('[data-slot="github-activity"]')).toContainText('contributions in the last year');
  expect(await page.locator('[data-puppet-hand] svg').first().evaluate(el=>el.namespaceURI)).toBe('http://www.w3.org/2000/svg');
  expect(await page.locator('.puppet-threads path').first().getAttribute('d')).toMatch(/^M/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const button=page.locator('#projects button');
  if(info.project.name==='mobile') {
    await button.tap();await expect(button).toHaveAttribute('aria-expanded','true');
    await expect(page.locator('[data-project-preview="orbital"]')).toBeVisible();
    await button.tap();await expect(button).toHaveAttribute('aria-expanded','false');
    await expect(page.locator('iframe')).toHaveCount(0);
  } else {
    await button.hover();await expect(button).toHaveAttribute('aria-expanded','true');
    const row=page.locator('[data-project-preview="relic"]');await row.hover();
    await expect(page.locator('[data-project-hover-preview]')).toHaveAttribute('data-active-project','relic');
    await expect(page.locator('.preview-motion')).toHaveCount(1);
    await page.keyboard.press('Escape');await expect(page.locator('[data-project-hover-preview]')).toHaveCount(0);
  }
  await page.getByRole('link',{name:'I design and build websites for clients. Take a look'}).click();
  await expect(page).toHaveURL(/\/studio$/);await expect(page).toHaveTitle('studio · zidan kazi');
  await expect(page.getByRole('link',{name:'Visit OMU (opens in a new tab)'})).toBeVisible();
  if(info.project.name==='mobile') await expect(page.locator('iframe')).toHaveCount(0);
  else {await expect(page.locator('iframe')).toHaveCount(2);await expect(page.locator('iframe.ready')).toHaveCount(2,{timeout:10000});}
  await page.getByRole('link',{name:'back to the conversation'}).click();
  await expect(page).toHaveURL('/');await expect(page.locator('#entrance')).toHaveAttribute('data-puppet-stage','ready');
  await page.goBack();await expect(page).toHaveURL(/\/studio$/);await expect(page.getByRole('heading',{name:'Studio, websites by Zidan Kazi'})).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('calendar retry, keyboard navigation, reduced motion and progressive HTML',async({page,request},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.goto('/');
  const retry=page.getByRole('button',{name:'Try again'});await expect(retry).toBeVisible();
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.fulfill({json:calendar}));
  await retry.click();await expect(page.locator('[data-date]')).not.toHaveCount(0);
  const last=page.locator('[data-date][tabindex="0"]');await last.focus();
  await page.keyboard.press('Home');await expect(page.locator('[data-date]').first()).toBeFocused();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('End');await expect(page.locator('[data-date]').last()).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(page.locator('[data-project-hover-preview]')).toHaveCount(0);
  const html=await request.get('/');expect(html.status()).toBe(200);expect(await html.text()).toContain('Stevens Institute of Technology');
  const manifest=await request.get('/manifest.webmanifest');expect((await manifest.json()).name).toBe('Zidan Kazi');
  expect((await request.get('/missing-page')).status()).toBe(404);
});
