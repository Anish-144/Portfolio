/**
 * In-page destinations. Every nav link, CTA and deep link resolves to one of
 * these ids, so renaming a section only happens here.
 */
export const SECTION_IDS = {
  top: 'top',
  about: 'about',
  experience: 'experience',
  projects: 'projects',
  skills: 'skills',
  achievements: 'achievements',
  contact: 'contact',
} as const;

export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

export interface NavItem {
  id: SectionId;
  label: string;
  index: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: SECTION_IDS.top, label: 'Home', index: '00' },
  { id: SECTION_IDS.about, label: 'About', index: '01' },
  { id: SECTION_IDS.experience, label: 'Experience', index: '02' },
  { id: SECTION_IDS.projects, label: 'Projects', index: '03' },
  { id: SECTION_IDS.skills, label: 'Skills', index: '04' },
  { id: SECTION_IDS.achievements, label: 'Achievements', index: '05' },
  { id: SECTION_IDS.contact, label: 'Contact', index: '06' },
];

export const sectionIndex = (id: SectionId): string => NAV_ITEMS.find((item) => item.id === id)?.index ?? '';
