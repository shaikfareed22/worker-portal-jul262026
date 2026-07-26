import { Router } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import DEFAULT_TASKS from '../data/tasks.js';

const router = Router();
let tasks = [...DEFAULT_TASKS];
let auditLog = [];

function addAudit(action, message, userId) {
  auditLog.unshift({
    id: Date.now(),
    action,
    message,
    userId,
    timestamp: new Date().toISOString(),
  });
  if (auditLog.length > 500) auditLog.pop();
}

router.get('/', authMiddleware, (req, res) => {
  let result;
  if (req.user.role === 'admin') {
    result = tasks;
  } else {
    result = tasks.filter((t) => t.assignedTo === req.user.id || t.createdBy === req.user.id);
  }
  res.json({ tasks: result });
});

router.post('/', authMiddleware, adminOnly, (req, res) => {
  const { title, project, type, priority, rate, rateNum, dueDate, description, assignedTo } = req.body;
  if (!title || !project) {
    return res.status(400).json({ error: 'Title and project required' });
  }

  const task = {
    id: `${type || 'TASK'}-${Date.now().toString(36).toUpperCase()}`,
    type: type || 'CODE',
    title: title.slice(0, 200),
    project: project.slice(0, 200),
    status: 'Not Started',
    loggedTime: '0h 00m',
    activeSecondsLogged: 0,
    dueDate: dueDate || 'Aug 15, 2026',
    category: 'Active',
    priority: priority || 'Medium',
    rate: rate || '$25/hr',
    rateNum: rateNum || 25,
    description: (description || '').slice(0, 2000),
    assignedTo: assignedTo || null,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    submittedCode: '',
    submittedNotes: '',
    submittedAt: '',
    submittedFiles: [],
    reviewStatus: '',
    reviewComment: '',
  };

  tasks.unshift(task);
  addAudit('task_created', `Created: ${task.title}`, req.user.id);
  res.json({ task });
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.user.role === 'worker' && task.assignedTo !== req.user.id) {
    return res.status(403).json({ error: 'Not your task' });
  }

  const { status } = req.body;
  const allowed = ['Not Started', 'In Progress', 'Submitted', 'Completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  task.status = status;
  task.category = status;
  addAudit('task_updated', `${task.title} → ${status}`, req.user.id);
  res.json({ task });
});

router.post('/:id/submit', authMiddleware, (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.user.role === 'worker' && task.assignedTo !== req.user.id) {
    return res.status(403).json({ error: 'Not your task' });
  }

  const { submittedCode, submittedNotes, submittedFiles, activeSecondsLogged } = req.body;

  task.status = 'Submitted';
  task.category = 'Submitted';
  task.submittedCode = (submittedCode || '').slice(0, 50000);
  task.submittedNotes = (submittedNotes || '').slice(0, 2000);
  task.submittedFiles = Array.isArray(submittedFiles) ? submittedFiles.slice(0, 20) : [];
  task.submittedAt = new Date().toISOString();
  task.activeSecondsLogged = activeSecondsLogged || 0;
  task.loggedTime = req.body.loggedTime || task.loggedTime;

  addAudit('task_submitted', `Submitted: ${task.title} (${task.loggedTime})`, req.user.id);
  res.json({ task });
});

router.post('/:id/review', authMiddleware, adminOnly, (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { status, comment } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Approved or Rejected' });
  }

  task.reviewStatus = status;
  task.reviewComment = (comment || '').slice(0, 2000);
  task.status = status === 'Approved' ? 'Completed' : 'In Progress';
  task.category = task.status;

  addAudit('task_reviewed', `${task.title}: ${status}`, req.user.id);
  res.json({ task });
});

router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const idx = tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const [removed] = tasks.splice(idx, 1);
  addAudit('task_deleted', `Deleted: ${removed.title}`, req.user.id);
  res.json({ message: 'Deleted' });
});

router.get('/audit', authMiddleware, adminOnly, (req, res) => {
  res.json({ auditLog: auditLog.slice(0, 200) });
});

export default router;
