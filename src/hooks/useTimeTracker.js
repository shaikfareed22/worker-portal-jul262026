import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { DUAL_IDLE_CUTOFF_MS } from '../config/constants';

const IDLE_THRESHOLD_MS = 20000;

export function useTimeTracker(activeTaskId, isTracking, isPaused) {
  const [taskActiveSeconds, setTaskActiveSeconds] = useState({});
  const [taskTotalElapsed, setTaskTotalElapsed] = useState({});
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [isMouseActive, setIsMouseActive] = useState(false);
  const [isDualInputActive, setIsDualInputActive] = useState(false);

  const lastInputTs = useRef(0);
  const activeIdRef = useRef(activeTaskId);
  const wasActiveRef = useRef(false);
  activeIdRef.current = activeTaskId;

  useEffect(() => {
    if (!isTracking || !activeTaskId || isPaused) {
      setIsKeyboardActive(false);
      setIsMouseActive(false);
      setIsDualInputActive(false);
      wasActiveRef.current = false;
      return;
    }

    const onAnyInput = () => { lastInputTs.current = Date.now(); };

    ['keydown', 'keyup'].forEach((e) => window.addEventListener(e, onAnyInput, { passive: true }));
    ['mousemove', 'mousedown', 'click', 'scroll', 'wheel', 'touchstart'].forEach((e) => window.addEventListener(e, onAnyInput, { passive: true }));

    lastInputTs.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const msSinceInput = lastInputTs.current ? now - lastInputTs.current : 999999;
      const isActive = msSinceInput <= IDLE_THRESHOLD_MS;

      setIsKeyboardActive(isActive);
      setIsMouseActive(isActive);
      setIsDualInputActive(isActive);

      const cur = activeIdRef.current;
      if (cur) {
        setTaskTotalElapsed((p) => ({ ...p, [cur]: (p[cur] || 0) + 1 }));
        if (isActive) {
          setTaskActiveSeconds((p) => ({ ...p, [cur]: (p[cur] || 0) + 1 }));
        }
      }
    }, 1000);

    return () => {
      ['keydown', 'keyup'].forEach((e) => window.removeEventListener(e, onAnyInput));
      ['mousemove', 'mousedown', 'click', 'scroll', 'wheel', 'touchstart'].forEach((e) => window.removeEventListener(e, onAnyInput));
      clearInterval(interval);
    };
  }, [isTracking, isPaused]);

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
