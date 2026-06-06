import { useRef, useCallback, useState } from 'react';

/**
 * Matches live speech recognition output against a known word list,
 * advancing a word index as the actor speaks.
 */
export function useSpeechSync(words) {
  const recognitionRef = useRef(null);
  const [wordIndex, setWordIndex] = useState(0);
  const wordIndexRef = useRef(0);
  const [isListening, setIsListening] = useState(false);

  const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');

  const findAdvance = useCallback((transcript, fromIndex) => {
    const spoken = transcript.trim().split(/\s+/).map(normalise).filter(Boolean);
    if (!spoken.length) return fromIndex;

    // Try to match the last few spoken words against the script words starting at fromIndex
    let bestIndex = fromIndex;
    const windowSize = Math.min(spoken.length, 6);
    const spokeLast = spoken.slice(-windowSize);

    for (let start = fromIndex; start < Math.min(fromIndex + 20, words.length); start++) {
      let matched = 0;
      for (let i = 0; i < spokeLast.length && start + i < words.length; i++) {
        if (normalise(words[start + i]) === spokeLast[i]) matched++;
        else break;
      }
      if (matched >= Math.min(2, spokeLast.length)) {
        const advance = start + matched;
        if (advance > bestIndex) bestIndex = advance;
      }
    }
    return bestIndex;
  }, [words]);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    wordIndexRef.current = 0;
    setWordIndex(0);

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const newIndex = findAdvance(transcript, wordIndexRef.current);
      if (newIndex > wordIndexRef.current) {
        wordIndexRef.current = newIndex;
        setWordIndex(newIndex);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        // Restart on transient errors
        try { recognition.start(); } catch {}
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition && isListening) {
        try { recognition.start(); } catch {}
      }
    };

    setIsListening(true);
    try { recognition.start(); } catch {}
  }, [findAdvance, isListening]);

  const stop = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    wordIndexRef.current = 0;
    setWordIndex(0);
  }, []);

  return { wordIndex, isListening, start, stop, reset };
}
