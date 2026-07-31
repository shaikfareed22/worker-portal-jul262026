import { useState, useCallback, useRef, useEffect } from 'react';

export function useNotification() {
  const [notification, setNotification] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const show = useCallback((msg) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(msg);
    timerRef.current = setTimeout(() => { setNotification(''); timerRef.current = null; }, 5000);
  }, []);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification('');
    timerRef.current = null;
  }, []);

  return { notification, show, clear };
}
