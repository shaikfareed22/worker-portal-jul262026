import { useState, useCallback } from 'react';

export function useNotification() {
  const [notification, setNotification] = useState('');

  const show = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  }, []);

  const clear = useCallback(() => setNotification(''), []);

  return { notification, show, clear };
}
