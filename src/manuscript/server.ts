import {document, llmsText, manifest, profileDocument, profileMarkdown, siteUrl} from './document.js';
import type {SpotifyClient} from './spotify.js';

export async function response(path: string, client: SpotifyClient, script: string, stylesheet: string) {
  const base = {status: 200, content_type: 'text/html; charset=utf-8', cache_control: 'no-store', headers: {} as Record<string,string>};
  if (path === '/api/spotify' || path === '/api/spotify/now-playing') return {...base, content_type: 'application/json; charset=utf-8', body: JSON.stringify(await client.getTrack())};
  if (path === '/manifest.webmanifest') return {...base, content_type: 'application/manifest+json', cache_control: 'public, max-age=3600', body: JSON.stringify(manifest)};
  if (path === '/robots.txt') return {...base, content_type: 'text/plain; charset=utf-8', cache_control: 'public, max-age=3600', body: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`};
  if (path === '/sitemap.xml') return {...base, content_type: 'application/xml; charset=utf-8', cache_control: 'public, max-age=3600', body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}</loc></url></urlset>\n`};
  if (path === '/llms.txt') return {...base, content_type: 'text/plain; charset=utf-8', cache_control: 'public, max-age=3600', body: llmsText()};
  if (path === '/profile.md') return {...base, content_type: 'text/markdown; charset=utf-8', cache_control: 'public, max-age=3600', body: profileMarkdown()};
  if (path === '/profile') return {...base, body: profileDocument()};
  if (path === '/') return {...base, body: document(script, stylesheet)};
  // Keep missing resources as errors so browsers never receive HTML as a script or image.
  const missingResource=(/\.[^/]+$/.test(path) && !/\.html?$/i.test(path)) || path==='/api' || path.startsWith('/api/') || path.startsWith('/assets/');
  if (missingResource) return {...base, status: 404, content_type: 'text/plain; charset=utf-8', body: 'Not found.\n'};
  // A temporary redirect leaves room for future pages without a cached permanent redirect.
  return {...base, status: 302, headers: {Location:'/'}, body: ''};
}
