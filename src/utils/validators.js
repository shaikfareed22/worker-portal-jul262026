export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

export function validateTaskInput(task) {
  const errors = [];
  if (!task.title || task.title.trim().length < 3) errors.push('Title must be at least 3 characters');
  if (!task.project || task.project.trim().length < 2) errors.push('Project name is required');
  if (task.title && task.title.length > 200) errors.push('Title must be under 200 characters');
  if (task.description && task.description.length > 2000) errors.push('Description must be under 2000 characters');
  return errors;
}

export function validateFileUpload(file) {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED = ['.py', '.js', '.ts', '.jsx', '.tsx', '.txt', '.md', '.pdf', '.zip', '.json', '.html', '.css', '.csv'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED.includes(ext)) return `File type ${ext} not allowed`;
  if (file.size > MAX_SIZE) return 'File exceeds 10MB limit';
  return null;
}
