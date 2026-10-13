import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDragon,updateDragon,spawnFire,updateFire,getFireInfluence} from '../src/manuscript/reference/dragon.js';

const angleDifference=(to:number,from:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));

test('reference tracking retains its cadence and direct cursor orientation',()=>{
  const dragon=createDragon(900,100,.8);
  assert.equal(updateDragon(dragon,79,500,350),false);
  assert.equal(dragon.segments[0].x,900);
  assert.equal(updateDragon(dragon,80,500,350),true);
  assert.equal(dragon.segments[0].x,840);
  assert.equal(dragon.segments[0].y,137.5);
  assert.equal(dragon.segments[0].angle,Math.atan2(250,-400));
});

test('cursor circles preserve the reference chain spacing and bend limits',()=>{
  const dragon=createDragon(900,100,.8);
  for(let i=1;i<420;i++) {
    updateDragon(dragon,i*80,600+280*Math.cos(i*.07),350+180*Math.sin(i*.07));
    for(let j=1;j<20;j++) {
      const segment=dragon.segments[j],parent=dragon.segments[j-1];
      assert.ok(Math.abs(angleDifference(segment.angle,parent.angle))<=.250001);
      assert.ok(Math.abs(Math.hypot(segment.x-parent.x,segment.y-parent.y)-24)<.001);
    }
  }
});

test('fire particles affect nearby text, then expire completely',()=>{
  const dragon=createDragon(500,200,1);spawnFire(dragon);
  assert.ok(dragon.fire.length>=3 && dragon.fire.length<=5);
  const particle=dragon.fire[0];
  assert.ok(getFireInfluence(dragon,particle.x+10,particle.y+10).strength>0);
  assert.equal(getFireInfluence(dragon,0,0).strength,0);
  for(let time=80;time<=2000;time+=80) updateFire(dragon,time);
  assert.equal(dragon.fire.length,0);
});
