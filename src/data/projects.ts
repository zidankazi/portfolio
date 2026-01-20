export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  title: string;
  description: string;
  tags: string[];
  links: ProjectLink[];
  bullets: string[];
  notice?: string;
};

export const projects: Project[] = [
  {
    title: 'zilean',
    description: 'privacy-first productivity agent that tracks your digital context to measure focus without sending data to the cloud.',
    tags: ['typescript', 'electron', 'sqlite', 'local llms'],
    links: [
      { label: 'github', href: 'https://github.com/Zilean-Core/zilean' },
      { label: 'site', href: 'https://zilean-site.vercel.app/' },
    ],
    notice: 'github repo is private',
    bullets: [
      'tracks active windows and browser DOM to quantify productivity vs. distraction in real-time',
      'hybrid engine uses cached rules for instant (<10ms) classification, falling back to local LLMs only for ambiguity',
      'optimized SQLite event loop logs continuous telemetry with <1% CPU usage to prevent battery drain'
    ]
  },
  {
    title: 'sage',
    description: 'iMessage supercharged with xAI\'s Grok, bringing live internet access to your group chats.',
    tags: ['swift', 'swiftui', 'xai api', 'ios'],
    links: [
      { label: 'github', href: 'https://github.com/zidank6/sage' },
      { label: 'demo', href: 'https://x.com/zidaaaaaaaannnn/status/2012721935369515508' },
    ],
    bullets: [
      'native iMessage extension that streams real-time AI responses via xAI\'s Grok API',
      'enabled live web search for up-to-the-minute answers on news and crypto within message threads',
      'built with SwiftUI for a seamless, Apple-native feel that matches the iOS design system'
    ]
  },
  {
    title: 'beatrix',
    description: 'govcon bid analyzer that scans 100+ page contracts to find winning opportunities.',
    tags: ['next.js', 'typescript', 'postgresql', 'openai'],
    links: [
      { label: 'github', href: 'https://github.com/zidank6/beatrix/' },
    ],
    notice: 'github repo is private',
    bullets: [
      'scans 100+ page government RFPs and ranks them against company past performance',
      'reduced weekly triage time by 70% (10 hrs → 3 hrs) using automated vector search',
      'interactive dashboard shows exact text citations to build trust with non-technical teams'
    ]
  },
  {
    title: 'henley predictor',
    description: 'sports analytics engine predicting race outcomes at the henley royal regatta.',
    tags: ['python', 'scikit-learn', 'data viz'],
    links: [
      { label: 'github', href: 'https://github.com/zidank6/henley-regatta-predictor' },
    ],
    bullets: [
      'trained a scikit-learn model on decades of historical race data to forecast winners',
      'visualized form and outcome probabilities to identify upsets before they happened'
    ]
  }
];
