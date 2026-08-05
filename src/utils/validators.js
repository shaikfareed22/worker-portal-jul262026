export function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Invalid email format';
  return null;
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
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
