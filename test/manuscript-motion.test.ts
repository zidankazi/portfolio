import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDragon,updateDragon,updateDragonScale,getRestPose,spawnFire,updateFire,getFireInfluence} from '../src/manuscript/reference/dragon.js';
import {followDragonBody,perchDragonBody,perchLookAngle} from '../src/manuscript/rig-motion.ts';

const angleDifference=(to:number,from:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));

test('a full-size perched dragon rests its body while its head watches the cursor',()=>{
  const dragon=createDragon(900,250,1);
  getRestPose(900,250,1).forEach((pose,index)=>Object.assign(dragon.segments[index],pose));
  for(let frame=0;frame<600;frame++) {
    const head=dragon.segments[0],before=dragon.segments.map(segment=>segment.angle);
    const aim=frame<300 ? perchLookAngle(Math.sin(frame*.04)*Math.PI) : -.65;
    head.angle+=Math.max(-.048,Math.min(.048,angleDifference(aim,head.angle)));
    perchDragonBody(dragon,1,1-Math.exp(-16/140),.048);
    for(let index=1;index<dragon.segments.length;index++) {
      const segment=dragon.segments[index],parent=dragon.segments[index-1];
      assert.ok(Math.abs(Math.hypot(segment.x-parent.x,segment.y-parent.y)-30)<.001);
      assert.ok(Math.abs(angleDifference(segment.angle,parent.angle))<=.250001,'the head must obey the same bend limit as every other joint');
      assert.ok(Math.abs(angleDifference(segment.angle,before[index]))<=.048001);
    }
  }
  assert.equal(dragon.scale,1);
  const xs=dragon.segments.map(segment=>segment.x),ys=dragon.segments.map(segment=>segment.y);
  assert.ok(Math.max(...ys)>dragon.segments[0].y+180,'the head stays raised above the resting chest');
  assert.ok(Math.max(...xs)-Math.min(...xs)<300,'the body coils compactly instead of stretching along the ledge');
  const wingAngle=dragon.segments[5].angle;
  for(let frame=0;frame<180;frame++) {
    dragon.segments[0].angle+=Math.max(-.048,Math.min(.048,angleDifference(-2.2,dragon.segments[0].angle)));
    perchDragonBody(dragon,1,1-Math.exp(-16/140),.048);
  }
  assert.ok(Math.abs(angleDifference(dragon.segments[5].angle,wingAngle))<.001,'the neck should turn without rotating the resting shoulder and wings');
});

test('landing and taking off respect every joint turn limit even across angle wraps',()=>{
  const dragon=createDragon(900,250,1);
  getRestPose(900,250,1).forEach((pose,index)=>Object.assign(dragon.segments[index],pose));
  for(let frame=0;frame<1800;frame++) {
    const before=dragon.segments.map(segment=>({...segment})),head=dragon.segments[0];
    const amount=frame<300 ? 0 : frame<900 ? (1-Math.cos((frame-300)*Math.PI/600))/2
      : frame<1200 ? 1 : (1+Math.cos((frame-1200)*Math.PI/600))/2;
    const maxTurn=16*(.006-.003*amount);
    head.angle+=maxTurn*.9;head.x+=6*Math.cos(frame*.05);head.y+=4*Math.sin(frame*.05);
    if(amount) perchDragonBody(dragon,amount,1-Math.exp(-16/140),maxTurn);
    else followDragonBody(dragon,false,1-Math.exp(-16/140),maxTurn);
    for(let index=1;index<dragon.segments.length;index++) {
      const segment=dragon.segments[index],parent=dragon.segments[index-1];
      assert.ok(Math.abs(angleDifference(segment.angle,before[index].angle))<=maxTurn+.000001,
        `joint ${index} snapped at frame ${frame}, landing amount ${amount}`);
      assert.ok(Math.abs(angleDifference(segment.angle,parent.angle))<=.250001,
        `joint ${index} folded at frame ${frame}, landing amount ${amount}`);
      assert.ok(Math.abs(Math.hypot(segment.x-parent.x,segment.y-parent.y)-30)<.001);
    }
  }
});

