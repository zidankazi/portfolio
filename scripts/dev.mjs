import {spawn,spawnSync} from 'node:child_process';
import {watch,existsSync} from 'node:fs';

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
  const built=run(process.execPath,['scripts/gleam.mjs','build','--warnings-as-errors']) && run(process.execPath,['scripts/build.mjs']);
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
const watchers=['src','runtime','scripts','tailwind.config.js','gleam.toml'].map(path=>watch(path,{recursive:existsSync(path)&&!path.includes('.')},()=>{
  clearTimeout(timer);timer=setTimeout(rebuild,200);
}));
const shutdown=()=> { stopping=true;clearTimeout(timer);watchers.forEach(w=>w.close());server?.kill('SIGTERM'); };
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
await rebuild();
