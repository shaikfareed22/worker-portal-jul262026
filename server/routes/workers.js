import { Router } from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import USERS_DB from '../data/users.js';

const router = Router();

router.get('/', authMiddleware, adminOnly, (req, res) => {
  const workers = USERS_DB
    .filter((u) => u.role === 'worker')
    .map(({ password, ...w }) => w);
  res.json({ workers });
});

router.get('/earnings', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const rate = USERS_DB.find((u) => u.id === userId)?.rate || 25;
  res.json({ userId, rate });
});

export default router;
