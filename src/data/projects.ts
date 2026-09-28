export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  title: string;
  description: string;
  /** Turns the first occurrence of `text` inside `description` into a link. */
  descriptionLink?: { text: string; href: string };
  links: ProjectLink[];
  preview?: string;
  previewMotion?: { src: string; type: 'gif' | 'video' };
  previewSize?: { width: number; height: number };
};

export const projects: Project[] = [
  {
    title: 'relic',
    preview: '/projects/relic-video-poster.webp',
    previewMotion: { src: '/projects/relic.mp4', type: 'video' },
    description: 'the source of truth for ai-native companies. memory that builds itself from your team\'s stack and answers agent queries over mcp, with a source behind every fact.',
    links: [
      { label: 'site', href: 'https://tryrelic.io' },
    ],
  },
  {
    title: 'roster',
    preview: '/projects/roster-demo-poster.webp',
    previewMotion: { src: '/projects/roster-demo.mp4', type: 'video' },
    description: 'terminal multiplexer for claude code agents. run several in real panes and see which one is blocked, working, or done — plus the exact prompt each one is waiting on.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/roster' },
      { label: 'site', href: 'https://roster-dev.vercel.app' },
    ],
  },
  {
    title: 'multi-agent hide and seek',
    preview: '/projects/hide-and-seek.webp',
    previewMotion: { src: '/projects/hide-and-seek.gif', type: 'gif' },
    description: 'trained with self-play ppo, reproducing the emergent tool use from openai\'s 2019 paper.',
    descriptionLink: {
      text: 'openai\'s 2019 paper',
      href: 'https://arxiv.org/abs/1909.07528',
    },
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/hide-and-seek' },
    ],
  },
  {
    title: 'sponge',
    preview: '/projects/sponge.webp',
    description: 'gamified ai-assisted coding interview practice. built in 24 hours at quackhacks \'26.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/sponge' },
      { label: 'site', href: 'https://sponge-alpha.vercel.app' },
      { label: 'demo', href: 'https://youtu.be/vZ8cEIYBHMU' },
    ],
  },
  {
    title: 'zilean',
    preview: '/projects/zilean.webp',
    description: 'privacy-first productivity agent that tracks your digital context to measure focus without sending data to the cloud.',
    links: [
      { label: 'site', href: 'https://zilean.app' },
    ],
  },
  {
    title: 'sage',
    preview: '/projects/sage-demo-poster.webp',
    previewMotion: { src: '/projects/sage-demo.mp4', type: 'video' },
    previewSize: { width: 220, height: 360 },
    description: 'iMessage supercharged with xAI\'s Grok, bringing live internet access to your group chats.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/sage' },
      { label: 'demo', href: 'https://x.com/zidaaaaaaaannnn/status/2012721935369515508' },
    ],
  },
  {
    title: 'orbital',
    preview: '/projects/orbital.webp',
    previewMotion: { src: '/projects/orbital.gif', type: 'gif' },
    description: 'real-time satellite tracker for the terminal. renders earth as a 3d ascii globe and tracks satellites utilizing live sgp4 mechanics.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/orbital' },
    ],
  },
];
