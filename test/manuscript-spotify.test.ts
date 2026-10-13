import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SpotifyClient, decodeTrack} from '../src/manuscript/spotify.ts';

const item={name:'A song', artists:[{name:'An artist'}], album:{images:[{url:'https://example.com/album.webp'}]}, external_urls:{spotify:'https://open.spotify.com/track/example'}, duration_ms:120000};
const credentials={id:'test',secret:'test',refresh:'test'};

function transport(responses: Array<Response | Error>, calls: string[] = []): typeof fetch {
  return (async (url: string | URL | Request) => {
    calls.push(String(url)); const result=responses.shift();
    if (result instanceof Error) throw result;
    if (!result) throw new Error('Unexpected request');
    return result;
  }) as typeof fetch;
}
const token=()=>Response.json({access_token:'test-token',expires_in:3600});

test('missing credentials return an honest empty state without network traffic',async()=>{
  const client=new SpotifyClient({id:'',secret:'',refresh:''},transport([]));
  assert.equal((await client.getTrack()).title,null);
});
test('playing and paused tracks retain valid metadata and progress',async()=>{
  const calls: string[]=[];
  const client=new SpotifyClient(credentials,transport([token(),Response.json({item,is_playing:true,progress_ms:4000}),Response.json({item,is_playing:false,progress_ms:6000})],calls));
  assert.equal((await client.getTrack()).isPlaying,true);
  const paused=await client.getTrack(); assert.equal(paused.isPlaying,false); assert.equal(paused.progressMs,6000);
  assert.equal(calls.filter(url=>url.includes('/api/token')).length,1);
});
test('recent history is used after no content and cached for one minute',async()=>{
  const calls: string[]=[];
  const client=new SpotifyClient(credentials,transport([token(),new Response(null,{status:204}),Response.json({items:[{track:item}]}),new Response(null,{status:204})],calls));
  assert.equal((await client.getTrack()).title,'A song');
  assert.equal((await client.getTrack()).isPlaying,false);
  assert.equal(calls.filter(url=>url.includes('recently-played')).length,1);
});
test('network failure never reports cached playback as still playing',async()=>{
  const client=new SpotifyClient(credentials,transport([token(),Response.json({item,is_playing:true,progress_ms:4000}),new Error('offline')]));
  await client.getTrack(); const fallback=await client.getTrack();
  assert.equal(fallback.title,'A song'); assert.equal(fallback.isPlaying,false); assert.equal(fallback.progressMs,null);
});
test('an expired token is cleared and refreshed on the next poll',async()=>{
  const calls: string[]=[];
  const client=new SpotifyClient(credentials,transport([token(),Response.json({item,is_playing:true}),new Response(null,{status:401}),token(),Response.json({item,is_playing:false})],calls));
  await client.getTrack(); assert.equal((await client.getTrack()).isPlaying,false);
  assert.equal((await client.getTrack()).title,'A song');
  assert.equal(calls.filter(url=>url.includes('/api/token')).length,2);
});
test('concurrent widget requests share one token refresh and playback fetch',async()=>{
  const calls: string[]=[];
  const client=new SpotifyClient(credentials,transport([token(),Response.json({item,is_playing:true})],calls));
  const tracks=await Promise.all([client.getTrack(),client.getTrack(),client.getTrack()]);
  assert.equal(tracks.length,3); assert.equal(calls.length,2);
});
test('malformed tracks and non-Spotify URLs are rejected',()=>{
  assert.equal(decodeTrack({name:'episode'}),null);
  assert.equal(decodeTrack({...item,external_urls:{spotify:'javascript:alert(1)'}}),null);
  assert.equal(decodeTrack({...item,duration_ms:-1})?.durationMs,null);
});
