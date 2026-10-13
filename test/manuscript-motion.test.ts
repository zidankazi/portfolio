import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Dragon} from '../src/manuscript/dragon.ts';
import {convexHull,polygonRange} from '../src/manuscript/geometry.ts';

test('dragon tracking converges at the same speed on 60Hz and 120Hz displays',()=>{
  const run=(hz:number)=>{
    const dragon=new Dragon(); dragon.rest(900,100,.8);
    for (let i=1;i<=hz/2;i++) dragon.update(i*1000/hz,{x:500,y:350},900,100);
    return dragon.segments[0];
  };
  const a=run(60), b=run(120);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.01);
  assert.ok(Math.hypot(a.x-500,a.y-350)<5);
});
test('an idle dragon stops invalidating text layout once it settles',()=>{
  const dragon=new Dragon(); dragon.rest(900,100,.8);
  assert.equal(dragon.update(16,null,900,100),false);
  dragon.update(32,{x:500,y:300},900,100);
  for (let i=1;i<240;i++) dragon.update(32+i*16,null,900,100);
  assert.equal(dragon.update(4000,null,900,100),false);
});
test('text rows exclude a diagonal silhouette without reserving its entire box',()=>{
  const diamond=[{x:50,y:0},{x:100,y:50},{x:50,y:100},{x:0,y:50}];
  assert.deepEqual(polygonRange(diamond,0,10,0),{left:40,right:60});
  assert.deepEqual(polygonRange(diamond,45,55,0),{left:0,right:100});
  assert.equal(polygonRange(diamond,110,120,0),null);
});
test('outline hull retains outer points and discards interior samples',()=>{
  const hull=convexHull([{x:0,y:0},{x:20,y:0},{x:20,y:20},{x:0,y:20},{x:10,y:10}]);
  assert.equal(hull.length,4);
  assert.deepEqual(polygonRange(hull,10,12,3),{left:-3,right:23});
});
