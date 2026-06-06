export default function SettingsScreen({ settings, onChange, onStart, onBack }) {
  const update = (key, val) => onChange({ ...settings, [key]: val });

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-white/10">
        <button onClick={onBack} className="text-white/50 hover:text-white text-xl leading-none p-1">‹</button>
        <h2 className="text-base font-semibold">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8">
        {/* Text size */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-white/80">Teleprompter text size</label>
            <span className="text-white/50 text-sm font-mono">{settings.textSize}px</span>
          </div>
          <input
            type="range"
            min="18"
            max="52"
            value={settings.textSize}
            onChange={e => update('textSize', Number(e.target.value))}
            className="w-full accent-white"
          />
          <div className="flex justify-between text-xs text-white/25 mt-1">
            <span>Small</span>
            <span>Large</span>
          </div>
          {/* Preview */}
          <div className="mt-3 bg-white/5 rounded-xl px-4 py-3 text-center leading-snug" style={{ fontSize: settings.textSize }}>
            <span className="text-white/30">To be</span>
            {' '}
            <span className="text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>or not</span>
            {' '}
            <span className="text-white/80">to be</span>
          </div>
        </div>

        {/* Video opacity */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-white/80">Video brightness</label>
            <span className="text-white/50 text-sm font-mono">{Math.round(settings.videoOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.videoOpacity}
            onChange={e => update('videoOpacity', Number(e.target.value))}
            className="w-full accent-white"
          />
          <div className="flex justify-between text-xs text-white/25 mt-1">
            <span>Black (max contrast)</span>
            <span>Full video</span>
          </div>
        </div>

        {/* Cue words preview count */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-white/80">Your line preview</label>
            <span className="text-white/50 text-sm font-mono">{settings.cueWordCount} words</span>
          </div>
          <input
            type="range"
            min="2"
            max="8"
            value={settings.cueWordCount}
            onChange={e => update('cueWordCount', Number(e.target.value))}
            className="w-full accent-white"
          />
          <p className="text-xs text-white/30 mt-2">
            While the reader speaks, this many words of your next line appear at the bottom as a cue.
          </p>
        </div>
      </div>

      <div className="px-4 pb-safe pb-6 pt-3 border-t border-white/10">
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl text-base font-semibold bg-white text-black"
        >
          Start Recording →
        </button>
      </div>
    </div>
  );
}
