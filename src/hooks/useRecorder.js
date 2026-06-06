import { useRef, useState, useCallback } from 'react';

export function useRecorder() {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback((stream) => {
    if (!stream) return;
    chunksRef.current = [];

    const mimeType = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find(
      t => MediaRecorder.isTypeSupported(t)
    ) || '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(100);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        setIsRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  return { startRecording, stopRecording, isRecording };
}
