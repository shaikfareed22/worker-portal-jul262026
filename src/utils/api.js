import { API_URL } from '../config/constants';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || data.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (name, email, password) => request('/api/auth/register', { method: 'POST', body: { name, email, password } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),

  getTasks: () => request('/api/tasks'),
  createTask: (task) => request('/api/tasks', { method: 'POST', body: task }),
  updateTaskStatus: (id, status) => request(`/api/tasks/${id}/status`, { method: 'PUT', body: { status } }),
  submitTask: (id, submission) => request(`/api/tasks/${id}/submit`, { method: 'POST', body: submission }),
  reviewTask: (id, review) => request(`/api/tasks/${id}/review`, { method: 'POST', body: review }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),

  getWorkers: () => request('/api/workers'),
  getAuditLog: () => request('/api/audit'),

  sendHeartbeat: (taskId, clientTimestamp, inputHash) =>
    request('/api/time/heartbeat', { method: 'POST', body: { taskId, clientTimestamp, inputHash } }),
  getTimeBreakdown: () => request('/api/time/breakdown'),

  getEarnings: () => request('/api/earnings'),
};
