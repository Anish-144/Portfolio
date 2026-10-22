import { SECTION_IDS } from '../../config/site';
import { handleSectionLink } from '../../lib/scroll';

/** Quiet scroll cue; also a real link to the next section. */
export function ScrollIndicator() {
  return (
    <a
      className="scroll-cue"
      href={`#${SECTION_IDS.about}`}
      onClick={handleSectionLink(SECTION_IDS.about)}
      aria-label="Scroll to the about section"
      data-reveal="fade"
    >
      <span className="scroll-cue__track" aria-hidden="true">
        <span className="scroll-cue__thumb" />
      </span>
      <span className="scroll-cue__label mono-label" aria-hidden="true">
        Scroll
      </span>
    </a>
  );
}
