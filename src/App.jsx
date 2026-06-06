import { useState, useEffect } from 'react';
import UploadScreen from './screens/UploadScreen';
import ScriptScreen from './screens/ScriptScreen';
import SettingsScreen from './screens/SettingsScreen';
import RecordingScreen from './screens/RecordingScreen';
import RehearsalScreen from './screens/RehearsalScreen';
import { saveScript, loadScript } from './utils/db';

const DEFAULT_SETTINGS = {
  textSize: 32,
  videoOpacity: 0.7,
  cueWordCount: 4,
};

export default function App() {
  const [screen, setScreen] = useState('upload');
  const [scriptLines, setScriptLines] = useState([]);
  const [actorChars, setActorChars] = useState(new Set());
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    loadScript().then(saved => {
      if (saved?.lines?.length) {
        setScriptLines(saved.lines);
        if (saved.actorChars) setActorChars(new Set(saved.actorChars));
        setScreen('settings');
      }
    });
  }, []);

  const handleScriptParsed = async (lines) => {
    setScriptLines(lines);
    await saveScript({ lines });
    setScreen('script');
  };

  const handleCharacterConfirm = async (chars) => {
    setActorChars(chars);
    await saveScript({ lines: scriptLines, actorChars: [...chars] });
    setScreen('settings');
  };

  return (
    <div
      className="relative overflow-hidden bg-black"
      style={{ width: '100%', maxWidth: '430px', height: '100dvh', margin: '0 auto' }}
    >
      {screen === 'upload' && (
        <UploadScreen onScriptParsed={handleScriptParsed} />
      )}
      {screen === 'script' && (
        <ScriptScreen
          lines={scriptLines}
          onConfirm={handleCharacterConfirm}
          onBack={() => setScreen('upload')}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onChange={setSettings}
          onStart={() => setScreen('recording')}
          onBack={() => setScreen('script')}
        />
      )}
      {screen === 'recording' && (
        <RecordingScreen
          lines={scriptLines}
          actorChars={actorChars}
          settings={settings}
          onFinished={() => setScreen('rehearsal')}
          onBack={() => setScreen('settings')}
        />
      )}
      {screen === 'rehearsal' && (
        <RehearsalScreen
          lines={scriptLines}
          actorChars={actorChars}
          settings={settings}
          onBack={() => setScreen('settings')}
        />
      )}
    </div>
  );
}