test('a perched body unwinds on takeoff even when the cursor and head stop moving',()=>{
  const dragon=createDragon(900,250,1);
  getRestPose(900,250,1).forEach((pose,index)=>Object.assign(dragon.segments[index],pose));
  const alpha=1-Math.exp(-16/140);
  for(let frame=0;frame<300;frame++) {
    const head=dragon.segments[0];
    head.angle+=Math.max(-.048,Math.min(.048,angleDifference(-.65,head.angle)));
    perchDragonBody(dragon,1,alpha,.048);
  }
  const curl=()=>dragon.segments.slice(1).reduce((sum,segment,index)=>sum+Math.abs(angleDifference(segment.angle,dragon.segments[index].angle)),0);
  assert.ok(curl()>4,'start with the fully curled perched body');
  let amount=1,release=1;
  for(let frame=0;frame<180;frame++) {
    const before=dragon.segments.map(segment=>segment.angle);
    amount*=Math.exp(-16/180);if(amount<.0001) amount=0;
    if(amount>.001) release=1;else release*=Math.exp(-16/1200);
    const unwind=release*(1-amount),bodyAlpha=1-Math.pow(1-alpha,1+3*unwind),maxTurn=16*(.006-.003*amount);
    if(amount) perchDragonBody(dragon,amount,bodyAlpha,maxTurn,unwind);
    else followDragonBody(dragon,false,bodyAlpha,maxTurn,unwind);
    for(let index=1;index<dragon.segments.length;index++) {
      const segment=dragon.segments[index],parent=dragon.segments[index-1];
      assert.ok(Math.abs(angleDifference(segment.angle,before[index]))<=maxTurn+.000001);
      assert.ok(Math.abs(angleDifference(segment.angle,parent.angle))<=.250001);
      assert.ok(Math.abs(Math.hypot(segment.x-parent.x,segment.y-parent.y)-30)<.001);
    }
    if(frame===59) assert.ok(curl()<1.2,'the closed coil must open during the first second');
  }
  assert.ok(curl()<.1,'the body must not retain the landing curl after takeoff');
});

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

test('the live body keeps its spacing and turn speed while growing, shrinking, and reversing',()=>{
  const dragon=createDragon(700,300,1);
  getRestPose(700,300,1).forEach((pose,index)=>Object.assign(dragon.segments[index],pose));
  for(let frame=0;frame<720;frame++) {
    const before=dragon.segments.map(segment=>({...segment})),head=dragon.segments[0];
    // Size reverses before settling while cursor direction crosses the angle wrap repeatedly.
    const scale=.65+.35*Math.cos(frame*.035),ratio=scale/dragon.scale;
    for(const segment of dragon.segments) {
      segment.x=head.x+(segment.x-head.x)*ratio;
      segment.y=head.y+(segment.y-head.y)*ratio;
    }
    updateDragonScale(dragon,scale);
    head.x+=10*Math.cos(frame*.045);head.y+=7*Math.sin(frame*.045);
    head.angle+=.09*Math.sin(frame*.018);
    followDragonBody(dragon,false,1-Math.exp(-16/220),.096);
    for(let index=1;index<20;index++) {
      const segment=dragon.segments[index],parent=dragon.segments[index-1];
      assert.ok(Math.abs(angleDifference(segment.angle,before[index].angle))<=.096001,'a joint must not snap to another direction');
      assert.ok(Math.abs(angleDifference(segment.angle,parent.angle))<=.250001,'body bends must remain within the artwork limits');
      assert.ok(Math.abs(Math.hypot(segment.x-parent.x,segment.y-parent.y)-30*scale)<.001,'the body must never stretch or fold its links');
    }
  }
});
