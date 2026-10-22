import type { SectionId } from '../config/site';

/**
 * Teardown labels: the component each section isolates. Specs describe the
 * real geometry in `src/components/scene/parts` (counts match the model).
 */
export interface BreakdownLabel {
  section: SectionId;
  part: string;
  name: string;
  spec: string;
}

export const BREAKDOWN: readonly BreakdownLabel[] = [
  { section: 'about', part: 'Part 01', name: 'Core unit', spec: 'Split shell · inner gyro · 10-blade iris · pole crowns' },
  { section: 'experience', part: 'Part 02', name: 'Indexing ring', spec: '9 machined segments · 22-ball bearing · stepped rotation' },
  { section: 'projects', part: 'Part 03', name: 'Full assembly', spec: 'Exploded view · 8 assemblies' },
  { section: 'skills', part: 'Part 04', name: 'Turbine stage', spec: 'Rotor and stator rows · coolant loops · data bus' },
  { section: 'achievements', part: 'Part 05', name: 'Instrument gimbals', spec: 'Gear race · 3 meshing pinions · graduated dial' },
];
