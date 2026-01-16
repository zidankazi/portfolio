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
    description: 'focus assistant that detects distraction and enforces guardrails.',
    tags: ['next.js', 'electron', 'typescript', 'sqlite'],
    links: [
      { label: 'github', href: 'https://github.com/Zilean-Core/zilean' },
      { label: 'site', href: 'https://zilean-site.vercel.app/' },
    ],
    notice: 'github repo is private',
    bullets: [
      'menu-bar macOS app that tracks apps, window titles, and browser tabs to classify focus in real time',
      'deterministic-first pipeline with rules, history reuse, and LLM fallback aligned to user-defined goals',
      'default-to-distracting behavior with auditable decisions and clear guardrails'
    ]
  },
  {
    title: 'beatrix',
    description: 'AI-powered business development intelligence for government contractors',
    tags: ['next.js', 'typescript', 'postgresql', 'openai api'],
    links: [
      { label: 'github', href: 'https://github.com/zidank6/beatrix/' },
    ],
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
