import { useEffect, useRef, useState, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera';
import { useSpeechSync } from '../hooks/useSpeechSync';
import { getClip } from '../utils/db';
import TeleprompterOverlay from '../components/TeleprompterOverlay';

function ActorView({ line, settings, onDone }) {
  const words = line.dialogue.split(/\s+/);
  const videoRef = useRef(null);
  const { startCamera, stopCamera } = useCamera();
  const { wordIndex, start: startSpeech, stop: stopSpeech, reset } = useSpeechSync(words);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    startCamera(videoRef.current);
    return () => {
      stopCamera();
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    if (wordIndex >= words.length) {
      stopSpeech();
      setTimeout(onDone, 600);
    }
  }, [wordIndex, words.length]);

  const handleStart = () => {
    setStarted(true);
    reset();
    startSpeech();
  };

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: `brightness(${settings.videoOpacity})`,
          transform: 'scaleX(-1)',
        }}
        playsInline
        muted
        autoPlay
      />

      {/* Character label */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 pt-safe pt-4">
        <div className="text-white/60 text-xs font-semibold tracking-widest uppercase">
          {line.character} — your line
        </div>
      </div>

      {/* Teleprompter */}
      {started && (
        <TeleprompterOverlay
          words={words}
          wordIndex={wordIndex}
          fontSize={settings.textSize}
        />
      )}

      {/* Start prompt */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button
            onClick={handleStart}
            className="bg-white/90 text-black font-bold text-lg px-8 py-4 rounded-2xl shadow-lg"
          >
            Start Speaking
          </button>
        </div>
      )}

      {/* Skip / done manually */}
      {started && (
        <button
          onClick={() => { stopSpeech(); onDone(); }}
          className="absolute bottom-safe bottom-6 right-5 z-10 bg-white/10 backdrop-blur text-white/70 text-sm px-4 py-2 rounded-xl"
        >
          Next →
        </button>
      )}
    </div>
  );
}

function ReaderView({ line, nextActorLine, settings, onDone }) {
  const videoRef = useRef(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const cueWords = nextActorLine
    ? nextActorLine.split(/\s+/).slice(0, settings.cueWordCount).join(' ')
    : null;

  useEffect(() => {
    let url;
    getClip(line.lineIndex).then(blob => {
      if (blob) {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      }
      setLoading(false);
    });
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [line.lineIndex]);

  const handleEnded = useCallback(() => {
    onDone();
  }, [onDone]);

  return (
    <div className="absolute inset-0 bg-black">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/50 text-sm">Loading…</div>
        </div>
      )}

      {blobUrl && (
        <video
          src={blobUrl}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: `brightness(${settings.videoOpacity})`,
            transform: 'scaleX(-1)',
          }}
          autoPlay
          playsInline
          onEnded={handleEnded}
        />
      )}

      {/* No clip recorded — show text only */}
      {!loading && !blobUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 gap-4">
          <div className="text-white/40 text-xs font-semibold tracking-widest uppercase">
            {line.character}
          </div>
          <p className="text-white text-xl font-medium text-center leading-snug" style={{ fontSize: settings.textSize * 0.7 }}>
            {line.dialogue}
          </p>
          <button
            onClick={onDone}
            className="mt-6 bg-white/10 text-white/70 text-sm px-6 py-3 rounded-xl"
          >
            Next →
          </button>
        </div>
      )}

      {/* Character label */}
      {blobUrl && (
        <div className="absolute top-0 left-0 right-0 z-10 px-5 pt-safe pt-4">
          <div className="text-white/60 text-xs font-semibold tracking-widest uppercase">
            {line.character}
          </div>
          <p
            className="text-white/80 mt-1 leading-snug font-medium"
            style={{ fontSize: settings.textSize * 0.65, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
          >
            {line.dialogue}
          </p>
        </div>
      )}

      {/* Actor cue bar at bottom */}
      {cueWords && blobUrl && (
        <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-safe pb-8">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
            <div className="text-white/35 text-xs mb-1 uppercase tracking-wider">Your cue</div>
            <div
              className="text-white font-bold leading-snug"
              style={{ fontSize: settings.textSize * 0.75, textShadow: '0 0 16px rgba(255,255,255,0.4)' }}
            >
              {cueWords}…
            </div>
          </div>
        </div>
      )}

      {/* Manual next (tap anywhere on video) */}
      {blobUrl && !loading && (
        <button
          onClick={onDone}
          className="absolute bottom-safe bottom-6 right-5 z-20 bg-white/10 backdrop-blur text-white/50 text-sm px-4 py-2 rounded-xl"
        >
          Skip →
        </button>
      )}
    </div>
  );
}

export default function RehearsalScreen({ lines, actorChars, settings, onBack }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const advance = useCallback(() => {
    setLineIndex(prev => {
      if (prev < lines.length - 1) return prev + 1;
      setFinished(true);
      return prev;
    });
  }, [lines.length]);

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-white px-6 gap-6">
        <div className="text-4xl">🎭</div>
        <h2 className="text-2xl font-bold text-center">Ready to rehearse?</h2>
        <p className="text-white/50 text-center text-sm max-w-xs">
          Reader lines will play back your recordings. Your lines will show the teleprompter synced to your voice.
        </p>
        <button
          onClick={() => setStarted(true)}
          className="w-full max-w-xs py-4 bg-white text-black rounded-2xl font-semibold text-base"
        >
          Begin →
        </button>
        <button onClick={onBack} className="text-white/40 text-sm">← Back</button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-white px-6 gap-6">
        <div className="text-5xl">🌟</div>
        <h2 className="text-2xl font-bold text-center">Scene complete!</h2>
        <button
          onClick={() => { setLineIndex(0); setFinished(false); }}
          className="w-full max-w-xs py-4 bg-white text-black rounded-2xl font-semibold"
        >
          Run again
        </button>
        <button onClick={onBack} className="text-white/40 text-sm">← Back to settings</button>
      </div>
    );
  }

  const currentLine = { ...lines[lineIndex], lineIndex };
  const isActor = actorChars.has(currentLine.character);

  // Find the next actor line's dialogue for the cue
  const nextActorLine = (() => {
    for (let i = lineIndex + 1; i < lines.length; i++) {
      if (actorChars.has(lines[i].character)) return lines[i].dialogue;
    }
    return null;
  })();

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Progress dots */}
      <div className="absolute top-safe top-2 left-0 right-0 z-30 flex justify-center gap-1 px-4 pointer-events-none">
        {lines.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i < lineIndex ? 'bg-white/40 flex-1' :
              i === lineIndex ? 'bg-white flex-[2]' :
              'bg-white/15 flex-1'
            }`}
          />
        ))}
      </div>

      {isActor ? (
        <ActorView
          key={`actor-${lineIndex}`}
          line={currentLine}
          settings={settings}
          onDone={advance}
        />
      ) : (
        <ReaderView
          key={`reader-${lineIndex}`}
          line={currentLine}
          nextActorLine={isActor ? null : nextActorLine}
          settings={settings}
          onDone={advance}
        />
      )}
    </div>
  );
}
