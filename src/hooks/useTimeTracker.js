import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { DUAL_IDLE_CUTOFF_MS } from '../config/constants';

export function useTimeTracker(activeTaskId, isTracking, isPaused) {
  const [taskActiveSeconds, setTaskActiveSeconds] = useState({});
  const [taskTotalElapsed, setTaskTotalElapsed] = useState({});
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [isMouseActive, setIsMouseActive] = useState(false);
  const [isDualInputActive, setIsDualInputActive] = useState(false);

  const lastKbTs = useRef(0);
  const lastMouseTs = useRef(0);
  const activeIdRef = useRef(activeTaskId);
  activeIdRef.current = activeTaskId;

  useEffect(() => {
    if (!isTracking || !activeTaskId || isPaused) {
      setIsKeyboardActive(false);
      setIsMouseActive(false);
      setIsDualInputActive(false);
      return;
    }

    const onKb = () => { lastKbTs.current = Date.now(); };
    const onMouse = () => { lastMouseTs.current = Date.now(); };

    ['keydown', 'keyup'].forEach((e) => window.addEventListener(e, onKb, { passive: true }));
    ['mousemove', 'mousedown', 'click', 'scroll', 'wheel', 'touchstart'].forEach((e) => window.addEventListener(e, onMouse, { passive: true }));

    lastKbTs.current = Date.now();
    lastMouseTs.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const kbMs = lastKbTs.current ? now - lastKbTs.current : 999999;
      const mouseMs = lastMouseTs.current ? now - lastMouseTs.current : 999999;
      const kbActive = kbMs <= DUAL_IDLE_CUTOFF_MS;
      const mActive = mouseMs <= DUAL_IDLE_CUTOFF_MS;
      const dualActive = kbActive && mActive;

      setIsKeyboardActive(kbActive);
      setIsMouseActive(mActive);
      setIsDualInputActive(dualActive);

      const cur = activeIdRef.current;
      if (cur) {
        if (dualActive) {
          setTaskActiveSeconds((p) => ({ ...p, [cur]: (p[cur] || 0) + 1 }));
        }
        setTaskTotalElapsed((p) => ({ ...p, [cur]: (p[cur] || 0) + 1 }));
      }
    }, 1000);

    return () => {
      ['keydown', 'keyup'].forEach((e) => window.removeEventListener(e, onKb));
      ['mousemove', 'mousedown', 'click', 'scroll', 'wheel', 'touchstart'].forEach((e) => window.removeEventListener(e, onMouse));
      clearInterval(interval);
    };
  }, [isTracking, activeTaskId, isPaused]);

  useEffect(() => {
    if (!isTracking || !activeTaskId || isPaused) return;
    const iv = setInterval(async () => {
      try {
        const ts = Date.now();
        const hash = `${activeTaskId}-${ts}`.slice(0, 16);
        await api.sendHeartbeat(activeTaskId, ts, hash);
      } catch {}
    }, 5000);
    return () => clearInterval(iv);
  }, [isTracking, activeTaskId, isPaused]);

  return { taskActiveSeconds, setTaskActiveSeconds, taskTotalElapsed, setTaskTotalElapsed, isKeyboardActive, isMouseActive, isDualInputActive };
}
