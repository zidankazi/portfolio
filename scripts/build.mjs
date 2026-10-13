import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';

await rm('dist',{recursive:true,force:true});
await mkdir('dist/assets',{recursive:true});
const client=await build({entryPoints:['src/manuscript/main.ts'],bundle:true,format:'esm',platform:'browser',target:['es2022'],outdir:'dist/assets',entryNames:'site-[hash]',chunkNames:'chunk-[hash]',splitting:true,minify:true,metafile:true});
const script='/assets/'+Object.keys(client.metafile.outputs).find(path=>client.metafile.outputs[path].entryPoint).split('/').pop();
const styles=await readFile('src/manuscript/styles.css','utf8');
await writeFile('dist/assets/site.css',styles);
const cssName='site-'+createHash('sha256').update(await readFile('dist/assets/site.css')).digest('hex').slice(0,12)+'.css';
await writeFile('dist/assets/'+cssName,await readFile('dist/assets/site.css'));
await rm('dist/assets/site.css');
const stylesheet='/assets/'+cssName;
await writeFile('dist/assets.json',JSON.stringify({script,stylesheet}));
await build({entryPoints:['runtime/server.mjs'],outfile:'dist/server.mjs',bundle:true,format:'esm',platform:'node',target:'node22',packages:'external'});
console.log('Built TypeScript manuscript portfolio');
