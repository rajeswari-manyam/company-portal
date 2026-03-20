import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { saveAttendance } from '../data/store';

interface TimeTrackingContextType {
  workSeconds: number;
  idleSeconds: number;
  status: 'working' | 'idle' | 'break' | 'offline';
  completionPercent: number;
  startWork: () => void;
  stopWork: () => void;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | null>(null);

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function TimeTrackingProvider({ userId, children }: { userId?: string; children: ReactNode }) {
  const [workSeconds, setWorkSeconds] = useState(0);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [status, setStatus] = useState<'working' | 'idle' | 'break' | 'offline'>('offline');

  // Use refs so tick() never goes stale
  const workRef = useRef(0);
  const idleRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const checkInTimeRef = useRef<Date>(new Date());

  const tick = useCallback(() => {
    const isIdle = Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS;
    setStatus(isIdle ? 'idle' : 'working');

    if (isIdle) {
      idleRef.current += 1;
      setIdleSeconds(idleRef.current);
    } else {
      workRef.current += 1;
      setWorkSeconds(workRef.current);

      // Save attendance every 60 seconds
      if (userId && workRef.current % 60 === 0) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const fmt = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        const totalTracked = workRef.current + idleRef.current;
        saveAttendance({
          userId,
          date: today,
          workSeconds: workRef.current,
          idleSeconds: idleRef.current,
          // Present = 4h+ of actual work; half-day = 2h–4h; else late
          status: workRef.current >= 14400 ? 'present'
                : workRef.current >= 7200  ? 'half-day'
                : 'late',
          checkIn: fmt(checkInTimeRef.current),
          checkOut: fmt(new Date()),
        });
      }
    }
  }, [userId, today]);

  useEffect(() => {
    if (!userId) return;
    checkInTimeRef.current = new Date();
    workRef.current = 0;
    idleRef.current = 0;
    lastActivityRef.current = Date.now();

    const onActivity = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('click', onActivity);
    window.addEventListener('scroll', onActivity);

    intervalRef.current = setInterval(tick, 1000);
    setStatus('working');

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('scroll', onActivity);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, tick]);

  const completionPercent = Math.min(100, Math.round((workSeconds / 28800) * 100));

  return (
    <TimeTrackingContext.Provider value={{
      workSeconds, idleSeconds, status, completionPercent,
      startWork: () => { lastActivityRef.current = Date.now(); setStatus('working'); },
      stopWork: () => setStatus('offline'),
    }}>
      {children}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking(): TimeTrackingContextType {
  const ctx = useContext(TimeTrackingContext);
  if (!ctx) {
    return { workSeconds: 0, idleSeconds: 0, status: 'offline', completionPercent: 0, startWork: () => {}, stopWork: () => {} };
  }
  return ctx;
}
