export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  title: string;
  description: string;
  links: ProjectLink[];
};

export const projects: Project[] = [
  {
    title: 'relic',
    description: 'the source of truth for ai-native companies. memory that builds itself from your team\'s stack and answers agent queries over mcp, with a source behind every fact.',
    links: [
      { label: 'site', href: 'https://tryrelic.io' },
    ],
  },
  {
    title: 'roster',
    description: 'terminal multiplexer for claude code agents. run several in real panes and see which one is blocked, working, or done — plus the exact prompt each one is waiting on.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/roster' },
      { label: 'site', href: 'https://roster-dev.vercel.app' },
    ],
  },
  {
    title: 'hide-and-seek',
    description: 'multi-agent hide and seek trained with self-play ppo, reproducing the emergent tool use from openai\'s 2019 paper.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/hide-and-seek' },
    ],
  },
  {
    title: 'sponge',
    description: 'gamified ai-assisted coding interview practice. built in 24 hours at quackhacks \'26.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/sponge' },
      { label: 'site', href: 'https://sponge-alpha.vercel.app' },
      { label: 'demo', href: 'https://youtu.be/vZ8cEIYBHMU' },
    ],
  },
  {
    title: 'zilean',
    description: 'privacy-first productivity agent that tracks your digital context to measure focus without sending data to the cloud.',
    links: [
      { label: 'site', href: 'https://zilean.app' },
    ],
  },
  {
    title: 'sage',
    description: 'iMessage supercharged with xAI\'s Grok, bringing live internet access to your group chats.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/sage' },
      { label: 'demo', href: 'https://x.com/zidaaaaaaaannnn/status/2012721935369515508' },
    ],
  },
  {
    title: 'orbital',
    description: 'real-time satellite tracker for the terminal. renders earth as a 3d ascii globe and tracks satellites utilizing live sgp4 mechanics.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/orbital' },
    ],
  },
];
