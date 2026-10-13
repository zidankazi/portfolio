import {introduction, projects, studioSites} from './data.js';

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]!));
}

export const ornament = '<span class="ornament" aria-hidden="true">✦</span>';
const external = (href: string, label: string, className = '') => `<a class="${className}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}<span aria-hidden="true"> ↗</span></a>`;

function projectRows(): string {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  return projects.map((project, index) => `<article class="project-row">
    <div class="project-number" aria-hidden="true">${numerals[index]}</div>
    <div class="project-content">
      <details class="project-detail" data-project="${index}">
        <summary><h3>${escapeHtml(project.title)}</h3><span class="preview-label">view illustration <span class="preview-plus" aria-hidden="true">+</span></span></summary>
        <div class="project-illustration"><img src="${project.preview}" alt="${escapeHtml(project.title)} project preview" loading="lazy" width="960" height="600"></div>
      </details>
      <p>${escapeHtml(project.description)}</p>
      <div class="project-links">${project.links.map(link => external(link.href, link.label)).join('')}</div>
    </div>
  </article>`).join('');
}

function home(): string {
  return `<header class="masthead"><div class="folio-meta"><span>A personal manuscript</span><span>Hoboken, New Jersey</span></div>
    <h1>Zidan Kazi</h1><div class="masthead-caption"><span>Computer science</span>${ornament}<span>Mathematics</span>${ornament}<span>Things made by hand & code</span></div>
  </header>
  <section class="intro-section" aria-labelledby="intro-title">
    <div class="section-rubric"><h2 id="intro-title">I. A little introduction</h2><button id="motion-toggle" type="button" aria-pressed="false">Pause dragon</button></div>
    <div class="manuscript-scene" id="manuscript-scene">
      <div class="intro-copy" id="intro-copy">${introduction.map(text => `<p>${escapeHtml(text)}</p>`).join('')}</div>
      <canvas id="manuscript" aria-hidden="true"></canvas>
      <div class="illuminated-initial" aria-hidden="true"><span>I</span></div>
      <div id="flow-text" aria-hidden="true"></div>
    </div>
    <div class="intro-bottom"><a href="/studio">I design & build websites for clients <span aria-hidden="true">↗</span></a><span class="dragon-hint">Move your cursor. The margins are alive.</span></div>
  </section>
  <section class="listening" aria-labelledby="listening-title"><div class="listening-heading"><span class="small-star" aria-hidden="true">✳</span><h2 id="listening-title">In the background</h2><span class="eyebrow">Spotify</span></div>
    <div id="spotify" class="spotify-player" aria-live="polite"><div class="record" aria-hidden="true"><span>z</span></div><div class="track-info"><span class="eyebrow">A moment of quiet</span><p>I listen to a lot of music.</p></div><span class="music-note" aria-hidden="true">♫</span></div>
  </section>
  <section class="projects-section" id="projects" aria-labelledby="projects-title"><div class="section-heading"><div><span class="eyebrow">II. Collected works</span><h2 id="projects-title">Experiments & undertakings</h2></div><span class="section-count">Seven projects<br>A work in progress</span></div><div class="project-list">${projectRows()}</div></section>
  <section class="activity-section" id="activity" aria-labelledby="activity-title"><div class="section-heading"><div><span class="eyebrow">III. The daily practice</span><h2 id="activity-title">A little, every day.</h2></div>${external('https://github.com/zidankazi', 'GitHub', 'activity-link')}</div>
    <div id="github-activity" data-slot="github-activity" aria-busy="true"><p class="calendar-status">Fetching the record of work…</p></div>
  </section>`;
}

function studio(): string {
  return `<header class="masthead studio-masthead"><div class="folio-meta"><a href="/">← Back to the manuscript</a><span>A selection of client work</span></div><h1>The studio</h1><p>Websites designed & built by Zidan Kazi.</p></header><section class="studio-grid" aria-label="Client websites">${studioSites.map((site, i) => `<article><div class="section-rubric"><h2>0${i + 1}. ${site.name}</h2>${external(site.href, 'Visit '+site.name)}</div><a href="${site.href}" target="_blank" rel="noopener noreferrer"><img src="${site.image}" alt="${site.name} website" width="900" height="650" loading="lazy"></a></article>`).join('')}</section>`;
}

export function document(path: string, script: string, stylesheet: string): string {
  const isStudio = path === '/studio';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f4eee0"><title>${isStudio ? 'studio · zidan kazi' : 'zidan kazi'}</title><meta name="description" content="Zidan Kazi. Computer Science & Math at Stevens. A collection of projects, experiments, and websites."><link rel="canonical" href="https://www.zidankazi.com${isStudio ? '/studio' : '/'}"><meta property="og:title" content="Zidan Kazi — a personal manuscript"><meta property="og:description" content="Projects, experiments, and things made by hand & code."><meta property="og:type" content="website"><link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><link rel="preload" href="/fonts/im-fell-english.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="${stylesheet}"><script type="module" src="${script}"></script></head>
    <body><a class="skip-link" href="#main">Skip to content</a><div class="page-shell"><nav class="top-nav" aria-label="Main navigation"><a href="/" class="monogram" aria-label="Zidan Kazi home">zk<span aria-hidden="true">.</span></a><div><a href="/#projects">Works</a><a href="/studio" ${isStudio ? 'aria-current="page"' : ''}>Studio</a><a href="mailto:hi@zidankazi.com">Correspondence <span aria-hidden="true">↗</span></a></div></nav><main id="main">${isStudio ? studio() : home()}</main><footer><div class="footer-signature">Yours,<br><span>Zidan</span></div><div class="footer-links">${external('https://github.com/zidankazi', 'GitHub')}${external('https://twitter.com/zidaaaaaaaannnn', 'Twitter / X')}<a href="mailto:hi@zidankazi.com">hi@zidankazi.com <span aria-hidden="true">↗</span></a></div><div class="colophon">Made in Hoboken${ornament}<span>End of this folio</span></div></footer></div></body></html>`;
}

export const manifest = {
  name: 'Zidan Kazi', short_name: 'Zidan Kazi', start_url: '/', display: 'standalone',
  background_color: '#f4eee0', theme_color: '#f4eee0',
  icons: [{src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png'}, {src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png'}],
};
