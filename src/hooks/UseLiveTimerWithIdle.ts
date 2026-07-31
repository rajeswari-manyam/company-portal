// src/hooks/useLiveTimerWithIdle.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getLiveHoursApi,
  startBreakApi,
  endBreakApi,
  logoutAttendanceApi,
} from "../service/Attendance.service";
import { startIdleApi, endIdleApi, getIdleLogsApi } from "../service/IdleApi.service";

export type TimerStatus = 'idle' | 'working' | 'break' | 'logged-out';

const POLL_MS = 30000;
const TICK_MS = 1000;
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;

export function useLiveTimerWithIdle(employeeId?: string) {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [isIdle, setIsIdle] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const currentIdleIdRef = useRef<string | null>(null);
  const idleApiCalledRef = useRef(false);
  const todayRef = useRef(new Date().toISOString().slice(0, 10));

  // Keep a ref mirror of isIdle so the setInterval closure always reads the
  // latest value without needing to be recreated on every state change.
  const isIdleRef = useRef(false);
  const syncIsIdle = (val: boolean) => {
    isIdleRef.current = val;
    setIsIdle(val);
  };

  /* ── Helpers ───────────────────────────── */
  const secondsToDisplay = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  };

  // ── Fetch today's total idle seconds from backend
  const fetchTodayIdle = useCallback(async () => {
    if (!employeeId) return 0;
    const logs = await getIdleLogsApi(employeeId);
    const today = new Date().toISOString().slice(0, 10);
    let total = 0;
    logs.forEach((log: any) => {
      if (!log.startTime) return;
      const logDate = log.startTime.slice(0, 10);
      if (logDate === today) {
        const start = new Date(log.startTime).getTime();
        const end = log.endTime ? new Date(log.endTime).getTime() : Date.now();
        total += Math.floor((end - start) / 1000);
      }
    });
    return total;
  }, [employeeId]);

  // ── Initialize on mount
  useEffect(() => {
    if (!employeeId) return;
    (async () => {
      try {
        const res = await getLiveHoursApi(employeeId);
        const serverSecs = Math.round(res.hours * 3600);
        const idleSecs = await fetchTodayIdle();
        setIdleSeconds(idleSecs);
        const saved = localStorage.getItem(`liveTime-${employeeId}`);
        setTotalSeconds(Math.max(serverSecs, saved ? Number(saved) : 0));
        setStatus('working');
      } catch {
        const saved = localStorage.getItem(`liveTime-${employeeId}`);
        if (saved) setTotalSeconds(Number(saved));
      }
    })();
  }, [employeeId, fetchTodayIdle]);

  // ── Persist work seconds
  useEffect(() => {
    if (!employeeId) return;
    localStorage.setItem(`liveTime-${employeeId}`, String(totalSeconds));
  }, [totalSeconds, employeeId]);

  // ── Poll server every POLL_MS
  useEffect(() => {
    if (!employeeId) return;
    const id = setInterval(async () => {
      try {
        const res = await getLiveHoursApi(employeeId);
        const serverSecs = Math.round(res.hours * 3600);
        setTotalSeconds(s => Math.max(s, serverSecs));
      } catch { }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [employeeId]);

  // ── Tick: runs on a stable interval — reads refs, never re-creates
  // statusRef lets us read current status inside the interval without stale closure
  const statusRef = useRef<TimerStatus>('idle');
  useEffect(() => { statusRef.current = status; }, [status]);

  useEffect(() => {
    const id = setInterval(async () => {
      const today = new Date().toISOString().slice(0, 10);
      if (today !== todayRef.current) {
        todayRef.current = today;
        setTotalSeconds(0);
        setIdleSeconds(0);
      }

      const idleNow = Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS;

      if (idleNow) {
        // Start idle session if not already started
        if (!idleApiCalledRef.current && statusRef.current === 'working') {
          try {
            const res = await startIdleApi(employeeId!);
            currentIdleIdRef.current = res.idleId;
            idleApiCalledRef.current = true;
          } catch { }
          syncIsIdle(true);
        }
        setIdleSeconds(s => s + 1);
      } else {
        // User became active again — end idle session if one is open
        if (isIdleRef.current && currentIdleIdRef.current) {
          try { await endIdleApi(currentIdleIdRef.current, 'No activity'); } catch { }
          currentIdleIdRef.current = null;
          idleApiCalledRef.current = false;
        }
        syncIsIdle(false);
        if (statusRef.current === 'working') {
          setTotalSeconds(s => s + 1);
        }
      }
    }, TICK_MS);
    return () => clearInterval(id);
    // Intentionally empty deps — everything is read via refs
  }, [employeeId]);

  // ── Track user activity
  useEffect(() => {
    const onActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('click', onActivity);
    window.addEventListener('touchstart', onActivity);
    window.addEventListener('touchmove', onActivity);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('touchmove', onActivity);
    };
  }, []);

  // ── clearIdle: called by the modal after the user submits a reason.
  // Ends the open idle session on the server and resets all idle state locally.
  const clearIdle = useCallback(async (reason: string) => {
    if (currentIdleIdRef.current) {
      try { await endIdleApi(currentIdleIdRef.current, reason); } catch { }
      currentIdleIdRef.current = null;
    }
    idleApiCalledRef.current = false;
    // Reset activity timestamp so the tick doesn't immediately re-trigger idle
    lastActivityRef.current = Date.now();
    syncIsIdle(false);
  }, []);

  // ── Break actions
  const startBreak = useCallback(async () => {
    if (!employeeId) return;
    try { await startBreakApi(employeeId); setStatus('break'); } catch { }
  }, [employeeId]);

  const endBreak = useCallback(async () => {
    if (!employeeId) return;
    try { await endBreakApi(employeeId); setStatus('working'); } catch { }
  }, [employeeId]);

  const logout = useCallback(async () => {
    if (!employeeId) return;
    try {
      await logoutAttendanceApi(employeeId);
      setStatus('logged-out');
      if (currentIdleIdRef.current) {
        try { await endIdleApi(currentIdleIdRef.current, 'Logout'); } catch { }
        currentIdleIdRef.current = null;
        idleApiCalledRef.current = false;
      }
    } catch { }
  }, [employeeId]);

  return {
    totalSeconds,
    display: secondsToDisplay(totalSeconds),
    status,
    idleSeconds,
    idleDisplay: secondsToDisplay(idleSeconds),
    isIdle,
    clearIdle,
    startBreak,
    endBreak,
    logout,
  };
}