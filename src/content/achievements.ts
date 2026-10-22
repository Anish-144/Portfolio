/** Sources: the brief and AnishPatel_Resume.pdf (April 2026). No verification links are published. */

export interface Highlight {
  id: string;
  figure: string;
  title: string;
  detail: string;
  year: string;
  /** Optional placement data, drawn to scale. */
  placement?: { rank: number; field: number };
}

export interface Credential {
  id: string;
  kind: 'Leadership' | 'Certification' | 'Program';
  title: string;
  issuer: string;
  meta?: string;
  detail?: string;
}

export const HIGHLIGHTS: readonly Highlight[] = [
  {
    id: 'breach-hackathon',
    figure: '1st',
    title: 'Breach Hackathon 2026',
    detail: 'First place · Pandit Deendayal Energy University (PDEU)',
    year: '2026',
  },
  {
    id: 'amazon-ml-challenge',
    figure: 'Top 4%',
    title: 'Amazon ML Challenge 2025',
    detail: 'Ranked about 3,200 of 82,787 participants',
    year: '2025',
    placement: { rank: 3200, field: 82787 },
  },
];

export const CREDENTIALS: readonly Credential[] = [
  {
    id: 'acm-cybersecurity',
    kind: 'Leadership',
    title: 'Cybersecurity Core Committee Member',
    issuer: 'ACM Student Chapter',
    meta: '2025 – 2026',
    detail:
      'Designed and deployed CTF challenges simulating SQLi, XSS, brute-force, and privilege-escalation scenarios, and coordinated hands-on security exercises.',
  },
  {
    id: 'nptel-ethical-hacking',
    kind: 'Certification',
    title: 'Ethical Hacking',
    issuer: 'NPTEL',
    meta: 'Elite · 80/100',
  },
  {
    id: 'google-cybersecurity',
    kind: 'Certification',
    title: 'Google Cybersecurity Professional Certificate',
    issuer: 'Google',
  },
  {
    id: 'mastercard-cybersecurity',
    kind: 'Program',
    title: 'Cybersecurity Virtual Experience Program',
    issuer: 'Mastercard',
  },
];
