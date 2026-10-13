import {spawn,spawnSync} from 'node:child_process';
import {watch,existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

if(existsSync('.env.local')) process.loadEnvFile('.env.local');
else if(existsSync('.env')) process.loadEnvFile('.env');
const run=(cmd,args) => spawnSync(cmd,args,{stdio:'inherit'}).status===0;
let server;
let timer;
let building=false;
let pending=false;
let stopping=false;
async function rebuild() {
  if(stopping) return;
  if(building) { pending=true; return; }
  building=true;
  const built=run(process.execPath,['scripts/build.mjs']);
  if(built) {
    if(server) {
      const previous=server;
      await new Promise(resolve => { previous.once('exit',resolve);previous.kill('SIGTERM'); });
    }
    if(!stopping) server=spawn(process.execPath,['dist/server.mjs',...process.argv.slice(2)],{stdio:'inherit',env:process.env});
  }
  building=false;
  if(pending) { pending=false; rebuild(); }
}
const fingerprints=new Map();
function fingerprint(path) {
  try { return createHash('sha256').update(readFileSync(path)).digest('hex'); }
  catch { return ''; }
}
function remember(path) {
  fingerprints.set(path,fingerprint(path));
}
const directories=['src/manuscript','runtime','scripts'];
function collect(path) {
  for(const entry of readdirSync(path,{withFileTypes:true})) {
    const file=join(path,entry.name);
    if(entry.isDirectory()) collect(file);
    else remember(file);
  }
}
directories.forEach(collect);remember('package.json');
const watchers=[...directories,'package.json'].map(path=>watch(path,{recursive:directories.includes(path)},(_event,filename)=>{
  if(!filename) return;
  const file=directories.includes(path)?join(path,String(filename)):'package.json';
  if(!/\.(ts|mjs|css|json)$/.test(file)) return;
  const next=fingerprint(file);
  if(next===fingerprints.get(file)) return;
  fingerprints.set(file,next);
  clearTimeout(timer);timer=setTimeout(rebuild,200);
}));
const shutdown=()=> { stopping=true;clearTimeout(timer);watchers.forEach(w=>w.close());server?.kill('SIGTERM'); };
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
await rebuild();
