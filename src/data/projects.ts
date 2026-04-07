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
    title: 'sponge',
    description: 'gamified ai-assisted coding interview practice. built in 24 hours at quackhacks \'26.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/sponge' },
      { label: 'site', href: 'https://sponge-alpha.vercel.app' },
      { label: 'demo', href: 'https://youtu.be/vZ8cEIYBHMU' },
    ],
  },
  {
    title: 'rust-options',
    description: 'a blazing fast equity derivatives pricing engine in rust. sub-microsecond black-scholes, parallel monte carlo, svi calibration, and a transformer vol surface predictor via onnx.',
    links: [
      { label: 'github', href: 'https://github.com/zidankazi/rust-options' },
    ],
  },
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
