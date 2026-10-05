import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
await rm('.vercel/output',{recursive:true,force:true});
await mkdir('.vercel/output/functions/site.func',{recursive:true});
await cp('public','.vercel/output/static',{recursive:true});
await cp('dist/assets','.vercel/output/static/assets',{recursive:true});
await cp('dist/server.mjs','.vercel/output/functions/site.func/index.mjs');
await writeFile('.vercel/output/functions/site.func/.vc-config.json',JSON.stringify({runtime:'nodejs24.x',handler:'index.mjs',launcherType:'Nodejs',shouldAddHelpers:true}));
await writeFile('.vercel/output/config.json',JSON.stringify({version:3,routes:[{handle:'filesystem'},{src:'/(.*)',dest:'/site'}]}));
