import {projects,type Project} from './data.js';
import {biographyBlocks,biographyMarkup} from './bio.js';

export const siteUrl='https://www.zidankazi.com/';

export function llmsText():string {
  const introduction=biographyBlocks().find(block=>block.kind==='body')?.text ?? 'Personal portfolio of Zidan Kazi.';
  return `# Zidan Kazi

> ${introduction}

## Portfolio

- [Profile and projects](${siteUrl}profile.md): Biography, work experience, project descriptions, and project links in Markdown. Generated from the same content as the website.

## Optional

- [Website](${siteUrl}): The visual portfolio.
- [GitHub](https://github.com/zidankazi): Public repositories.
`;
}

export function profileMarkdown():string {
  const biography=biographyBlocks().filter(block=>block.kind!=='name').map(block=>block.text).join('\n\n');
  const work=projects.map(project=>{
    const links=project.links.map(link=>`[${link.label}](${link.href})`);
    if(project.descriptionLink) links.push(`[${project.descriptionLink.text}](${project.descriptionLink.href})`);
    return `### ${project.title}\n\n${project.description}\n\n${links.join(' / ')}`;
  }).join('\n\n');
  return `# Zidan Kazi\n\n${biography}\n\n## Projects\n\n${work}\n\n## Contact\n\n[Email](mailto:hi@zidankazi.com) / [GitHub](https://github.com/zidankazi)\n`;
}

function readerLinks():string {
  return `<link rel="describedby" type="text/plain" href="${siteUrl}llms.txt"><link rel="alternate" type="text/markdown" href="${siteUrl}profile.md" title="Portfolio in Markdown">`;
}

function structuredData():string {
  const profile={
    '@context':'https://schema.org',
    '@type':'ProfilePage',
    '@id':siteUrl+'#profile',
    url:siteUrl,
    name:'Zidan Kazi',
    mainEntity:{
      '@type':'Person',
      '@id':siteUrl+'#person',
      name:'Zidan Kazi',
      url:siteUrl,
      description:biographyBlocks().filter(block=>block.kind==='body').map(block=>block.text).join('\n\n'),
      sameAs:['https://github.com/zidankazi'],
    },
    hasPart:projects.map((project,index)=>({
      '@type':'CreativeWork',
      '@id':siteUrl+'#project-'+(index+1),
      name:project.title,
      description:project.description,
      url:project.links[0].href,
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(profile).replace(/</g,'\\u003c')}</script>`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]!));
}

const external = (href: string, label: string, className = '') => `<a class="${className}" href="${escapeHtml(href)}" ${href.startsWith('https://') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(label)}</a>`;

function description(project:Project):string {
  const link=project.descriptionLink;
  if(!link) return escapeHtml(project.description);
  const index=project.description.indexOf(link.text);
  if(index<0) return escapeHtml(project.description);
  return escapeHtml(project.description.slice(0,index))+external(link.href,link.text)+escapeHtml(project.description.slice(index+link.text.length));
}

function home(): string {
  return `<section id="projects" aria-labelledby="projects-heading"><h2 id="projects-heading" class="projects-label">a few things i've built</h2><div class="project-list">${projects.map((project, index) => `<article id="project-${index+1}" class="project-row" data-project="${index}"><h3 class="project-heading">${external(project.links[0].href, project.title, 'project-title')}<span class="project-links">${project.links.filter(link=>link.label==='github' || (project.title==='relic' && link.label==='site')).map(link => external(link.href, link.label, 'project-link')).join(' / ')}</span></h3><p class="project-description">${description(project)}</p></article>`).join('\n')}</div></section>
    <p id="contact" class="contact-copy">${external('https://github.com/zidankazi', 'github')} / <a href="mailto:hi@zidankazi.com">email</a></p>`;
}

function calendarSkeleton():string {
  return `<div class="calendar-skeleton" aria-hidden="true"><div class="calendar-scroll"><div class="calendar-skeleton-months">${'<span></span>'.repeat(12)}</div><div class="calendar-grid calendar-skeleton-grid">${'<span></span>'.repeat(371)}</div></div><div class="calendar-skeleton-caption"></div></div>`;
}

export function document(script: string, stylesheet: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f4eee0"><title>zidan kazi</title><meta name="description" content="Zidan Kazi. Computer Science & Math at Stevens. Projects and websites."><link rel="canonical" href="${siteUrl}"><link rel="alternate" type="text/html" href="${siteUrl}profile" title="Text portfolio">${readerLinks()}${structuredData()}<meta property="og:title" content="Zidan Kazi"><meta property="og:description" content="Projects and websites."><meta property="og:type" content="website"><link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><link rel="preload" href="/fonts/furia-iii.ttf" as="font" type="font/ttf" crossorigin><link rel="preload" href="/manuscript/nastagio.webp" as="image"><link rel="stylesheet" href="${stylesheet}"><script type="module" src="${script}"></script></head><body><div class="painting" aria-hidden="true"></div><div class="reading-glass" aria-hidden="true"></div><section id="manuscript-scene" class="manuscript-surface" aria-label="About Zidan Kazi"><canvas id="manuscript" aria-hidden="true"></canvas><div class="manuscript-fallback">${biographyMarkup()}</div><div id="github-activity" data-slot="github-activity" aria-label="GitHub contribution chart" aria-busy="true">${calendarSkeleton()}</div><div class="scroll-hint" aria-hidden="true"><span class="scroll-hint-arrow">↓</span></div></section><noscript><style>.manuscript-surface{height:auto;min-height:100svh}</style></noscript><main id="portfolio"><div class="portfolio-glass" aria-hidden="true"></div>${home()}</main></body></html>`;
}

// A visible HTML alternative for readers that discard canvas or clipped text.
// Keep its canonical URL on the main portfolio to avoid competing copies in search.
export function profileDocument():string {
  const biography=biographyBlocks().map(block=>{
    const tag=block.kind==='name' ? 'h1' : 'p';
    return `<${tag}>${escapeHtml(block.text)}</${tag}>`;
  }).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Zidan Kazi · text portfolio</title><meta name="description" content="Zidan Kazi. Computer Science &amp; Math at Stevens. Projects and websites."><link rel="canonical" href="${siteUrl}">${readerLinks()}${structuredData()}</head><body><main><section aria-label="About Zidan Kazi">${biography}</section>${home()}<p><a href="/">Animated portfolio</a></p></main></body></html>`;
}

export const manifest = {
  name: 'Zidan Kazi', short_name: 'Zidan Kazi', start_url: '/', display: 'standalone',
  background_color: '#f4eee0', theme_color: '#f4eee0',
  icons: [{src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png'}, {src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png'}],
};
