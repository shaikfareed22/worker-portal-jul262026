import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

const ACTIVE_THRESHOLD_MS = 10000;
const KEYBOARD_DENSITY_MS = 30000;
const MOUSE_JIGGLE_PX = 5;
const PERSIST_INTERVAL_MS = 3000;
const MAX_RESUME_GAP_S = 120;

const STORAGE_KEY = 'corein_timer_state';

function loadTimerState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveTimerState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function clearTimerState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function useTimeTracker(activeTaskId, isTracking, isPaused) {
  const [taskActiveSeconds, setTaskActiveSeconds] = useState(() => {
    const saved = loadTimerState();
    return saved?.taskActiveSeconds || {};
  });
  const [taskTotalElapsed, setTaskTotalElapsed] = useState(() => {
    const saved = loadTimerState();
    return saved?.taskTotalElapsed || {};
  });
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [isMouseActive, setIsMouseActive] = useState(false);
  const [isDualInputActive, setIsDualInputActive] = useState(false);

  const lastKeyboardTs = useRef(0);
  const lastMouseTs = useRef(0);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMeaningfulMouseTs = useRef(0);
  const activeIdRef = useRef(activeTaskId);
  const isTrackingRef = useRef(isTracking);
  const isPausedRef = useRef(isPaused);
  const restoredRef = useRef(false);

  activeIdRef.current = activeTaskId;
  isTrackingRef.current = isTracking;
  isPausedRef.current = isPaused;

  // Restore on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadTimerState();
    if (saved && saved.isTracking && saved.activeTaskId) {
      const gap = Math.floor((Date.now() - (saved.lastTimestamp || 0)) / 1000);
      if (gap < MAX_RESUME_GAP_S && saved.activeTaskId) {
        const cur = saved.activeTaskId;
        setTaskActiveSeconds((p) => ({ ...p, [cur]: (p[cur] || 0) + gap }));
        setTaskTotalElapsed((p) => ({ ...p, [cur]: (p[cur] || 0) + gap }));
      }
    }
  }, []);

  // Persist state
  useEffect(() => {
    if (!isTracking || !activeTaskId) return;
    const iv = setInterval(() => {
      saveTimerState({
        activeTaskId,
        taskActiveSeconds,
        taskTotalElapsed,
        isTracking: true,
        lastTimestamp: Date.now(),
      });
    }, PERSIST_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [isTracking, activeTaskId, taskActiveSeconds, taskTotalElapsed]);

  // Main tracking effect
  useEffect(() => {
    if (!isTracking || !activeTaskId || isPaused) {
      setIsKeyboardActive(false);
      setIsMouseActive(false);
      setIsDualInputActive(false);
      if (!isTracking) clearTimerState();
      return;
    }

    const onKey = (e) => {
      if (!document.hasFocus()) return;
      const target = e.target;
      if (!target || !target.isConnected) return;
      if (!document.body.contains(target)) return;
      if (!target.getAttribute || target.getAttribute('data-deliverable') !== 'true') return;
      lastKeyboardTs.current = Date.now();
    };

    const onMouse = (e) => {
      const now = Date.now();
      const x = e.clientX || 0;
      const y = e.clientY || 0;
      const dx = x - lastMousePos.current.x;
      const dy = y - lastMousePos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      lastMousePos.current = { x, y };

      if (dist >= MOUSE_JIGGLE_PX) {
        lastMeaningfulMouseTs.current = now;
      }
      lastMouseTs.current = now;
    };

    const onClick = () => {
      lastMeaningfulMouseTs.current = Date.now();
      lastMouseTs.current = Date.now();
    };

    const onScroll = () => {
      lastMeaningfulMouseTs.current = Date.now();
      lastMouseTs.current = Date.now();
    };

    const wasHidden = { current: document.hidden };

    const onPause = () => {
      setIsKeyboardActive(false);
      setIsMouseActive(false);
      setIsDualInputActive(false);
      const cur = activeIdRef.current;
      if (cur) {
        if (document.hidden && !wasHidden.current) {
          api.logTimerEvent(cur, 'tab_blur').catch(() => {});
        } else if (!document.hidden && wasHidden.current) {
          api.logTimerEvent(cur, 'tab_focus').catch(() => {});
        }
      }
      wasHidden.current = document.hidden;
    };

    ['keydown', 'keyup'].forEach((e) => window.addEventListener(e, onKey, { passive: true }));
    ['mousemove', 'touchstart'].forEach((e) => window.addEventListener(e, onMouse, { passive: true }));
    ['mousedown', 'click'].forEach((e) => window.addEventListener(e, onClick, { passive: true }));
    ['scroll', 'wheel'].forEach((e) => window.addEventListener(e, onScroll, { passive: true }));
    document.addEventListener('visibilitychange', onPause);
    window.addEventListener('blur', onPause);

    const now = Date.now();
    lastKeyboardTs.current = now;
    lastMouseTs.current = now;
    lastMeaningfulMouseTs.current = now;

    const interval = setInterval(() => {
      const now = Date.now();
      const cur = activeIdRef.current;

      // Tab/window hidden = pause
      if (document.hidden) {
        setIsKeyboardActive(false);
        setIsMouseActive(false);
        setIsDualInputActive(false);
        return;
      }

      // Keyboard activity (within 10s)
      const kbActive = (now - lastKeyboardTs.current) <= ACTIVE_THRESHOLD_MS;

      // Meaningful mouse activity (within 10s, distance >= 5px)
      const mouseActive = (now - lastMeaningfulMouseTs.current) <= ACTIVE_THRESHOLD_MS;

      // Keyboard density: must have typed within 30s to count as working
      const kbRecent = (now - lastKeyboardTs.current) <= KEYBOARD_DENSITY_MS;

      // Active = (any input) AND (keyboard recently used)
      const active = (kbActive || mouseActive) && kbRecent;

      setIsKeyboardActive(kbActive);
      setIsMouseActive(mouseActive);
      setIsDualInputActive(active);

      if (cur) {
        setTaskTotalElapsed((p) => ({ ...p, [cur]: (p[cur] || 0) + 1 }));
        if (active) {
          setTaskActiveSeconds((p) => ({ ...p, [cur]: (p[cur] || 0) + 1 }));
        }
      }
    }, 1000);

    return () => {
      ['keydown', 'keyup'].forEach((e) => window.removeEventListener(e, onKey));
      ['mousemove', 'touchstart'].forEach((e) => window.removeEventListener(e, onMouse));
      ['mousedown', 'click'].forEach((e) => window.removeEventListener(e, onClick));
      ['scroll', 'wheel'].forEach((e) => window.removeEventListener(e, onScroll));
      document.removeEventListener('visibilitychange', onPause);
      window.removeEventListener('blur', onPause);
      clearInterval(interval);
    };
  }, [isTracking, activeTaskId, isPaused]);

  // Heartbeat
  useEffect(() => {
    if (!isTracking || !activeTaskId || isPaused) return;
    const iv = setInterval(async () => {
      try {
        const ts = Date.now();
        const kbActive = (ts - lastKeyboardTs.current) <= ACTIVE_THRESHOLD_MS;
        const mouseActive = (ts - lastMeaningfulMouseTs.current) <= ACTIVE_THRESHOLD_MS;
        const eventType = kbActive ? 'keyboard' : mouseActive ? 'mouse' : 'idle_detected';
        const hash = `${activeTaskId}-${ts}`.slice(0, 16);
        await api.sendHeartbeat(activeTaskId, ts, hash, eventType);
      } catch {}
    }, 5000);
    return () => clearInterval(iv);
  }, [isTracking, activeTaskId, isPaused]);

  // Periodic screenshot capture (every 60s)
  useEffect(() => {
    if (!isTracking || !activeTaskId || isPaused) return;
    let cancelled = false;
    const captureScreenshot = async () => {
      if (cancelled || document.hidden) return;
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(document.body, {
          logging: false,
          useCORS: true,
          scale: 0.5,
          backgroundColor: null,
        });
        if (cancelled) return;
        canvas.toBlob(async (blob) => {
          if (cancelled || !blob) return;
          await api.captureScreenshot(activeTaskId, blob);
        }, 'image/png', 0.6);
      } catch {}
    };
    const iv = setInterval(captureScreenshot, 60000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [isTracking, activeTaskId, isPaused]);

  return { taskActiveSeconds, setTaskActiveSeconds, taskTotalElapsed, setTaskTotalElapsed, isKeyboardActive, isMouseActive, isDualInputActive };
}
