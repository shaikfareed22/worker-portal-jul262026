import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../config/constants';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => loadFromStorage(STORAGE_KEYS.THEME, false));

  const toggle = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      saveToStorage(STORAGE_KEYS.THEME, next);
      return next;
    });
  }, []);

  return { darkMode, toggle };
}
