import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseCookie } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach((c) => {
    const [key, ...val] = c.split('=');
    if (key) cookies[key.trim()] = val.join('=').trim();
  });
  return cookies;
}

const _salt = bcrypt.genSaltSync(10);
const USERS_DB = [
  { id: 'admin-001', email: 'admin@corein.com', password: bcrypt.hashSync('admin123', _salt), name: 'Admin User', role: 'admin', avatar: 'A', rate: 0, joinedAt: '2026-01-01' },
  { id: 'worker-001', email: 'arjun@corein.com', password: bcrypt.hashSync('worker123', _salt), name: 'Arjun Patel', role: 'worker', avatar: 'A', rate: 25, joinedAt: '2026-03-15' },
  { id: 'worker-002', email: 'priya@corein.com', password: bcrypt.hashSync('worker123', _salt), name: 'Priya Sharma', role: 'worker', avatar: 'P', rate: 30, joinedAt: '2026-04-01' },
];

let tasks = [
  { id: 'PY-001', type: 'CODE', title: 'Python Hello World', project: 'Python Starter Project', status: 'Not Started', loggedTime: '0h 00m', activeSecondsLogged: 0, dueDate: 'Jul 30, 2026', category: 'Active', priority: 'High', rate: '$25/hr', rateNum: 25, description: 'Write a clean Python script that prints "Hello World".', assignedTo: 'worker-001', createdBy: 'admin-001', createdAt: '2026-07-20', submittedCode: '', submittedNotes: '', submittedAt: '', submittedFiles: [], reviewStatus: '', reviewComment: '' },
  { id: 'DATA-002', type: 'DATA', title: 'Data Entry Validation', project: 'Healthcare Records', status: 'In Progress', loggedTime: '0h 45m', activeSecondsLogged: 2700, dueDate: 'Aug 05, 2026', category: 'Active', priority: 'Medium', rate: '$22/hr', rateNum: 22, description: 'Validate and clean patient data entries.', assignedTo: 'worker-001', createdBy: 'admin-001', createdAt: '2026-07-18', submittedCode: '', submittedNotes: '', submittedAt: '', submittedFiles: [], reviewStatus: '', reviewComment: '' },
  { id: 'TEXT-003', type: 'TEXT', title: 'Content Review Q3', project: 'Marketing Copy', status: 'Submitted', loggedTime: '2h 15m', activeSecondsLogged: 8100, dueDate: 'Jul 28, 2026', category: 'Submitted', priority: 'Low', rate: '$20/hr', rateNum: 20, description: 'Review and proofread Q3 marketing copy.', assignedTo: 'worker-001', createdBy: 'admin-001', createdAt: '2026-07-15', submittedCode: 'Review complete. Found 12 grammar issues, all corrected.', submittedNotes: 'Passed QA check.', submittedAt: '2026-07-25T10:30:00', submittedFiles: [], reviewStatus: '', reviewComment: '' },
];

let auditLog = [];
const timeStore = {};
const securityLog = [];

function addAudit(action, message, userId) {
  auditLog.unshift({ id: Date.now(), action, message, userId, timestamp: new Date().toISOString() });
  if (auditLog.length > 500) auditLog.pop();
}

function logSecurity(req, event) {
  securityLog.push({ event, ip: req.socket.remoteAddress, userId: req.user?.id || 'anon', timestamp: new Date().toISOString() });
  if (securityLog.length > 500) securityLog.shift();
  console.log(`[SECURITY] ${event} - User: ${req.user?.id || 'anon'}`);
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': 'http://localhost:5173', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS' });
  res.end(JSON.stringify(data));
}

