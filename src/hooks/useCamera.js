import { useRef, useCallback, useState } from 'react';

export function useCamera() {
  const streamRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async (videoEl) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.muted = true;
        await videoEl.play();
      }
      setHasPermission(true);
      setError(null);
      return stream;
    } catch (err) {
      setHasPermission(false);
      setError(err.message);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const getStream = useCallback(() => streamRef.current, []);

  return { startCamera, stopCamera, getStream, hasPermission, error };
}
