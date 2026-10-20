import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bodyRipple,flameHeat,restingDot,stepCalendarDot} from '../src/manuscript/calendar-motion.ts';

test('the body nudges nearby dots outward while distant dots stay in their cells',()=>{
  const body=[{x:0,y:0,width:20,angle:0},{x:60,y:0,width:20,angle:0}];
  const pushed=bodyRipple(30,8,body,1);
  assert.ok(pushed.y>0 && Math.hypot(pushed.x,pushed.y)<=4.5);
  assert.deepEqual(bodyRipple(30,100,body,1),{x:0,y:0});
  assert.ok(bodyRipple(30,-8,body,1).y<0);
  const centered=bodyRipple(30,0,body,1);
  assert.ok(Number.isFinite(centered.x) && Number.isFinite(centered.y));
});

test('dots settle back exactly after the dragon passes, including after slow frames',()=>{
  const dot=restingDot();
  for(let i=0;i<30;i++) stepCalendarDot(dot,{x:3,y:-2},0,16);
  assert.ok(dot.x>2 && dot.y<-1);
  for(let i=0;i<160;i++) {
    stepCalendarDot(dot,{x:0,y:0},0,i%7===0 ? 100 : 16);
    assert.ok(Math.hypot(dot.x,dot.y)<5);
  }
  assert.deepEqual(dot,restingDot());
});

test('only actual flame hits warm a dot, and the ember cools all the way back',()=>{
  const fire=[{x:100,y:100,size:10,life:1}];
  assert.equal(flameHeat(100,100,fire,4),1);
  assert.equal(flameHeat(200,100,fire,4),0);
  assert.equal(flameHeat(100,100,[],4),0);
  const dot=restingDot();stepCalendarDot(dot,{x:0,y:0},1,16);
  stepCalendarDot(dot,{x:0,y:0},0,180);
  assert.ok(dot.heat>.3 && dot.heat<.4);
  stepCalendarDot(dot,{x:0,y:0},0,720);
  assert.equal(dot.heat,0);
});
