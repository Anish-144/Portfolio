import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Register once, import GSAP from here everywhere so plugins are always available.
gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

export const MOTION_QUERIES = {
  full: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const;

export { gsap, ScrollTrigger, SplitText };
