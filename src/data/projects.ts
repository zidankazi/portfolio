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
    title: 'orbital',
    description: 'real-time satellite tracker for the terminal. renders earth as a 3d ascii globe and tracks satellites utilizing live sgp4 mechanics.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/orbital' },
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
    title: 'beatrix',
    description: 'govcon bid analyzer that scans 100+ page contracts to find winning opportunities.',
    links: [],
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
    title: 'mnist 3d visualizer',
    description: 'neural network from scratch with an interactive 3D web visualizer.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/neural-net/' },
      { label: 'site', href: 'https://neural-net.vercel.app/' },
    ],
  },
];
