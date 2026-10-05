import {test,expect} from '@playwright/test';

const viewports=[
  {width:1920,height:1080},
  {width:320,height:568},
  {width:390,height:844},
  {width:768,height:1024},
  {width:1023,height:768},
  {width:1024,height:768},
  {width:1440,height:900},
  {width:2560,height:1440},
];

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/api/spotify/**',route=>route.fulfill({json:{title:null,isPlaying:false}}));
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.fulfill({json:{contributions:[]}}));
});

async function alignment(page) {
  return page.evaluate(()=>{
    let glyphError=0;
    let baselineError=0;
    let checked=0;
    const hands=[...document.querySelectorAll('[data-puppet-hand]')];
    for(const hand of hands) {
      for(const layer of hand.querySelectorAll('[data-hand-art]')) {
        [...layer.querySelectorAll('tspan')].forEach((row,index)=>{
          [...row.textContent].forEach((letter,column)=>{
            if(letter===' ') return;
            const box=row.getExtentOfChar(column);
            glyphError=Math.max(glyphError,Math.abs(box.x+box.width/2-(column*2.4+1.2)));
            baselineError=Math.max(baselineError,Math.abs(row.getStartPositionOfChar(column).y-(index+0.8)*4));
            checked++;
          });
        });
      }
    }
    const threads=[...document.querySelectorAll('.puppet-threads path')];
    let chainError=0;
    hands.forEach((hand,side)=>{
      const wraps=[...hand.querySelectorAll('[data-finger-wrap]')].reverse();
      wraps.forEach((wrap,index)=>{
        const tail=[...wrap.querySelectorAll('[data-wrap-reveal]')].at(-1);
        const tip=tail.getPointAtLength(tail.getTotalLength()).matrixTransform(tail.getScreenCTM());
        const thread=threads[side*4+index];
        if(!thread?.hasAttribute('d')) {
          chainError=Infinity;
          return;
        }
        const start=thread.getPointAtLength(0).matrixTransform(thread.getScreenCTM());
        chainError=Math.max(chainError,Math.hypot(tip.x-start.x,tip.y-start.y));
      });
    });
    return {glyphError,baselineError,chainError,checked};
  });
}

async function expectAligned(page) {
  await expect(page.locator('[data-puppet-hand]')).toHaveCount(2);
  await expect.poll(async()=>{
    const result=await alignment(page);
    return result.checked>1000 && result.glyphError<0.04 && result.baselineError<0.04 && result.chainError<0.2;
  },{message:'Characters stay on the finger grid and chains meet the wrap tails'}).toBe(true);
}

for(const deviceScaleFactor of [1,1.25,2]) {
  test.describe(`display scale ${deviceScaleFactor}`,()=>{
    test.use({deviceScaleFactor});
    for(const fonts of ['loaded','blocked','proportional']) {
      test(`finger alignment with ${fonts} fonts through viewport changes`,async({page})=>{
        if(fonts==='blocked') await page.route('**/fonts/**',route=>route.abort());
        await page.goto('/');
        await page.evaluate(()=>document.fonts.ready);
        expect(await page.evaluate(()=>[...document.fonts].some(font=>font.family.replaceAll('"','')==='JetBrains Mono' && font.status==='loaded'))).toBe(fonts!=='blocked');
        if(fonts==='proportional') {
          // Exercise arbitrary glyph advances even when a font override wins.
          await page.addStyleTag({content:'[data-hand-art] { font-family: Arial, sans-serif !important; }'});
        }
        for(const viewport of viewports) {
          await page.setViewportSize(viewport);
          await expectAligned(page);
        }
      });
    }
  });
}

test('finger alignment survives a late font swap',async({page})=>{
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  await page.route('**/fonts/**',async route=>{
    await pending;
    await route.continue();
  });
  try {
    await page.goto('/',{waitUntil:'domcontentloaded'});
    await expectAligned(page);
    expect(await page.evaluate(()=>document.fonts.status)).toBe('loading');
    release();
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>[...document.fonts].some(font=>font.family.replaceAll('"','')==='JetBrains Mono' && font.status==='loaded'))).toBe(true);
    await expectAligned(page);
  } finally {
    release();
  }
});
