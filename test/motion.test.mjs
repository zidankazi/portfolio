import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Rect,chain} from '../build/dev/javascript/portfolio/lib/chain_geometry.mjs';
import {init,frame,smooth} from '../build/dev/javascript/portfolio/lib/rail_motion.mjs';
import {Some,Option$None$const as None} from '../build/dev/javascript/gleam_stdlib/gleam/option.mjs';

test('rail motion stays finite and within the tile during long scrolling sessions',()=>{
  for(const left of [true,false]) {
    let state=init(0);
    for(let index=0;index<4000;index++) {
      const output=frame(state,left,index%5===0?5:1/60,index%900,600);
      state=output.state;
      assert.ok(Number.isFinite(output.shift));
      assert.ok(output.shift<=0 && output.shift>=-600);
      assert.ok(Math.abs(output.rotate_y)<=15);
      assert.ok(output.layers.toArray().every(layer=>Number.isFinite(layer.opacity)));
    }
  }
  assert.equal(smooth(-1),0);assert.equal(smooth(2),1);
});

test('chains terminate at their message edge and clip the two crossing strands',()=>{
  const root=new Rect(0,0,1440,1700,1440,1700);
  const hand=new Rect(240,-12,480,228,240,240);
  const content=new Rect(460,264,980,1600,520,1336);
  const bubble=new Rect(504,622,980,832,476,210);
  const previous=new Rect(504,527,980,602,476,75);
  const regular=chain(0,3,root,hand,content,bubble,None,false);
  assert.equal(regular.end.x,507);assert.equal(regular.end.y,636);assert.equal(regular.clip.width,0);
  const cross=chain(1,3,root,hand,content,bubble,new Some(previous),false);
  assert.equal(cross.end.x,507);assert.equal(cross.clip.width,190.4);
  assert.equal((cross.path.match(/ C/g)||[]).length,4);
  assert.ok(cross.count>0);
});
