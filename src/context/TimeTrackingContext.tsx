// src/context/TimeTrackingContext.tsx
import {
  createContext, useContext, useState, useEffect,
  useRef, useCallback, type ReactNode,
} from 'react';
import React from 'react';
import toast from 'react-hot-toast';

import {
  getLiveHoursApi,
  startBreakApi,
  endBreakApi,
  getAttendanceByEmpIdApi,
  type AttendanceRecord,
} from '../service/Attendance.service';

import {
  startIdleApi,
  endIdleApi,
  getIdleLogsApi,
  updateActivityApi,
  type IdleSession,
} from '../service/IdleApi.service';

import IdleReasonModal from '../modules/idle/components/IdleReasonModal';

// To this:
export interface TimeTrackingContextType {
  workSeconds: number;
  idleSeconds: number;
  breakSeconds: number;
  isIdle: boolean;
  isOnBreak: boolean;
  showIdleModal: boolean;
  status: 'working' | 'idle' | 'break' | 'offline';
  completionPercent: number;
  todayIdleSessions: number;
  todayIdleSecs: number;
  startWork: () => void;
  stopWork: () => void;
  startBreak: () => void;
  resumeWork: () => void;
  endIdle: (reason: string) => Promise<void>;
}

// To this:
export const TimeTrackingContext = createContext<TimeTrackingContextType | null>(null);

