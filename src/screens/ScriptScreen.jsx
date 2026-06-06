import { useState } from 'react';
import { getCharacters } from '../utils/scriptParser';

export default function ScriptScreen({ lines, onConfirm, onBack }) {
  const characters = getCharacters(lines);
  const [actorChars, setActorChars] = useState(new Set());

  const toggle = (char) => {
    setActorChars(prev => {
      const next = new Set(prev);
      if (next.has(char)) next.delete(char);
      else next.add(char);
      return next;
    });
  };

  const canContinue = actorChars.size > 0;

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-white/10">
        <button onClick={onBack} className="text-white/50 hover:text-white text-xl leading-none p-1">‹</button>
        <div>
          <h2 className="text-base font-semibold leading-tight">Your character</h2>
          <p className="text-white/40 text-xs">{lines.length} lines found</p>
        </div>
      </div>

      {/* Character selection */}
      <div className="px-4 py-4">
        <p className="text-white/50 text-sm mb-3">Who are you playing? (select one or more)</p>
        <div className="flex flex-col gap-2">
          {characters.map(char => (
            <button
              key={char}
              onClick={() => toggle(char)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left
                ${actorChars.has(char)
                  ? 'bg-white text-black border-white font-medium'
                  : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'}`}
            >
              <span className="tracking-wide text-sm">{char}</span>
              {actorChars.has(char) && <span className="text-black text-lg">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Script preview */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">Script preview</p>
        <div className="flex flex-col gap-2">
          {lines.map((line, i) => {
            const isActor = actorChars.has(line.character);
            return (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 ${isActor ? 'bg-white/10 border border-white/20' : 'bg-white/3'}`}
              >
                <div className={`text-xs font-semibold mb-0.5 ${isActor ? 'text-white' : 'text-white/35'}`}>
                  {line.character}
                  {isActor && <span className="ml-1 text-white/50 font-normal">(you)</span>}
                </div>
                <div className={`text-sm leading-snug ${isActor ? 'text-white/90' : 'text-white/45'}`}>
                  {line.dialogue}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Continue */}
      <div className="px-4 pb-safe pb-6 pt-3 border-t border-white/10">
        <button
          disabled={!canContinue}
          onClick={() => onConfirm(actorChars)}
          className={`w-full py-4 rounded-2xl text-base font-semibold transition-all
            ${canContinue ? 'bg-white text-black' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
