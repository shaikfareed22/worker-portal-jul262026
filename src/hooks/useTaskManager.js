import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { tasks: t } = await api.getTasks();
      setTasks(Array.isArray(t) ? t : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = useCallback(async (taskData) => {
    const { task } = await api.createTask(taskData);
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    const { task } = await api.updateTaskStatus(id, status);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return task;
  }, []);

  const startTask = useCallback(async (id) => {
    const { task } = await api.startTask(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return task;
  }, []);

  const submitTask = useCallback(async (id, submission) => {
    const { task } = await api.submitTask(id, submission);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return task;
  }, []);

  const reviewTask = useCallback(async (id, review) => {
    const { task } = await api.reviewTask(id, review);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return task;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, error, fetchTasks, createTask, updateStatus, startTask, submitTask, reviewTask, deleteTask };
}