// ─── Constants ────────────────────────────────────────────────────────────────
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;  // 5 min inactivity → idle
const WORK_DAY_SECS = 8 * 3600;
const ACTIVITY_PING_MS = 60_000;
const AUTO_LOGOUT_HOUR = 18;
const AUTO_LOGOUT_MINUTE = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sumTodayIdleSecs(sessions: IdleSession[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return sessions
    .filter(s => s.startTime?.slice(0, 10) === today && !!s.endTime)
    .reduce((sum, s) => sum + Math.max(
      0,
      Math.floor(
        (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 1000,
      ),
    ), 0);
}

function countTodayIdleSessions(sessions: IdleSession[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return sessions.filter(s => s.startTime?.slice(0, 10) === today).length;
}

/** Per-user, per-day cache so the work timer survives a page refresh even if the server restore comes back empty. */
function workCacheKey(userId: string): string {
  return `tt_workSecs_${userId}_${new Date().toISOString().slice(0, 10)}`;
}

function readCachedWorkSecs(userId: string): number {
  return Number(localStorage.getItem(workCacheKey(userId))) || 0;
}

function writeCachedWorkSecs(userId: string, secs: number): void {
  try { localStorage.setItem(workCacheKey(userId), String(secs)); } catch { /* ignore */ }
}

/**
 * Calculate elapsed work seconds from the attendance record directly.
 * Uses firstLogin and caps at the auto-logout time (6:30 PM), subtracting break time.
 */
function calcWorkSecsFromRecord(record: any): number {
  if (!record) return 0;

  const dateStr = (record.date ?? record.createdAt ?? '').slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const isPast = dateStr < today;

  const firstLoginIso = record.sessions?.[0]?.loginTime ?? record.firstLogin;
  if (!firstLoginIso) return 0;

  const loginTime = new Date(firstLoginIso);
  const autoLogout = new Date(
    `${dateStr}T${String(AUTO_LOGOUT_HOUR).padStart(2, '0')}:${String(AUTO_LOGOUT_MINUTE).padStart(2, '0')}:00`,
  );

  // Determine the effective "now" or last logout
  const sessions: any[] = record.sessions ?? [];
  const lastSessionWithLogout = [...sessions].reverse().find((s: any) => s.logoutTime);
  let effectiveEnd: Date;
  if (lastSessionWithLogout?.logoutTime) {
    effectiveEnd = new Date(lastSessionWithLogout.logoutTime);
  } else if (isPast) {
    effectiveEnd = autoLogout;
  } else {
    effectiveEnd = new Date();
  }
  if (effectiveEnd > autoLogout) effectiveEnd = autoLogout;

  const totalMs = effectiveEnd.getTime() - loginTime.getTime();
  if (totalMs <= 0) return 0;

  // Subtract completed break time
  const breaks: any[] = record.breaks ?? [];
  let breakMs = 0;
  breaks.forEach((b: any) => {
    if (b.start && b.end) {
      breakMs += Math.max(0, new Date(b.end).getTime() - new Date(b.start).getTime());
    }
  });

  const workMs = Math.max(0, totalMs - breakMs);
  return Math.min(Math.floor(workMs / 1000), AUTO_LOGOUT_HOUR * 3600); // cap at 18h
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function TimeTrackingProvider({
  userId,
  children,
}: {
  userId?: string;
  children: ReactNode;
}) {
  const [workSeconds, setWorkSeconds] = useState(0);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [showIdleModal, setShowIdleModal] = useState(false);
  const [idleModalError, setIdleModalError] = useState('');
  const [idleSaving, setIdleSaving] = useState(false);
  const [status, setStatus] = useState<'working' | 'idle' | 'break' | 'offline'>('offline');

  const [todayIdleSessions, setTodayIdleSessions] = useState(0);
  const [todayIdleSecs, setTodayIdleSecs] = useState(0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const workRef = useRef(0);
  const idleRef = useRef(0);
  const breakRef = useRef(0);
  const completedBreakRef = useRef(0);
  const currentBreakStartRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const tabFocusedRef = useRef<boolean>(!document.hidden);
  const isOnBreakRef = useRef(false);
  const wasIdleRef = useRef(false);
  const currentIdleIdRef = useRef<string | null>(null);
  const idleApiCalledRef = useRef(false);
  const modalOpenRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityPingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef(userId);
  const openSessionRestoredRef = useRef(false);
  // Gate: tick won't run until all restores are complete
  const restoredRef = useRef(false);

  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const today = new Date().toISOString().slice(0, 10);

  // ── Keep modalOpenRef in sync with showIdleModal state ───────────────────
  useEffect(() => {
    modalOpenRef.current = showIdleModal;
  }, [showIdleModal]);

  // ── Open idle modal (centralised) ─────────────────────────────────────────
  const openIdleModal = useCallback((idleId: string | null, restoredIdleSecs = 0) => {
    currentIdleIdRef.current = idleId;
    idleApiCalledRef.current = idleId !== null;
    wasIdleRef.current = true;
    if (restoredIdleSecs > 0) {
      idleRef.current = restoredIdleSecs;
      setIdleSeconds(restoredIdleSecs);
    }
    setIsIdle(true);
    setStatus('idle');
    setShowIdleModal(true);
  }, []);

  // ── Sync break state from attendance record ────────────────────────────────
  const syncBreakFromApi = useCallback(async (isMount = false): Promise<void> => {
    if (!userIdRef.current) return;
    try {
      const records = await getAttendanceByEmpIdApi(userIdRef.current);
      const todayRecord = records.find((r: AttendanceRecord) => r.date?.slice(0, 10) === today);
      if (!todayRecord) return;

      const breaks: Array<{ start: string; end?: string }> = (todayRecord as any).breaks ?? [];

      let completedSecs = 0;
      breaks.forEach(b => {
        if (b.start && b.end) {
          completedSecs += Math.max(
            0,
            Math.floor((new Date(b.end).getTime() - new Date(b.start).getTime()) / 1000),
          );
        }
      });
      completedBreakRef.current = completedSecs;

      const lastBreak = breaks[breaks.length - 1];
      const activeBreak = lastBreak?.start && !lastBreak.end;

      if (activeBreak) {
        const openStart = new Date(lastBreak.start).getTime();
        const elapsedSecs = Math.floor((Date.now() - openStart) / 1000);
        const totalSecs = completedSecs + Math.max(0, elapsedSecs);
        currentBreakStartRef.current = openStart;
        breakRef.current = totalSecs;
        setBreakSeconds(totalSecs);
        if (!isOnBreakRef.current) {
          isOnBreakRef.current = true;
          setIsOnBreak(true);
          setStatus('break');
        }
      } else {
        currentBreakStartRef.current = null;
        if (!isMount && isOnBreakRef.current) {
          isOnBreakRef.current = false;
          setIsOnBreak(false);
          setStatus('working');
          lastActivityRef.current = Date.now();
        }
        if (completedSecs > breakRef.current) {
          breakRef.current = completedSecs;
          setBreakSeconds(completedSecs);
        }
      }
    } catch (err) {
      console.error('[TimeTracking] ❌ syncBreakFromApi failed:', err);
    }
  }, [today]);

  // ── Refresh idle summary ───────────────────────────────────────────────────
  const refreshIdleLogs = useCallback(async (isFirstLoad = false): Promise<void> => {
    if (!userIdRef.current) return;
    try {
      const sessions = await getIdleLogsApi(userIdRef.current);
      const secs = sumTodayIdleSecs(sessions);
      const count = countTodayIdleSessions(sessions);
      setTodayIdleSecs(secs);
      setTodayIdleSessions(count);

      if (!isFirstLoad) {
        // Periodic refresh: keep idle ref in sync (only for closed sessions)
        if (secs > idleRef.current) {
          idleRef.current = secs;
          setIdleSeconds(secs);
        }
      }
    } catch (err) {
      console.error('[TimeTracking] ❌ refreshIdleLogs failed:', err);
    }
  }, []);

  // ── endIdle: employee submits reason ──────────────────────────────────────
  // Resumes work locally no matter what — a server-side hiccup on /endIdleTime
  // shouldn't trap the user behind a modal they can never get past.
  const endIdle = useCallback(async (reason: string) => {
    setIdleSaving(true);
    setIdleModalError('');

    const idleId = currentIdleIdRef.current;
    currentIdleIdRef.current = null;
    idleApiCalledRef.current = false;
    wasIdleRef.current = false;

    setIsIdle(false);
    setShowIdleModal(false);
    setStatus('working');
    lastActivityRef.current = Date.now();
    setIdleSaving(false);

    try {
      if (userIdRef.current) {
        await endIdleApi(userIdRef.current, reason, idleId ?? undefined);
      }
      await refreshIdleLogs(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      console.error('[TimeTracking] ❌ endIdleApi failed, resumed locally anyway:', e);
      toast.error(err?.response?.data?.message ?? 'Idle reason could not be saved to the server.');
    }
  }, [refreshIdleLogs]);

  // ── MASTER RESTORE: runs once on mount, gates the tick ────────────────────
  useEffect(() => {
    if (!userId) return;

    const restore = async () => {
      console.log('[TimeTracking] 🔄 Starting restore for userId:', userId);

      await Promise.allSettled([

        // ── 1. Work hours ──────────────────────────────────────────────────
        (async () => {
          const cachedSecs = readCachedWorkSecs(userId);
          if (cachedSecs > 0) {
            // Show the last known value immediately so the timer doesn't visually reset to 0 while restoring
            workRef.current = cachedSecs;
            setWorkSeconds(cachedSecs);
          }

          let restoredSecs = 0;

          try {
            const live = await getLiveHoursApi(userId);
            const liveHours = live?.hours ?? 0;

            if (liveHours > 0 && liveHours <= 12) {
              restoredSecs = Math.round(liveHours * 3600);
              console.log('[TimeTracking] ✅ Work restored from live API:', restoredSecs, 'secs (', liveHours, 'hrs)');
            }
          } catch {
            console.warn('[TimeTracking] ⚠️ getLiveHoursApi failed, falling back to attendance record');
          }

          if (!restoredSecs) {
            try {
              const records = await getAttendanceByEmpIdApi(userId);
              const todayStr = new Date().toISOString().slice(0, 10);
              const todayRecord = records.find(
                (r: any) => (r.date ?? r.createdAt ?? '').slice(0, 10) === todayStr,
              );
              if (todayRecord) {
                restoredSecs = calcWorkSecsFromRecord(todayRecord);
                console.log('[TimeTracking] ✅ Work restored from attendance record:', restoredSecs, 'secs');
              }
            } catch (err) {
              console.error('[TimeTracking] ❌ Attendance fallback failed:', err);
            }
          }

          // Never regress below what we already know from the local cache —
          // a flaky/empty server response shouldn't visually roll the timer back.
          const finalSecs = Math.max(restoredSecs, cachedSecs);
          if (finalSecs > 0) {
            workRef.current = finalSecs;
            setWorkSeconds(finalSecs);
            writeCachedWorkSecs(userId, finalSecs);
          }
        })(),

        // ── 2. Break state ─────────────────────────────────────────────────
        syncBreakFromApi(true),

        // ── 3. Idle logs + open-session modal restore ──────────────────────
        (async () => {
          if (!userIdRef.current) return;
          const todayStr = new Date().toISOString().slice(0, 10);

          try {
            // Step A: fetch idle logs for summary counts
            const sessions = await getIdleLogsApi(userIdRef.current);
            const secs = sumTodayIdleSecs(sessions);
            const count = countTodayIdleSessions(sessions);
            setTodayIdleSecs(secs);
            setTodayIdleSessions(count);

            // Step B: look for an open idle session in getIdleLogs result
            let openSession: IdleSession | undefined = sessions.find(
              (s: IdleSession) => s.startTime?.slice(0, 10) === todayStr && !s.endTime,
            );

            // Step C: FALLBACK — check attendance record's embedded idles[]
            // This is the fix: /getIdleLogs may not return the open session,
            // but the attendance record always has it embedded in idles[].
            if (!openSession) {
              console.log('[TimeTracking] 🔍 No open idle in getIdleLogs, checking attendance idles[]...');
              try {
                const records = await getAttendanceByEmpIdApi(userIdRef.current);
                const todayRecord = records.find(
                  (r: any) => (r.date ?? r.createdAt ?? '').slice(0, 10) === todayStr,
                );
                const rawIdles: any[] = (todayRecord as any)?.idles ?? [];
                const openRaw = rawIdles.find((i: any) => (i.start || i.startTime) && !i.end && !i.endTime);

                if (openRaw) {
                  const startField = openRaw.start ?? openRaw.startTime ?? '';
                  openSession = {
                    _id: openRaw._id ?? '',
                    employeeId: userIdRef.current,
                    startTime: startField,
                    endTime: undefined,
                    reason: openRaw.reason,
                  };
                  console.log('[TimeTracking] ✅ Found open idle in attendance idles[], idleId:', openRaw._id);
                }
              } catch (attErr) {
                console.warn('[TimeTracking] ⚠️ Attendance idles[] fallback failed:', attErr);
              }
            }

            // Step D: seed idle seconds and optionally restore modal
            const openElapsed = openSession
              ? Math.max(0, Math.floor(
                (Date.now() - new Date(openSession.startTime).getTime()) / 1000,
              ))
              : 0;

            const totalIdleSecs = secs + openElapsed;
            if (totalIdleSecs > 0) {
              idleRef.current = totalIdleSecs;
              setIdleSeconds(totalIdleSecs);
            }

            if (!openSessionRestoredRef.current) {
              openSessionRestoredRef.current = true;
              if (openSession) {
                console.log('[TimeTracking] 🔁 Restoring idle modal, idleId:', openSession._id);
                openIdleModal(openSession._id, openElapsed);
              }
            }
          } catch (err) {
            console.error('[TimeTracking] ❌ Idle restore failed:', err);
          }
        })(),

      ]);

      restoredRef.current = true;
      console.log('[TimeTracking] ✅ All restores complete. Tick unlocked.');
    };

    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Periodic idle log refresh every 60s ───────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    idleRefreshRef.current = setInterval(() => refreshIdleLogs(false), 60_000);
    return () => {
      if (idleRefreshRef.current) clearInterval(idleRefreshRef.current);
    };
  }, [userId, refreshIdleLogs]);

  // ── Heartbeat ping every 60s ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    activityPingRef.current = setInterval(() => {
      if (!wasIdleRef.current && !isOnBreakRef.current && userIdRef.current) {
        updateActivityApi(userIdRef.current).catch(() => { });
      }
    }, ACTIVITY_PING_MS);
    return () => {
      if (activityPingRef.current) clearInterval(activityPingRef.current);
    };
  }, [userId]);

  // ── Main 1-second tick ────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const tick = () => {
      // Wait for restore to finish before counting
      if (!restoredRef.current) return;

      // On break — only advance break counter
      if (isOnBreakRef.current) {
        if (currentBreakStartRef.current !== null) {
          const elapsed = Math.floor((Date.now() - currentBreakStartRef.current) / 1000);
          const total = completedBreakRef.current + Math.max(0, elapsed);
          breakRef.current = total;
          setBreakSeconds(total);
        } else {
          breakRef.current += 1;
          setBreakSeconds(b => b + 1);
        }
        return;
      }

      const msSinceActivity = Date.now() - lastActivityRef.current;
      // Only flag idle while this tab is the focused/visible window — we have no way to see
      // mouse/keyboard activity in another app or tab, so don't punish switching away to work elsewhere.
      const idleNow = tabFocusedRef.current && msSinceActivity > IDLE_THRESHOLD_MS;

      if (idleNow) {
        // First tick where idle is detected
        if (!wasIdleRef.current) {
          console.log('[TimeTracking] 💤 Idle detected. Inactive for:', Math.floor(msSinceActivity / 1000), 'secs');
          openIdleModal(null);

          if (!idleApiCalledRef.current && userIdRef.current) {
            idleApiCalledRef.current = true;
            startIdleApi(userIdRef.current)
              .then(res => {
                if (res.idleId) {
                  currentIdleIdRef.current = res.idleId;
                  console.log('[TimeTracking] 🆔 Idle session started, idleId:', res.idleId);
                }
              })
              .catch(() => { idleApiCalledRef.current = false; });
          }
        }
        // Work timer frozen while idle; only idle counter advances
        idleRef.current += 1;
        setIdleSeconds(idleRef.current);

      } else {
        // User is active — auto-close idle if modal was dismissed without submitting
        if (wasIdleRef.current && !modalOpenRef.current) {
          if (userIdRef.current) {
            endIdleApi(
              userIdRef.current,
              'No activity',
              currentIdleIdRef.current ?? undefined,
            )
              .then(() => refreshIdleLogs(false))
              .catch(() => { });
          }
          currentIdleIdRef.current = null;
          idleApiCalledRef.current = false;
          wasIdleRef.current = false;
          setIsIdle(false);
          setShowIdleModal(false);
          setStatus('working');
        }

        // Advance work timer only when not idle and modal is not blocking
        if (!modalOpenRef.current && !wasIdleRef.current) {
          workRef.current += 1;
          setWorkSeconds(workRef.current);
          if (userIdRef.current) writeCachedWorkSecs(userIdRef.current, workRef.current);
        }
      }
    };

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 1000);
    setStatus('working');

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, refreshIdleLogs, openIdleModal]);

  // ── DOM activity listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const onActivity = () => {
      if (modalOpenRef.current) return;
      lastActivityRef.current = Date.now();
      if (wasIdleRef.current) {
        // Re-open modal so user can submit a reason (don't auto-end here)
        openIdleModal(currentIdleIdRef.current);
      }
    };

    const events = ['mousedown', 'keydown', 'click', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, onActivity));
  }, [userId, openIdleModal]);

  // ── Tab focus/visibility — pause idle detection while the user is on another app/tab ──
  useEffect(() => {
    if (!userId) return;

    const markFocused = () => {
      tabFocusedRef.current = true;
      lastActivityRef.current = Date.now();
    };
    const markBlurred = () => { tabFocusedRef.current = false; };

    const onVisibility = () => {
      if (document.hidden) markBlurred();
      else markFocused();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', markFocused);
    window.addEventListener('blur', markBlurred);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', markFocused);
      window.removeEventListener('blur', markBlurred);
    };
  }, [userId]);

  // ── Break controls ─────────────────────────────────────────────────────────
  const startBreak = useCallback(() => {
    if (!userIdRef.current) return;
    const apply = () => {
      currentBreakStartRef.current = Date.now();
      isOnBreakRef.current = true;
      setIsOnBreak(true);
      setStatus('break');
    };
    startBreakApi(userIdRef.current)
      .then(apply)
      .catch(() => apply());
  }, []);

  const resumeWork = useCallback(() => {
    if (!userIdRef.current) return;
    const apply = () => {
      completedBreakRef.current = breakRef.current;
      currentBreakStartRef.current = null;
      isOnBreakRef.current = false;
      setIsOnBreak(false);
      setStatus('working');
      lastActivityRef.current = Date.now();
    };
    endBreakApi(userIdRef.current)
      .then(apply)
      .catch(() => apply());
  }, []);

  const completionPercent = Math.min(100, Math.round((workSeconds / WORK_DAY_SECS) * 100));

  return (
    <TimeTrackingContext.Provider
      value={{
        workSeconds, idleSeconds, breakSeconds,
        isIdle, isOnBreak, showIdleModal, status, completionPercent,
        todayIdleSessions, todayIdleSecs,
        startWork: () => setStatus('working'),
        stopWork: () => setStatus('offline'),
        startBreak, resumeWork, endIdle,
      }}
    >
      {children}

      {showIdleModal && (
        <IdleReasonModal
          idleSeconds={idleSeconds}
          saving={idleSaving}
          error={idleModalError}
          onSubmit={endIdle}
        />
      )}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking(): TimeTrackingContextType {
  const ctx = useContext(TimeTrackingContext);
  if (!ctx) throw new Error('useTimeTracking must be used inside TimeTrackingProvider');
  return ctx;
}