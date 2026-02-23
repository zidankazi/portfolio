export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  title: string;
  description: string;
  detail?: string;
  conceptImage?: string;
  productImage?: string;
  tags: string[];
  links: ProjectLink[];
  bullets: string[];
  notice?: string;
  image?: string;
  orientation?: 'landscape' | 'portrait';
  colors?: string;
  highlightColor?: string;
};

export const projects: Project[] = [
  {
    title: 'orbital',
    description: 'real-time satellite tracker for the terminal. renders earth as a 3d ascii globe and tracks satellites utilizing live sgp4 mechanics.',
    detail: 'ray-cast 3D globe with accurate day/night cycles and SGP4 orbital propagation from live Celestrak TLE data.',
    conceptImage: '/projects/anthropic_orbital.png',
    productImage: '/projects/orbital_1.gif',
    tags: ['rust', 'terminal', 'mathematics', 'ascii'],
    links: [
      { label: 'github', href: 'https://github.com/zidank6/orbital' },
    ],
    bullets: [
      'rendered a ray-cast 3d globe with continent outlines, accurate day/night cycles, and atmospheric effects inside the terminal using rust',
      'implemented live sgp4 orbital mechanics to accurately propagate and track any satellite using live celestrak tle data',
      'built a real-time heads-up display, complete with an interactive auto-follow chase camera that smoothly interpolates across orbital paths'
    ]
  },
  {
    title: 'zilean',
    description: 'privacy-first productivity agent that tracks your digital context to measure focus without sending data to the cloud.',
    detail: 'hybrid classification engine: cached rules for <10ms instant classification, local LLMs only for ambiguity. <1% CPU overhead.',
    conceptImage: '/projects/anthropic_zilean.png',
    productImage: '/projects/zilean_desktop.png',
    tags: ['typescript', 'electron', 'sqlite', 'local llms'],
    links: [
      { label: 'site', href: 'https://zilean.app' },
    ],
    notice: 'github repo is private',
    image: '/projects/zilean_desktop.png',
    orientation: 'landscape',
    colors: 'from-[#FF4D4D] to-[#F9CB28]',
    highlightColor: '#FF4D4D',
    bullets: [
      'tracks active windows and browser DOM to quantify productivity vs. distraction in real-time',
      'hybrid engine uses cached rules for instant (<10ms) classification, falling back to local LLMs only for ambiguity',
      'optimized SQLite event loop logs continuous telemetry with <1% CPU usage to prevent battery drain'
    ]
  },
  {
    title: 'beatrix',
    description: 'govcon bid analyzer that scans 100+ page contracts to find winning opportunities.',
    detail: 'reduced weekly triage from 10 hrs → 3 hrs. vector search with exact text citations for non-technical trust.',
    conceptImage: '/projects/anthropic_beatrix.png',
    tags: ['next.js', 'typescript', 'postgresql', 'openai'],
    links: [],
    notice: 'github repo is private',
    bullets: [
      'scans 100+ page government RFPs and ranks them against company past performance',
      'reduced weekly triage time by 70% (10 hrs → 3 hrs) using automated vector search',
      'interactive dashboard shows exact text citations to build trust with non-technical teams'
    ]
  },
  {
    title: 'sage',
    description: 'iMessage supercharged with xAI\'s Grok, bringing live internet access to your group chats.',
    detail: 'native iMessage extension streaming real-time AI with live web search for up-to-the-minute answers.',
    conceptImage: '/projects/anthropic_sage.png',
    productImage: '/projects/sage.png',
    tags: ['swift', 'swiftui', 'xai api', 'ios'],
    links: [
      { label: 'github', href: 'https://github.com/zidank6/sage' },
      { label: 'demo', href: 'https://x.com/zidaaaaaaaannnn/status/2012721935369515508' },
    ],
    image: '/projects/sage.png',
    orientation: 'portrait',
    colors: 'from-[#FF0080] to-[#7928CA]',
    highlightColor: '#FF0080',
    bullets: [
      'native iMessage extension that streams real-time AI responses via xAI\'s Grok API',
      'enabled live web search for up-to-the-minute answers on news and crypto within message threads',
      'built with SwiftUI for a seamless, Apple-native feel that matches the iOS design system'
    ]
  },
  {
    title: 'mnist 3d visualizer',
    description: 'neural network from scratch with an interactive 3D web visualizer.',
    detail: 'pure Python/NumPy backprop + Three.js client-side inference. draw a digit, watch activations flow.',
    conceptImage: '/projects/anthropic_mnist.png',
    tags: ['python', 'numpy', 'javascript', 'three.js'],
    links: [
      { label: 'github', href: 'https://github.com/zidank6/neural-net/' },
      { label: 'site', href: 'https://neural-net.vercel.app/' },
    ],
    bullets: [
      'built a neural network from scratch in pure Python/NumPy — implementing backpropagation, ReLU, Softmax, and Cross-Entropy loss without any ML frameworks',
      'built an interactive 3D web visualizer with Three.js that runs inference client-side, letting users draw digits and watch real-time activations flow through the network'
    ]
  },
];
