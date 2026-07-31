import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../config/constants';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => loadFromStorage(STORAGE_KEYS.THEME, false));

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggle = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      saveToStorage(STORAGE_KEYS.THEME, next);
      return next;
    });
  }, []);

  return { darkMode, toggle };
}
