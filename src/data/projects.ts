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
    description: 'autonomous macos productivity engine that passively tracks context to classify focus and block distractions.',
    tags: ['typescript', 'electron', 'next.js', 'ai agents'],
    links: [
      { label: 'github', href: 'https://github.com/Zilean-Core/zilean' },
      { label: 'site', href: 'https://zilean-site.vercel.app/' },
    ],
    notice: 'github repo is private',
    bullets: [
      'background telemetry engine that captures precise app/browser context to reconstruct digital activity without data leaving the device',
      'hybrid classification pipeline optimized for local-first speed, falling back to LLM agents for semantic understanding of complex workflows',
      "enforces a 'guilty-until-proven-productive' philosophy with sophisticated distraction blocking and granular session auditing"
    ]
  },
  {
    title: 'sage',
    description: '@grok but for iMessage, powered by xAI.',
    tags: ['swift', 'swiftui', 'xai api', 'ios'],
    links: [
      { label: 'github', href: 'https://github.com/zidank6/sage' },
      { label: 'demo', href: 'https://x.com/zidaaaaaaaannnn/status/2012721935369515508' },
    ],
    bullets: [
      'iMessage extension with real-time AI responses via xAI\'s Grok API',
      'live search integration for up-to-date answers from web, news, and X',
      'streaming responses with native SwiftUI interface and conversation history'
    ]
  },
  {
    title: 'beatrix',
    description: 'AI-powered business development intelligence for government contractors',
    tags: ['next.js', 'typescript', 'postgresql', 'openai api'],
    links: [
      { label: 'github', href: 'https://github.com/zidank6/beatrix/' },
    ],
    notice: 'github repo is private',
    bullets: [
      'ranks federal contract opportunities with explainable go/no-go recommendations',
      'OpenAI embeddings for semantic similarity and past-performance alignment scoring',
      'PostgreSQL + pgvector pipeline cutting BD triage from 10+ hours to under 3 hours weekly'
    ]
  },
  {
    title: 'henley predictor',
    description: 'sports analytics engine for outcome and form forecasting',
    tags: ['typescript', 'ml ops', 'data viz'],
    links: [
      { label: 'github', href: 'https://github.com/zidank6/henley-regatta-predictor' },
    ],
    bullets: [
      'scikit-learn model predicting Henley Royal Regatta race outcomes',
      'trained on historical performance data from the single-elimination tournament'
    ]
  }
];
