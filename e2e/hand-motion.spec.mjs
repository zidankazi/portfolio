import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.route('**/api/spotify/**',route=>route.fulfill({json:{title:null,isPlaying:false}}));
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.fulfill({json:{contributions:[]}}));
});

test('articulated hands keep all eight strings attached during plucking and idle motion',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-hand-part]')).toHaveCount(12);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('#entrance')).toHaveAttribute('data-puppet-stage','threading');
  const sample=()=>page.evaluate(async()=>{
    let error=0;
    let joinError=0;
    const bodies=[...document.querySelectorAll('path[id^="puppet-thread-"]')];
    const initial=bodies.map(path=>path.getAttribute('d'));
    let longPathChanges=0;
    const poses=new Set();
    for(let frame=0;frame<40;frame++) {
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const paths=[...document.querySelectorAll('[data-thread-lead]')];
      bodies.forEach((path,index)=>{if(path.getAttribute('d')!==initial[index])longPathChanges++;});
      const hands=[...document.querySelectorAll('[data-puppet-hand]')];
      poses.add(hands.map(hand=>hand.style.transform).join('|'));
      hands.forEach((hand,side)=>{
        [...hand.querySelectorAll('[data-finger-wrap]')].reverse().forEach((wrap,index)=>{
          const tail=[...wrap.querySelectorAll('[data-wrap-reveal]')].at(-1);
          const tip=tail.getPointAtLength(tail.getTotalLength()).matrixTransform(tail.getScreenCTM());
          const path=paths[side*4+index];
          const start=path.getPointAtLength(0).matrixTransform(path.getScreenCTM());
          error=Math.max(error,Math.hypot(tip.x-start.x,tip.y-start.y));
          const end=path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM());
          const body=bodies[side*4+index];
          const join=body.getPointAtLength(25.2).matrixTransform(body.getScreenCTM());
          joinError=Math.max(joinError,Math.hypot(end.x-join.x,end.y-join.y));
        });
      });
    }
    return {error,joinError,longPathChanges,poses:poses.size};
  });
  const pulling=await sample();
  expect(pulling.error).toBeLessThan(0.2);
  expect(pulling.joinError).toBeLessThan(0.2);
  expect(pulling.poses).toBeGreaterThan(10);
  await expect(page.locator('#entrance')).toHaveAttribute('data-puppet-stage','ready');
  await expect(page.locator('.puppet-threads circle[r="1.5"]')).toHaveCount(8);
  const idle=await sample();
  expect(idle.error).toBeLessThan(0.2);
  expect(idle.joinError).toBeLessThan(0.2);
  expect(idle.longPathChanges).toBe(0);
  expect(idle.poses).toBeGreaterThan(10);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('switching to reduced motion finishes the entrance and restores still joints',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#entrance')).toHaveAttribute('data-puppet-stage','dropping');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('#entrance')).toHaveAttribute('data-puppet-stage','ready');
  for(const part of await page.locator('[data-hand-part]').all()) await expect(part).toHaveCSS('transform','none');
  await expect(page.locator('main')).toBeVisible();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect.poll(()=>page.locator('[data-hand-part="2"]').first().evaluate(el=>el.style.transform)).not.toBe('');
});

for(const stage of ['dropping','threading']) {
  test(`Tab bypasses the ${stage} choreography`,async({page})=>{
    await page.goto('/',{waitUntil:'domcontentloaded'});
    await expect(page.locator('#entrance')).toHaveAttribute('data-puppet-stage',stage);
    await page.keyboard.press('Tab');
    await expect(page.locator('#entrance')).toHaveAttribute('data-puppet-stage','ready',{timeout:1000});
    await expect(page.locator('main')).toBeVisible();
  });
}
