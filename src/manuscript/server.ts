import {document, manifest} from './document.js';
import type {SpotifyClient} from './spotify.js';

export async function response(path: string, client: SpotifyClient, script: string, stylesheet: string) {
  const base = {status: 200, content_type: 'text/html; charset=utf-8', cache_control: 'no-store'};
  if (path === '/api/spotify' || path === '/api/spotify/now-playing') return {...base, content_type: 'application/json; charset=utf-8', body: JSON.stringify(await client.getTrack())};
  if (path === '/manifest.webmanifest') return {...base, content_type: 'application/manifest+json', cache_control: 'public, max-age=3600', body: JSON.stringify(manifest)};
  if (path === '/' || path === '/studio') return {...base, body: document(path, script, stylesheet)};
  return {...base, status: 404, body: '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>not found · zidan kazi</title><body style="background:#f4eee0;color:#2a241c;font:20px Georgia;padding:3rem"><h1>This page is unwritten.</h1><a href="/" style="color:inherit">Back to the manuscript</a></body></html>'};
}
