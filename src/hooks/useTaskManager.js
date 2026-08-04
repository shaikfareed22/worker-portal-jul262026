import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { supabase } from '../supabase';

export function useTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const unsubRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      if (!session?.user) {
        if (mounted) { setTasks([]); setLoading(false); }
        return;
      }
      try {
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        const admin = userData?.role === 'admin';
        unsubRef.current = api.subscribeToTasks(session.user.id, admin, (t) => {
          if (mounted) { setTasks(t); setLoading(false); }
        });
      } catch (err) {
        if (mounted) { setError(err.message); setLoading(false); }
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); if (unsubRef.current) unsubRef.current(); };
  }, []);

  const createTask = async (taskData) => {
    const { task } = await api.createTask(taskData);
    return task;
  };

  const updateStatus = async (id, status) => {
    const { task } = await api.updateTaskStatus(id, status);
    return task;
  };

  const startTask = async (id) => {
    const { task } = await api.startTask(id);
    return task;
  };

  const submitTask = async (id, submission) => {
    const { task } = await api.submitTask(id, submission);
    return task;
  };

  const reviewTask = async (id, review) => {
    const { task } = await api.reviewTask(id, review);
    return task;
  };

  const deleteTask = async (id) => {
    await api.deleteTask(id);
  };

  return { tasks, loading, error, createTask, updateStatus, startTask, submitTask, reviewTask, deleteTask };
}
