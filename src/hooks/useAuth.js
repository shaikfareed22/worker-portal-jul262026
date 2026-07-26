import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { STORAGE_KEYS } from '../config/constants';
import { loadFromStorage, saveToStorage, removeFromStorage } from '../utils/storage';

export function useAuth() {
  const [user, setUser] = useState(() => loadFromStorage(STORAGE_KEYS.USER, null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      api.me().then(({ user: u }) => {
        setUser(u);
        saveToStorage(STORAGE_KEYS.USER, u);
      }).catch(() => {
        setUser(null);
        removeFromStorage(STORAGE_KEYS.USER);
      });
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const { user: u } = await api.login(email, password);
      setUser(u);
      saveToStorage(STORAGE_KEYS.USER, u);
      return u;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError('');
    try {
      const { user: u } = await api.register(name, email, password);
      setUser(u);
      saveToStorage(STORAGE_KEYS.USER, u);
      return u;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    setUser(null);
    removeFromStorage(STORAGE_KEYS.USER);
    window.location.reload();
  }, []);

  return { user, loading, error, login, register, logout, isAdmin: user?.role === 'admin', isWorker: user?.role === 'worker' };
}
