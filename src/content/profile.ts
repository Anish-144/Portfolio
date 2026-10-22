/**
 * Personal details and section copy. Sources: the brief and
 * AnishPatel_Resume.pdf (April 2026), which confirms the email, GitHub,
 * LinkedIn and graduation date below.
 */

export interface SocialLink {
  id: 'github' | 'linkedin';
  label: string;
  handle: string;
  /** Leave null until the exact URL is confirmed; null links are not rendered. */
  href: string | null;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { id: 'github', label: 'GitHub', handle: 'Anish-144', href: 'https://github.com/Anish-144' },
  { id: 'linkedin', label: 'LinkedIn', handle: 'anish-patel-7y', href: 'https://www.linkedin.com/in/anish-patel-7y' },
];

export const PROFILE = {
  name: 'Anish Patel',
  role: 'AI Engineer',
  focus: ['Agentic AI', 'RAG Systems', 'Cybersecurity'],
  email: 'anishpatel7y@gmail.com',
  education: {
    degree: 'B.Tech, Information and Communication Technology',
    institution: 'Pandit Deendayal Energy University (PDEU)',
    location: 'Gandhinagar',
    graduation: 'Expected May 2027',
  },
} as const;

export const HERO = {
  eyebrow: ['AI Engineer', 'Agentic AI', 'RAG', 'Cybersecurity'],
  headline: [
    ['Building', 'Intelligent', 'Systems.'],
    ['Securing', 'What’s next.'],
  ],
  lede: 'AI engineer building agentic workflows, RAG systems, and security platforms: practical, end-to-end software that holds up beyond the demo.',
  primaryCta: 'Explore projects',
  secondaryCta: 'Contact me',
  annotations: ['AI Systems', 'Agentic Workflows', 'Security Engineering'],
  caption: 'Fig. 01 — System core',
} as const;

export const ABOUT = {
  title: 'Engineering intelligence, end to end.',
  statement: {
    lead: 'I build practical AI systems that do real work.',
    rest: 'Agents, retrieval pipelines, and security platforms, engineered end to end and judged by what they deliver rather than how they demo.',
  },
  paragraphs: [
    'I work where intelligent agents, retrieval-augmented generation, full-stack engineering, cloud infrastructure, and security engineering meet.',
    'My focus is the whole system rather than the model alone: data and retrieval, orchestration, APIs and interfaces, deployment, and the security around all of it.',
  ],
  focusAreas: [
    {
      title: 'AI Engineering',
      detail: 'LLM features built as dependable software, with structured and validated outputs.',
    },
    {
      title: 'Intelligent Agents',
      detail: 'Multi-agent workflows in LangGraph that break complex tasks into specialised, checkable steps.',
    },
    {
      title: 'Retrieval-Augmented Generation',
      detail: 'Model answers grounded in indexed knowledge through embeddings and hybrid search.',
    },
    {
      title: 'Full-Stack Systems',
      detail: 'APIs, data models, and interfaces that turn AI capability into usable products.',
    },
    {
      title: 'Cloud Infrastructure',
      detail: 'Deployment, CI/CD, and cost-aware hosting across AWS, Azure, and GCP.',
    },
    {
      title: 'Security Engineering',
      detail: 'Threat analysis, IAM risk, and cloud monitoring, treated as part of the build.',
    },
  ],
  principles: [
    { title: 'Practical', detail: 'Systems scoped around a real problem and real users, not model showcases.' },
    { title: 'Measurable', detail: 'Outcomes expressed in numbers: time to report, cost reduced, coverage gained.' },
    { title: 'End to end', detail: 'From data and retrieval to APIs, interfaces, deployment, and security.' },
  ],
} as const;

export const CONTACT = {
  title: ['Let’s build', 'what’s next.'],
  invitation:
    'If you are hiring, building, or researching in AI engineering, agentic systems, RAG, cloud, or cybersecurity, I would like to hear from you.',
  topics: ['AI engineering', 'Agentic systems', 'RAG', 'Cloud', 'Cybersecurity'],
} as const;