function html(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': 'http://localhost:5173', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS' });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const cookies = parseCookies(req);

  let body = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    body = await parseBody(req);
  }

  // --- AUTH ROUTES ---
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const { email, password } = body;
    if (!email || !password) return json(res, 400, { error: 'Email and password required' });

    const user = USERS_DB.find((u) => u.email === email);
    if (!user) {
      return json(res, 401, { error: 'Invalid credentials' });
    }
    const passwordValid = bcrypt.compareSync(password, user.password);
    if (!passwordValid) {
      return json(res, 401, { error: 'Invalid credentials' });
    }

    const token = `tok_${user.id}_${Date.now()}`;
    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
    const { password: _, ...safeUser } = user;
    return json(res, 200, { token, user: safeUser });
  }

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const { name, email, password } = body;
    if (!name || !email || !password) return json(res, 400, { error: 'All fields required' });
    if (password.length < 6) return json(res, 400, { error: 'Min 6 characters' });
    if (USERS_DB.find((u) => u.email === email)) return json(res, 409, { error: 'Email taken' });

    const newUser = { id: `worker-${Date.now()}`, email, password, name, role: 'worker', avatar: name[0].toUpperCase(), rate: 20, joinedAt: new Date().toISOString().split('T')[0] };
    USERS_DB.push(newUser);
    const token = `tok_${newUser.id}_${Date.now()}`;
    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
    const { password: _, ...safeUser } = newUser;
    return json(res, 200, { token, user: safeUser });
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; Max-Age=0');
    return json(res, 200, { message: 'Logged out' });
  }

  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const token = cookies.token;
    if (!token) return json(res, 401, { error: 'Not authenticated' });
    const parts = token.split('_');
    const userId = parts[1];
    const user = USERS_DB.find((u) => u.id === userId);
    if (!user) return json(res, 404, { error: 'User not found' });
    const { password: _, ...safeUser } = user;
    return json(res, 200, { user: safeUser });
  }

  // --- Auth check for all /api routes below ---
  const token = cookies.token;
  if (!token || !token.startsWith('tok_')) {
    if (pathname.startsWith('/api/')) return json(res, 401, { error: 'Login required' });
  }

  const userId = token ? token.split('_')[1] : null;
  const currentUser = userId ? USERS_DB.find((u) => u.id === userId) : null;
  req.user = currentUser;

  // --- TASK ROUTES ---
  if (pathname === '/api/tasks' && req.method === 'GET') {
    const result = currentUser?.role === 'admin' ? tasks : tasks.filter((t) => t.assignedTo === userId || t.createdBy === userId);
    return json(res, 200, { tasks: result });
  }

  if (pathname === '/api/tasks' && req.method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') return json(res, 403, { error: 'Admin access required' });
    const { title, project, type, priority, rate, rateNum, dueDate, description, assignedTo } = body;
    if (!title || !project) return json(res, 400, { error: 'Title and project required' });
    const task = { id: `${type || 'TASK'}-${Date.now().toString(36).toUpperCase()}`, type: type || 'CODE', title: title.slice(0, 200), project: project.slice(0, 200), status: 'Not Started', loggedTime: '0h 00m', activeSecondsLogged: 0, dueDate: dueDate || 'Aug 15, 2026', category: 'Active', priority: priority || 'Medium', rate: rate || '$25/hr', rateNum: rateNum || 25, description: (description || '').slice(0, 2000), assignedTo: assignedTo || null, createdBy: userId, createdAt: new Date().toISOString(), submittedCode: '', submittedNotes: '', submittedAt: '', submittedFiles: [], reviewStatus: '', reviewComment: '' };
    tasks.unshift(task);
    addAudit('task_created', `Created: ${task.title}`, userId);
    return json(res, 200, { task });
  }

  const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (taskMatch && req.method === 'DELETE') {
    if (!currentUser || currentUser.role !== 'admin') return json(res, 403, { error: 'Admin access required' });
    const idx = tasks.findIndex((t) => t.id === taskMatch[1]);
    if (idx === -1) return json(res, 404, { error: 'Not found' });
    const [removed] = tasks.splice(idx, 1);
    addAudit('task_deleted', `Deleted: ${removed.title}`, userId);
    return json(res, 200, { message: 'Deleted' });
  }

  const statusMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/status$/);
  if (statusMatch && req.method === 'PUT') {
    const task = tasks.find((t) => t.id === statusMatch[1]);
    if (!task) return json(res, 404, { error: 'Not found' });
    if (currentUser?.role === 'worker' && task.assignedTo !== userId) return json(res, 403, { error: 'Not your task' });
    const { status } = body;
    if (!['Not Started', 'In Progress', 'Submitted', 'Completed'].includes(status)) return json(res, 400, { error: 'Invalid status' });
    task.status = status;
    task.category = status;
    addAudit('task_updated', `${task.title} → ${status}`, userId);
    return json(res, 200, { task });
  }

  const submitMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/submit$/);
  if (submitMatch && req.method === 'POST') {
    const task = tasks.find((t) => t.id === submitMatch[1]);
    if (!task) return json(res, 404, { error: 'Not found' });
    if (currentUser?.role === 'worker' && task.assignedTo !== userId) return json(res, 403, { error: 'Not your task' });
    task.status = 'Submitted';
    task.category = 'Submitted';
    task.submittedCode = (body.submittedCode || '').slice(0, 50000);
    task.submittedNotes = (body.submittedNotes || '').slice(0, 2000);
    task.submittedFiles = Array.isArray(body.submittedFiles) ? body.submittedFiles.slice(0, 20) : [];
    task.submittedAt = new Date().toISOString();
    task.activeSecondsLogged = body.activeSecondsLogged || 0;
    task.loggedTime = body.loggedTime || task.loggedTime;
    addAudit('task_submitted', `Submitted: ${task.title} (${task.loggedTime})`, userId);
    return json(res, 200, { task });
  }

  const reviewMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/review$/);
  if (reviewMatch && req.method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') return json(res, 403, { error: 'Admin access required' });
    const task = tasks.find((t) => t.id === reviewMatch[1]);
    if (!task) return json(res, 404, { error: 'Not found' });
    const { status, comment } = body;
    if (!['Approved', 'Rejected'].includes(status)) return json(res, 400, { error: 'Must be Approved or Rejected' });
    task.reviewStatus = status;
    task.reviewComment = (comment || '').slice(0, 2000);
    task.status = status === 'Approved' ? 'Completed' : 'In Progress';
    task.category = task.status;
    addAudit('task_reviewed', `${task.title}: ${status}`, userId);
    return json(res, 200, { task });
  }

  // --- TIME TRACKING ---
  if (pathname === '/api/time/heartbeat' && req.method === 'POST') {
    if (!currentUser) return json(res, 401, { error: 'Login required' });
    const { taskId, clientTimestamp, inputHash } = body;
    if (!taskId || !clientTimestamp || !inputHash) return json(res, 400, { error: 'Missing fields' });

    const serverTime = Date.now();
    const drift = Math.abs(serverTime - clientTimestamp);
    if (drift > 15000) {
      logSecurity(req, 'TIMESTAMP_MANIPULATION');
      return json(res, 400, { error: 'Timestamp manipulation detected' });
    }

    const timeKey = `${userId}:${taskId}`;
    if (!timeStore[timeKey]) timeStore[timeKey] = { activeSeconds: 0, totalElapsed: 0, lastHeartbeat: 0 };
    const session = timeStore[timeKey];
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - session.lastHeartbeat;
    if (session.lastHeartbeat > 0 && elapsed > 0 && elapsed <= 10) {
      session.totalElapsed += elapsed;
      session.activeSeconds += elapsed;
    }
    session.lastHeartbeat = now;

    return json(res, 200, { activeSeconds: session.activeSeconds, totalElapsed: session.totalElapsed, serverTimestamp: Date.now() });
  }

  if (pathname === '/api/time/breakdown' && req.method === 'GET') {
    if (!currentUser) return json(res, 401, { error: 'Login required' });
    const breakdown = {};
    for (const [key, val] of Object.entries(timeStore)) {
      if (key.startsWith(userId + ':')) {
        breakdown[key.split(':')[1]] = { activeSeconds: val.activeSeconds, totalElapsed: val.totalElapsed };
      }
    }
    return json(res, 200, { breakdown });
  }

  // --- WORKERS ---
  if (pathname === '/api/workers' && req.method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') return json(res, 403, { error: 'Admin required' });
    return json(res, 200, { workers: USERS_DB.filter((u) => u.role === 'worker').map(({ password, ...w }) => w) });
  }

  if (pathname === '/api/audit' && req.method === 'GET') {
    if (!currentUser || currentUser.role !== 'admin') return json(res, 403, { error: 'Admin required' });
    return json(res, 200, { auditLog: auditLog.slice(0, 200) });
  }

  if (pathname === '/api/earnings' && req.method === 'GET') {
    if (!currentUser) return json(res, 401, { error: 'Login required' });
    const rate = currentUser.rate || 25;
    return json(res, 200, { userId, rate });
  }

  // --- SERVE STATIC FILES (Vite build) ---
  if (pathname.startsWith('/api/')) {
    return json(res, 404, { error: 'Endpoint not found' });
  }

  const DIST = path.join(__dirname, 'dist');
  let filePath = path.join(DIST, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      html(res, 404, '<h1>Not Found</h1>');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  COREIN Server running at http://localhost:${PORT}`);
  console.log(`  API: http://localhost:${PORT}/api/*`);
  console.log(`  Frontend: http://localhost:${PORT}\n`);
});
