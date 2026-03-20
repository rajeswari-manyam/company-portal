import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getLiveHoursApi,
  startBreakApi,
  endBreakApi,
  logoutAttendanceApi,
} from "../service/Attendance.service";

export type TimerStatus =
  | 'idle'
  | 'working'
  | 'break'
  | 'logged-out';

const POLL_MS = 30000;
const TICK_MS = 1000;

/* ───────── helper ───────── */
function secondsToDisplay(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);

  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

/* ───────── hook ───────── */
export function useLiveTimer(
  employeeId: string | undefined,
  attendanceId?: string,
  initialStatus: TimerStatus = 'idle',
  initialSeconds = 0
) {
  const [totalSeconds, setTotalSeconds] = useState(Math.round(initialSeconds));
  const [status, setStatus] = useState<TimerStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayRef = useRef(new Date().toISOString().slice(0, 10));

  /* ───── fetch from server ───── */
  const syncFromServer = useCallback(async () => {
    if (!employeeId || status === 'logged-out') return;

    try {
      const res = await getLiveHoursApi(employeeId);
      setTotalSeconds(Math.round(res.hours * 3600));
    } catch {
      // ignore polling errors
    }
  }, [employeeId, status]);

  /* ───── initial load ───── */
  useEffect(() => {
    if (!employeeId) return;

    setIsLoading(true);

    getLiveHoursApi(employeeId)
      .then(res => {
        setTotalSeconds(Math.round(res.hours * 3600));
      })
      .catch(err => {
        setError(err?.message ?? 'Failed to load live hours');
      })
      .finally(() => setIsLoading(false));
  }, [employeeId]);

  /* ───── polling ───── */
  useEffect(() => {
    if (!employeeId) return;

    const id = setInterval(syncFromServer, POLL_MS);
    return () => clearInterval(id);
  }, [employeeId, syncFromServer]);

  /* ───── tick (only working) ───── */
  useEffect(() => {
    if (status !== 'working') return;

    const id = setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);

      if (today !== todayRef.current) {
        todayRef.current = today;
        setTotalSeconds(0);
        return;
      }

      setTotalSeconds(s => s + 1);
    }, TICK_MS);

    return () => clearInterval(id);
  }, [status]);

  /* ───── actions ───── */
  const startBreak = useCallback(async () => {
    if (!employeeId) return;

    setIsLoading(true);
    try {
      await startBreakApi(employeeId);
      setStatus('break');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start break');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const endBreak = useCallback(async () => {
    if (!employeeId) return;

    setIsLoading(true);
    try {
      await endBreakApi(employeeId);
      setStatus('working');
      await syncFromServer();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to end break');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, syncFromServer]);

  const logout = useCallback(async () => {
    if (!employeeId) return;

    setIsLoading(true);
    try {
      await logoutAttendanceApi(employeeId);
      setStatus('logged-out');
      await syncFromServer();
    } catch (e: any) {
      setError(e?.message ?? 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, syncFromServer]);

  return {
    totalSeconds,
    display: secondsToDisplay(totalSeconds),
    status,
    isLoading,
    error,
    startBreak,
    endBreak,
    logout,
  };
}