import {projects, studioSites} from './data.js';

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]!));
}

const external = (href: string, label: string) => `<a href="${escapeHtml(href)}" ${href.startsWith('https://') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(label)}</a>`;

function home(): string {
  return `<p class="flow-copy">I'm <a href="mailto:hi@zidankazi.com">Zidan Kazi</a>, a junior at ${external('https://www.stevens.edu/', 'Stevens Institute of Technology')} studying Computer Science & Math.</p>
    <p id="spotify" class="flow-copy" aria-live="polite">I listen to a lot of music.</p>
    <p class="flow-copy">I design and build ${external('/studio', 'websites for clients')}. Here are some projects I've worked on:</p>
    ${projects.map((project, index) => `<p class="flow-copy project-row" data-project="${index}">${external(project.links[0].href, project.title)}: ${escapeHtml(project.description)} ${project.links.slice(1).map(link => external(link.href, link.label)).join(' / ')}</p>`).join('\n')}
    <div id="github-activity" data-slot="github-activity" aria-label="GitHub contribution chart" aria-busy="true"><p class="calendar-status">Loading GitHub contributions…</p></div>
    <p class="flow-copy contact-copy">${external('https://github.com/zidankazi', 'github')} / ${external('https://twitter.com/zidaaaaaaaannnn', 'twitter')} / <a href="mailto:hi@zidankazi.com">email</a></p>`;
}

function studio(): string {
  return `<p class="flow-copy"><a href="/">Zidan Kazi</a>. A few websites I've designed and built:</p>${studioSites.map(site => `<p class="flow-copy">${external(site.href, site.name)}</p>`).join('')}`;
}

export function document(path: string, script: string, stylesheet: string): string {
  const isStudio = path === '/studio';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f4eee0"><title>${isStudio ? 'studio · zidan kazi' : 'zidan kazi'}</title><meta name="description" content="Zidan Kazi. Computer Science & Math at Stevens. Projects and websites."><link rel="canonical" href="https://www.zidankazi.com${isStudio ? '/studio' : '/'}"><meta property="og:title" content="Zidan Kazi"><meta property="og:description" content="Projects and websites."><meta property="og:type" content="website"><link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><link rel="preload" href="/fonts/im-fell-english.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="${stylesheet}"><script type="module" src="${script}"></script></head><body><canvas id="manuscript" aria-hidden="true"></canvas><main id="manuscript-scene">${isStudio ? studio() : home()}</main></body></html>`;
}

export const manifest = {
  name: 'Zidan Kazi', short_name: 'Zidan Kazi', start_url: '/', display: 'standalone',
  background_color: '#f4eee0', theme_color: '#f4eee0',
  icons: [{src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png'}, {src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png'}],
};
