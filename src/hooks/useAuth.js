import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { api } from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[AUTH] Setting up onAuthStateChange');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH] onAuthStateChange event:', event, 'session:', !!session);
      if (session?.user) {
        console.log('[AUTH] User ID:', session.user.id);
        try {
          let { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
          console.log('[AUTH] Users query result:', data, 'error:', error);
          if (!data) {
            const meta = session.user.user_metadata || {};
            const { data: inserted, error: insertErr } = await supabase.from('users').upsert({
              id: session.user.id,
              email: session.user.email,
              full_name: meta.full_name || meta.name || session.user.email.split('@')[0],
              role: meta.role || 'worker',
              avatar: (meta.full_name || meta.name || 'U').charAt(0).toUpperCase(),
            }, { onConflict: 'id' }).select().single();
            console.log('[AUTH] Upsert result:', inserted, 'error:', insertErr);
            data = inserted;
          }
          const finalUser = {
            id: session.user.id,
            ...(data || {
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || 'User',
              role: 'worker',
              avatar: 'U',
              hourly_rate: 25,
            }),
          };
          console.log('[AUTH] Setting user:', finalUser.email, 'role:', finalUser.role);
          setUser(finalUser);
        } catch (err) {
          console.error('[AUTH] Catch error:', err);
          setUser({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || 'User',
            role: 'worker',
            avatar: 'U',
            hourly_rate: 25,
          });
        }
      } else {
        console.log('[AUTH] No session, setting user to null');
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const { user: u } = await api.login(email, password);
      setUser(u);
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
    window.location.reload();
  }, []);

  return {
    user, loading, error, login, register, logout,
    isAdmin: user?.role === 'admin',
    isWorker: user?.role === 'worker'
  };
}
