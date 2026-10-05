import {test} from 'node:test';
import assert from 'node:assert/strict';
import {response} from '../build/dev/javascript/portfolio/server.mjs';
import {new_client} from '../build/dev/javascript/portfolio/lib/spotify.mjs';
const client=new_client('','','');

test('server renders both pages and preserves Spotify and manifest routes',async()=>{
  const home=await response('/',client,'/assets/site.js','/assets/site.css');
  assert.equal(home.status,200);assert.match(home.body,/Stevens Institute of Technology/);
  assert.match(home.body,/<title>zidan kazi<\/title>/);assert.match(home.body,/\/studio/);
  assert.match(home.body,/data-puppet-anchor="projects"/);assert.match(home.body,/aria-controls="project-list"/);
  const studio=await response('/studio',client,'/assets/site.js','/assets/site.css');
  assert.match(studio.body,/<title>studio · zidan kazi<\/title>/);
  assert.match(studio.body,/Mille Works/);assert.match(studio.body,/back to the conversation/);
  assert.equal((await response('/missing',client,'','')).status,404);
  for(const path of ['/api/spotify','/api/spotify/now-playing']) {
    const result=await response(path,client,'','');
    assert.equal(result.cache_control,'no-store');assert.deepEqual(JSON.parse(result.body),{isPlaying:false,title:null});
  }
  const manifest=await response('/manifest.webmanifest',client,'','');
  assert.equal(JSON.parse(manifest.body).name,'Zidan Kazi');
});
