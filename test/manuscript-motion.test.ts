import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Dragon} from '../src/manuscript/dragon.ts';
import {convexHull,polygonRange} from '../src/manuscript/geometry.ts';
import {springAxis,angleDifference} from '../src/manuscript/text-motion.ts';

test('reference tracking takes one 15% step every 80ms and points directly at the cursor',()=>{
  const dragon=new Dragon();dragon.rest(900,100,.8);
  const before={...dragon.segments[0]};
  assert.equal(dragon.update(79,{x:500,y:350},900,100),false);
  assert.deepEqual(dragon.segments[0],before);
  assert.equal(dragon.update(80,{x:500,y:350},900,100),true);
  assert.equal(dragon.segments[0].x,840);
  assert.equal(dragon.segments[0].y,98+(350-98)*.15);
  assert.equal(dragon.segments[0].angle,Math.atan2(252,-400));
});
test('idle motion relaxes every segment toward the original rest pose',()=>{
  const dragon=new Dragon();dragon.rest(900,100,.8);
  const rest=dragon.segments.map(segment=>({...segment}));
  dragon.update(80,{x:500,y:300},900,100);
  const before=dragon.segments.map(segment=>({...segment}));
  dragon.update(160,null,900,100);
  dragon.segments.forEach((segment,index)=>{
    assert.equal(segment.x,before[index].x+(rest[index].x-before[index].x)*.12);
    assert.equal(segment.y,before[index].y+(rest[index].y-before[index].y)*.12);
    assert.ok(Math.abs(segment.angle-before[index].angle-angleDifference(rest[index].angle,before[index].angle)*.12)<1e-12);
  });
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

test('line changes move through intermediate positions without teleporting or overshooting',()=>{
  let state={position:500,velocity:0};
  state=springAxis(state,0,1/60);
  assert.ok(state.position>450 && state.position<500);
  for(let i=0;i<30;i++) {state=springAxis(state,0,1/60);assert.ok(state.position>=0);}
  assert.ok(state.position<.1);
});

test('tight cursor circles preserve the reference chain spacing and bend limits',()=>{
  const dragon=new Dragon();dragon.rest(900,100,.8);
  for(let i=1;i<420;i++) {
    dragon.update(i*80,{x:600+280*Math.cos(i*.07),y:350+180*Math.sin(i*.07)},900,100);
    for(let j=1;j<20;j++) {
      const segment=dragon.segments[j],parent=dragon.segments[j-1];
      assert.ok(Math.abs(angleDifference(segment.angle,parent.angle))<=.250001);
      assert.ok(Math.abs(Math.hypot(segment.x-parent.x,segment.y-parent.y)-24)<.001);
    }
  }
});

test('holding a link pauses tracking without a catch-up jump on release',()=>{
  const dragon=new Dragon();dragon.rest(900,100,.8);
  dragon.hold(5000);
  assert.equal(dragon.update(5050,{x:300,y:100},900,100),false);
  assert.equal(dragon.segments[0].x,900);
  dragon.update(5080,{x:300,y:100},900,100);
  assert.equal(dragon.segments[0].x,810);
});
