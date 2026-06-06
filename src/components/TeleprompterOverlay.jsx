import { useEffect, useRef } from 'react';

/**
 * Scrolling teleprompter text overlay.
 * Current word is centred vertically; spoken words scroll up and fade.
 */
export default function TeleprompterOverlay({ words, wordIndex, fontSize }) {
  const containerRef = useRef(null);
  const currentRef = useRef(null);

  useEffect(() => {
    if (currentRef.current && containerRef.current) {
      currentRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [wordIndex]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col items-center overflow-hidden pointer-events-none px-5"
      style={{ paddingTop: '30%', paddingBottom: '30%' }}
    >
      <div className="flex flex-col items-center gap-1 w-full">
        {words.map((word, i) => {
          const status =
            i < wordIndex ? 'spoken' :
            i === wordIndex ? 'current' :
            'upcoming';
          return (
            <span
              key={i}
              ref={i === wordIndex ? currentRef : null}
              className={`teleprompter-word text-center font-bold leading-tight ${status}`}
              style={{ fontSize }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
