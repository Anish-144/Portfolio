import type { ProjectId } from './projects';

/** Where a skill has been applied. Only references backed by a project's actual stack. */
export type SkillUse = { kind: 'project'; id: ProjectId } | { kind: 'experience'; id: string };

export interface Skill {
  name: string;
  usedIn?: SkillUse[];
}

export interface SkillGroup {
  id: string;
  title: string;
  summary: string;
  skills: Skill[];
  /** Secondary, non-interactive list (e.g. tools from the resume). */
  tools?: string[];
}

const project = (id: ProjectId): SkillUse => ({ kind: 'project', id });
const role = (id: string): SkillUse => ({ kind: 'experience', id });

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    id: 'ai',
    title: 'AI Engineering',
    summary: 'Retrieval, agents, and model integration built as dependable software.',
    skills: [
      { name: 'Retrieval-Augmented Generation (RAG)', usedIn: [project('cyberguard')] },
      { name: 'LLM APIs & embeddings', usedIn: [project('cyberguard'), project('auditai'), project('safedrive-ai')] },
      { name: 'FAISS & vector retrieval', usedIn: [project('cyberguard'), project('auditai')] },
      { name: 'LangGraph & agent workflows', usedIn: [project('auditai')] },
      { name: 'Prompt engineering', usedIn: [project('cyberguard')] },
      { name: 'Structured outputs & AI output validation' },
    ],
  },
  {
    id: 'backend',
    title: 'Programming & Backend',
    summary: 'Languages and service frameworks behind the systems.',
    skills: [
      {
        name: 'Python',
        usedIn: [project('auditai'), project('cyberguard'), project('cloudguard'), project('safedrive-ai')],
      },
      { name: 'C++' },
      { name: 'SQL', usedIn: [project('cloudguard'), project('safedrive-ai')] },
      { name: 'FastAPI', usedIn: [project('auditai'), project('cloudguard'), project('safedrive-ai')] },
      { name: 'Flask', usedIn: [project('cyberguard')] },
      {
        name: 'REST APIs',
        usedIn: [project('auditai'), project('cloudguard'), role('metis-intellisystems')],
      },
      { name: 'WebSockets' },
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend',
    summary: 'Interfaces that make AI and security output usable.',
    skills: [
      { name: 'React', usedIn: [project('auditai'), project('cloudguard'), project('safedrive-ai')] },
      { name: 'TypeScript', usedIn: [project('safedrive-ai'), project('cloudguard')] },
      { name: 'Responsive web development' },
    ],
  },
  {
    id: 'cloud',
    title: 'Cloud & Infrastructure',
    summary: 'Deployment, delivery pipelines, and operations.',
    skills: [
      { name: 'AWS', usedIn: [project('cloudguard'), role('metis-intellisystems')] },
      { name: 'Docker', usedIn: [project('auditai'), project('cyberguard'), project('cloudguard')] },
      { name: 'Linux' },
      { name: 'Git & GitHub', usedIn: [role('metis-intellisystems')] },
      { name: 'GitLab CI/CD', usedIn: [role('metis-intellisystems')] },
      { name: 'Prometheus & Grafana' },
    ],
  },
  {
    id: 'data',
    title: 'Data',
    summary: 'Relational storage and vector search.',
    skills: [
      { name: 'PostgreSQL', usedIn: [project('cloudguard'), project('safedrive-ai')] },
      { name: 'MySQL' },
      { name: 'Vector database concepts', usedIn: [project('cyberguard'), project('auditai')] },
    ],
  },
  {
    id: 'security',
    title: 'Cybersecurity',
    summary: 'Detection, response, and cloud security posture.',
    skills: [
      { name: 'SIEM concepts', usedIn: [project('cyberguard'), project('cloudguard')] },
      { name: 'IAM', usedIn: [project('cloudguard')] },
      { name: 'Threat detection', usedIn: [project('cyberguard')] },
      { name: 'Incident response', usedIn: [project('cyberguard')] },
      { name: 'OWASP Top 10' },
      { name: 'Cloud security monitoring', usedIn: [project('cloudguard')] },
    ],
    tools: ['Burp Suite', 'Wireshark', 'Nmap', 'Metasploit', 'Hydra'],
  },
];
