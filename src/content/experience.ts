import type { ProjectId } from './projects';

export interface ExperiencePeriod {
  /** Full date range as it should eventually appear. */
  label: string;
  /**
   * False while the range is unconfirmed. Unconfirmed periods publish only
   * `fallbackLabel`, and development builds show a reminder beside them.
   */
  confirmed: boolean;
  fallbackLabel?: string;
  current?: boolean;
}

export interface ExperienceEntry {
  id: string;
  role: string;
  organization: string;
  period: ExperiencePeriod;
  summary: string;
  contributions: string[];
  technologies: string[];
  relatedProject?: ProjectId;
}

export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    id: 'shreya-dixit-foundation',
    role: 'Cloud & AI Engineer Intern',
    organization: 'Shreya Dixit Foundation',
    // Unconfirmed: publishes only the fallback ("2026") until `confirmed` is set.
    period: { label: 'Jan 2026 — Present', confirmed: false, fallbackLabel: '2026', current: true },
    summary:
      'Engineering on an AI-powered full-stack platform for distracted-driving awareness and learning, spanning voice automation, personalised learning, and cloud hosting strategy.',
    contributions: [
      'Contributed to six or more platform modules covering authentication, voice assistance, analytics, and personalised learning.',
      'Integrated ElevenLabs voice automation into the platform’s voice assistance.',
      'Worked with psychological assessment questions that drive personalised learning.',
      'Evaluated more than ten free-tier cloud hosting services and estimated potential infrastructure cost reductions of 40–50%.',
    ],
    technologies: ['ElevenLabs', 'FastAPI', 'Next.js', 'TypeScript', 'Cloud hosting evaluation'],
    relatedProject: 'safedrive-ai',
  },
  {
    id: 'metis-intellisystems',
    // Title, company name and dates as stated in the Metis experience letter
    // (25 May – 6 Jul 2026).
    role: 'Cloud & Full-Stack Development Intern',
    organization: 'Metis Intellisystems Pvt. Ltd.',
    period: { label: 'May — Jul 2026', confirmed: true },
    summary: 'Cloud engineering across dashboard delivery, inference benchmarking, and multi-cloud CI/CD.',
    contributions: [
      'Developed a frontend dashboard for Qanat with more than 15 API-driven features.',
      'Collaborated on comparisons of local versus cloud inference.',
      'Gained hands-on experience with GitLab CI/CD, GitHub Actions, AWS, Azure, and GCP.',
    ],
    technologies: ['GitLab CI/CD', 'GitHub Actions', 'AWS', 'Azure', 'GCP', 'API integration'],
  },
];

export const periodLabel = ({ label, confirmed, fallbackLabel }: ExperiencePeriod): string =>
  confirmed ? label : (fallbackLabel ?? label);
