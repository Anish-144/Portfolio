import { HERO } from '../../content/profile';

/** Renders a trailing period as a separate amber glyph. */
function withAccentStop(line: string) {
  if (!line.endsWith('.')) return line;
  return (
    <>
      {line.slice(0, -1)}
      <span className="hero-headline__stop">.</span>
    </>
  );
}

/**
 * Two sentences, five deliberate lines. Each line sits in an overflow mask so
 * the intro timeline can raise it into view. Spaces between the block-level
 * lines keep the accessible text readable as normal words.
 */
export function HeroHeadline({ id }: { id: string }) {
  return (
    <h1 id={id} className="hero-headline">
      {HERO.headline.map((sentence, sentenceIndex) => (
        <span
          key={sentence.join(' ')}
          className={`hero-headline__sentence hero-headline__sentence--${sentenceIndex === 0 ? 'primary' : 'secondary'}`}
        >
          {sentence.map((line) => (
            <span key={line} className="hero-headline__mask">
              <span className="hero-headline__line" data-reveal="line">
                {withAccentStop(line)}
              </span>{' '}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
