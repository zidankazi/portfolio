import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTextMotion} from '../src/manuscript/text-motion.ts';

test('content groups ease together and retarget from their current position',()=>{
  const motion=createTextMotion();
  motion.begin(100,true);motion.point('word',200,100);motion.point('art',150,100);motion.end();
  motion.begin(116,true);
  const word={...motion.point('word',50,140)},art={...motion.point('art',0,140)};
  assert.ok(word.x<200 && word.x>50);assert.ok(word.y>100 && word.y<140);
  assert.ok(Math.abs(word.x-art.x-50)<.00001);motion.end();
  motion.begin(132,true);
  const reversed=motion.point('word',250,100);
  assert.ok(reversed.x>word.x && reversed.x<250);motion.end();
  for(let time=148;time<1100;time+=16) {motion.begin(time,true);motion.point('word',250,100);motion.end();}
  motion.begin(1100,true);assert.deepEqual(motion.point('word',250,100),{x:250,y:100});
});

test('reduced motion, resizing, and replaced content never replay old text positions',()=>{
  const motion=createTextMotion();
  motion.begin(100,true);motion.point('old',100,100);motion.end();
  motion.begin(116,false);assert.deepEqual(motion.point('old',400,300),{x:400,y:300});motion.end();
  motion.begin(132,true);motion.point('new',20,30);motion.end();
  motion.begin(148,true);assert.deepEqual(motion.point('old',70,80),{x:70,y:80});motion.end();
  motion.clear();motion.begin(164,true);assert.deepEqual(motion.point('old',200,200),{x:200,y:200});
});
