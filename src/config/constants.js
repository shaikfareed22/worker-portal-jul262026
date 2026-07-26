export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const TASK_TYPES = ['CODE', 'TEXT', 'DATA', 'DESIGN'];
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const RATES = ['$15/hr', '$20/hr', '$25/hr', '$30/hr', '$35/hr'];
export const STATUSES = ['Not Started', 'In Progress', 'Submitted', 'Completed'];

export const DUAL_IDLE_CUTOFF_MS = 8000;
export const HEARTBEAT_INTERVAL_MS = 5000;
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_FILE_TYPES = ['.py', '.js', '.ts', '.jsx', '.tsx', '.txt', '.md', '.pdf', '.zip', '.json', '.html', '.css', '.csv'];

export const STORAGE_KEYS = {
  USER: 'corein_user',
  THEME: 'corein_theme',
};
