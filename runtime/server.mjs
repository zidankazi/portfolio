import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {response} from '../build/dev/javascript/portfolio/server.mjs';
import assets from '../dist/assets.json' with {type:'json'};
import {new_client} from '../build/dev/javascript/portfolio/lib/spotify.mjs';

const client=new_client(process.env.SPOTIFY_CLIENT_ID??'',process.env.SPOTIFY_CLIENT_SECRET??'',process.env.SPOTIFY_REFRESH_TOKEN??'');

const types={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};

async function serveFile(req,res,path) {
  const root=resolve(path.startsWith('/assets/')?'dist':'public');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+sep)) return false;
  try {
    const info=await stat(file);
    if(!info.isFile()) return false;
    const body=await readFile(file);
    const headers={'Accept-Ranges':'bytes','Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':path.startsWith('/assets/')||path.startsWith('/fonts/')?'public, max-age=31536000, immutable':'public, max-age=3600'};
    if(req.headers.range) {
      const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start=range?.[1]?Number(range[1]):Math.max(0,body.length-Number(range?.[2]??0));
      let end=range?.[1]?range[2]?Math.min(body.length-1,Number(range[2])):body.length-1:body.length-1;
      if(!range || !range[1]&&!range[2] || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start>end || start>=body.length) {res.writeHead(416,{'Content-Range':`bytes */${body.length}`});res.end();return true;}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${body.length}`,'Content-Length':end-start+1});
      res.end(req.method==='HEAD'?undefined:body.subarray(start,end+1));return true;
    }
    res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':path.startsWith('/assets/')||path.startsWith('/fonts/')?'public, max-age=31536000, immutable':'public, max-age=3600','Content-Length':body.length});
    res.end(req.method==='HEAD'?undefined:body);return true;
  } catch(error) { if(error.code==='ENOENT'||error.code==='ENOTDIR') return false;throw error; }
}

export async function handler(req,res) {
  try {
    const url=new URL(req.url,'http://localhost');
    let path;
    try { path=decodeURIComponent(url.pathname); } catch { res.writeHead(400);res.end('Bad request');return; }
    if(req.method!=='GET'&&req.method!=='HEAD') {res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
    if(await serveFile(req,res,path)) return;
    const result=await response(path,client,assets.script,assets.stylesheet);
    res.writeHead(result.status,{'Content-Type':result.content_type,'Cache-Control':result.cache_control,'X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:result.body);
  } catch(error) {
    console.error('Request failed:',error.message);
    res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('Something went wrong.');
  }
}

if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1])) {
  const index=process.argv.indexOf('--port');
  const port=Number(index>=0?process.argv[index+1]:process.env.PORT??3000);
  createServer(handler).listen(port,()=>console.log(`Portfolio: http://localhost:${port}`));
}

export default handler;
