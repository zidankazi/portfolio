export type Skill = {
    name: string;
    icon: string; // Simple Icons slug
};

export type SkillCategory = {
    title: string;
    skills: Skill[];
};

// Row 1: Languages & AI (for ticker)
export const skillsRow1: Skill[] = [
    { name: 'Python', icon: 'python' },
    { name: 'TypeScript', icon: 'typescript' },
    { name: 'JavaScript', icon: 'javascript' },
    { name: 'Java', icon: 'java' },
    { name: 'Swift', icon: 'swift' },
    { name: 'C', icon: 'c' },
    { name: 'SQL', icon: 'mysql' },
    { name: 'Claude', icon: 'anthropic' },
    { name: 'OpenAI', icon: 'openai' },
    { name: 'Gemini', icon: 'gemini' },
    { name: 'xAI', icon: 'x' },
];

// Row 2: Frameworks, Tools & Platforms (for ticker)
export const skillsRow2: Skill[] = [
    { name: 'React', icon: 'react' },
    { name: 'Next.js', icon: 'nextjs' },
    { name: 'Node.js', icon: 'nodejs' },
    { name: 'Electron', icon: 'electron' },
    { name: 'SwiftUI', icon: 'swift' },
    { name: 'iOS', icon: 'apple' },
    { name: 'Flask', icon: 'flask' },
    { name: 'FastAPI', icon: 'fastapi' },
    { name: 'PostgreSQL', icon: 'postgresql' },
    { name: 'Prisma', icon: 'prisma' },
    { name: 'Docker', icon: 'docker' },
    { name: 'AWS', icon: 'amazonwebservices' },
    { name: 'Vercel', icon: 'vercel' },
    { name: 'Figma', icon: 'figma' },
    { name: 'Tailwind', icon: 'tailwindcss' },
];

// Categorized skills for the skills page
export const skillCategories: SkillCategory[] = [
    {
        title: 'Languages',
        skills: [
            { name: 'Python', icon: 'python' },
            { name: 'TypeScript', icon: 'typescript' },
            { name: 'JavaScript', icon: 'javascript' },
            { name: 'Java', icon: 'java' },
            { name: 'C', icon: 'c' },
            { name: 'Swift', icon: 'swift' },
            { name: 'SQL', icon: 'mysql' },
        ],
    },
    {
        title: 'Frontend',
        skills: [
            { name: 'React', icon: 'react' },
            { name: 'Next.js', icon: 'nextjs' },
            { name: 'Tailwind', icon: 'tailwindcss' },
            { name: 'Framer Motion', icon: 'framer' },
        ],
    },
    {
        title: 'Backend',
        skills: [
            { name: 'Node.js', icon: 'nodejs' },
            { name: 'Express', icon: 'express' },
            { name: 'Flask', icon: 'flask' },
            { name: 'FastAPI', icon: 'fastapi' },
            { name: 'Prisma', icon: 'prisma' },
        ],
    },
    {
        title: 'Mobile & Desktop',
        skills: [
            { name: 'SwiftUI', icon: 'swift' },
            { name: 'iOS', icon: 'apple' },
            { name: 'Electron', icon: 'electron' },
            { name: 'React Native', icon: 'react' },
        ],
    },
    {
        title: 'Databases',
        skills: [
            { name: 'PostgreSQL', icon: 'postgresql' },
            { name: 'Redis', icon: 'redis' },
            { name: 'Supabase', icon: 'supabase' },
            { name: 'Firebase', icon: 'firebase' },
        ],
    },
    {
        title: 'AI & ML',
        skills: [
            { name: 'Claude', icon: 'anthropic' },
            { name: 'OpenAI', icon: 'openai' },
            { name: 'Gemini', icon: 'gemini' },
            { name: 'xAI / Grok', icon: 'x' },
            { name: 'LangChain', icon: 'langchain' },
            { name: 'Hugging Face', icon: 'huggingface' },
        ],
    },
    {
        title: 'DevOps & Cloud',
        skills: [
            { name: 'GitHub Actions', icon: 'githubactions' },
            { name: 'Docker', icon: 'docker' },
            { name: 'AWS', icon: 'amazonwebservices' },
            { name: 'Vercel', icon: 'vercel' },
        ],
    },
    {
        title: 'Design & Testing',
        skills: [
            { name: 'Figma', icon: 'figma' },
            { name: 'Jest', icon: 'jest' },
            { name: 'Pytest', icon: 'pytest' },
            { name: 'Playwright', icon: 'playwright' },
        ],
    },
];
