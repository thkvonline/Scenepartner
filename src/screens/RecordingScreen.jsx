import { useEffect, useRef, useState, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera';
import { useRecorder } from '../hooks/useRecorder';
import { saveClip, getClip } from '../utils/db';

export default function RecordingScreen({ lines, actorChars, settings, onFinished, onBack }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState('preview'); // preview | countdown | recording | review | done
  const [countdown, setCountdown] = useState(3);
  const [savedIndexes, setSavedIndexes] = useState(new Set());
  const [blobUrl, setBlobUrl] = useState(null);
  const videoRef = useRef(null);
  const reviewRef = useRef(null);

  const { startCamera, stopCamera, getStream } = useCamera();
  const { startRecording, stopRecording, isRecording } = useRecorder();

  const currentLine = lines[lineIndex];
  const isActorLine = actorChars.has(currentLine?.character);

  // Start camera on mount
  useEffect(() => {
    startCamera(videoRef.current);
    return () => stopCamera();
  }, []);

  // Reattach stream when phase changes back to preview
  useEffect(() => {
    if (phase === 'preview' && videoRef.current && getStream()) {
      videoRef.current.srcObject = getStream();
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [phase, lineIndex]);

  // Countdown logic
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          beginRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const beginRecording = useCallback(() => {
    const stream = getStream();
    if (!stream) return;
    startRecording(stream);
    setPhase('recording');
  }, [getStream, startRecording]);

  const handleStopRecording = useCallback(async () => {
    const blob = await stopRecording();
    if (!blob) return;
    await saveClip(lineIndex, blob);
    setSavedIndexes(prev => new Set([...prev, lineIndex]));
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    setPhase('review');
  }, [stopRecording, lineIndex]);

  const handleRetake = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setPhase('preview');
  }, [blobUrl]);

  const handleAccept = useCallback(async () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    if (lineIndex < lines.length - 1) {
      setLineIndex(i => i + 1);
      setPhase('preview');
    } else {
      setPhase('done');
    }
  }, [blobUrl, lineIndex, lines.length]);

  const skipLine = useCallback(async () => {
    // Record silence/blank for reader lines — just move on
    if (lineIndex < lines.length - 1) {
      setLineIndex(i => i + 1);
      setPhase('preview');
    } else {
      setPhase('done');
    }
  }, [lineIndex, lines.length]);

  const goTo = (i) => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setLineIndex(i);
    setPhase('preview');
  };

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-white px-6 gap-6">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-center">All lines recorded!</h2>
        <p className="text-white/50 text-center text-sm">
          {savedIndexes.size} of {lines.length} lines saved
        </p>
        <button
          onClick={onFinished}
          className="w-full max-w-xs py-4 bg-white text-black rounded-2xl font-semibold text-base"
        >
          Start Rehearsal →
        </button>
        <button onClick={onBack} className="text-white/40 text-sm">
          ← Back to settings
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black text-white relative">
      {/* Camera view (always shown in background) */}
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

      {/* Dark overlay for UI readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Review overlay */}
      {phase === 'review' && blobUrl && (
        <video
          ref={reviewRef}
          src={blobUrl}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          controls={false}
          autoPlay
          loop
          playsInline
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-safe pt-3 pb-2">
          <button onClick={onBack} className="text-white/60 hover:text-white text-sm px-2 py-1">‹ Back</button>
          <div className="text-white/50 text-xs font-mono">
            {lineIndex + 1} / {lines.length}
          </div>
          <div className="w-12" />
        </div>

        {/* Line pills */}
        <div className="px-4 pb-2 overflow-x-auto">
          <div className="flex gap-1.5 w-max">
            {lines.map((line, i) => {
              const isActor = actorChars.has(line.character);
              const isSaved = savedIndexes.has(i);
              const isCurrent = i === lineIndex;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all min-w-[20px]
                    ${isCurrent ? 'bg-white w-6' :
                    isSaved ? (isActor ? 'bg-blue-400 w-4' : 'bg-green-400 w-4') :
                    'bg-white/20 w-4'}`}
                />
              );
            })}
          </div>
        </div>

        {/* Character + dialogue */}
        <div className="px-5 pb-3">
          <div className={`text-xs font-semibold tracking-wider mb-1 ${isActorLine ? 'text-blue-300' : 'text-white/50'}`}>
            {currentLine?.character}
            {isActorLine && <span className="ml-2 bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded text-xs">YOUR LINE</span>}
          </div>
          <p className="text-white text-base leading-snug font-medium">{currentLine?.dialogue}</p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Countdown */}
        {phase === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-8xl font-bold text-white animate-pulse">{countdown}</div>
          </div>
        )}

        {/* Recording indicator */}
        {phase === 'recording' && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500/80 backdrop-blur px-3 py-1.5 rounded-full z-20">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-semibold">REC</span>
          </div>
        )}

        {/* Review badge */}
        {phase === 'review' && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-yellow-500/80 backdrop-blur px-3 py-1.5 rounded-full z-20">
            <span className="text-black text-xs font-semibold">REVIEW</span>
          </div>
        )}

        {/* Controls */}
        <div className="px-5 pb-safe pb-8 flex flex-col gap-3">
          {phase === 'preview' && (
            <div className="flex gap-3">
              <button
                onClick={() => setPhase('countdown')}
                className="flex-1 py-4 bg-red-500 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2"
              >
                <span className="w-3 h-3 rounded-full bg-white" />
                Record
              </button>
              {!isActorLine && (
                <button
                  onClick={skipLine}
                  className="px-5 py-4 bg-white/10 rounded-2xl text-white/70 font-medium text-sm"
                >
                  Skip
                </button>
              )}
            </div>
          )}

          {phase === 'recording' && (
            <button
              onClick={handleStopRecording}
              className="w-full py-4 bg-white rounded-2xl text-black font-semibold text-base flex items-center justify-center gap-2"
            >
              <span className="w-3 h-3 rounded bg-black" />
              Stop
            </button>
          )}

          {phase === 'review' && (
            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 py-4 bg-white/10 rounded-2xl text-white font-medium"
              >
                Retake
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-4 bg-white rounded-2xl text-black font-semibold"
              >
                {lineIndex < lines.length - 1 ? 'Accept →' : 'Done ✓'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
