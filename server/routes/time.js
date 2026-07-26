import { Router } from 'express';
import { authMiddleware, adminOnly, generateInputHash, logSecurityEvent, getSecurityLog } from '../middleware/auth.js';

const router = Router();

const timeStore = {};
const heartbeatLog = {};

function getTimeKey(userId, taskId) {
  return `${userId}:${taskId}`;
}

router.post('/heartbeat', authMiddleware, (req, res) => {
  try {
    const { taskId, clientTimestamp, inputHash } = req.body;
    const userId = req.user.id;

    if (!taskId || !clientTimestamp || !inputHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const serverTime = Date.now();
    const drift = Math.abs(serverTime - clientTimestamp);
    if (drift > 15000) {
      logSecurityEvent(req, 'TIMESTAMP_MANIPULATION');
      return res.status(400).json({ error: 'Timestamp manipulation detected', drift });
    }

    const expectedHash = generateInputHash(userId, taskId, clientTimestamp);
    if (inputHash !== expectedHash) {
      logSecurityEvent(req, 'INVALID_INPUT_HASH');
      return res.status(400).json({ error: 'Invalid activity proof' });
    }

    const key = getTimeKey(userId, taskId);
    if (!timeStore[key]) {
      timeStore[key] = { activeSeconds: 0, totalElapsed: 0, lastHeartbeat: 0 };
    }

    const session = timeStore[key];
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - session.lastHeartbeat;

    if (session.lastHeartbeat > 0 && elapsed > 0 && elapsed <= 10) {
      session.totalElapsed += elapsed;
      session.activeSeconds += elapsed;
    }

    session.lastHeartbeat = now;

    res.json({
      activeSeconds: session.activeSeconds,
      totalElapsed: session.totalElapsed,
      serverTimestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Heartbeat processing failed' });
  }
});

router.get('/breakdown', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const breakdown = {};

  for (const [key, val] of Object.entries(timeStore)) {
    if (key.startsWith(userId + ':')) {
      const taskId = key.split(':')[1];
      breakdown[taskId] = {
        activeSeconds: val.activeSeconds,
        totalElapsed: val.totalElapsed,
      };
    }
  }

  res.json({ breakdown });
});

router.get('/security', authMiddleware, adminOnly, (req, res) => {
  res.json({ log: getSecurityLog() });
});

export default router;
