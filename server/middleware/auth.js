import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'corein-dev-secret-change-me';
const TOKEN_EXPIRY = '24h';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Login required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token', message: 'Session expired. Please login again.' });
  }
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    logSecurityEvent(req, 'UNAUTHORIZED_ADMIN_ACCESS');
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required.' });
  }
  next();
}

export function workerOnly(req, res, next) {
  if (!req.user || req.user.role !== 'worker') {
    return res.status(403).json({ error: 'Forbidden', message: 'Worker access required.' });
  }
  next();
}

export function generateInputHash(userId, taskId, timestamp) {
  return crypto.createHash('sha256').update(`${userId}-${taskId}-${timestamp}-${JWT_SECRET}`).digest('hex').slice(0, 16);
}

const securityLog = [];

export function logSecurityEvent(req, event) {
  securityLog.push({
    event,
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  });
  if (securityLog.length > 500) securityLog.shift();
  console.log(`[SECURITY] ${event} - User: ${req.user?.id || 'anon'} - IP: ${req.ip}`);
}

export function getSecurityLog() {
  return [...securityLog];
}
