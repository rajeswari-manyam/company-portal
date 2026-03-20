import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLiveTimer } from "../../../hooks/useLiveTimer";
import type { TimerStatus } from "../../../hooks/useLiveTimer";
import { ATT_KEYS } from '../../../services/Attendance.service';
import toast from 'react-hot-toast';

/* ───────── helpers ───────── */

function getStoredAttendanceId(): string | null {
  return (
    sessionStorage.getItem(ATT_KEYS.attendanceId) ??
    localStorage.getItem('att_attendanceId') ??
    null
  );
}

function resolveInitialStatus(raw: string | null): TimerStatus {
  if (!raw) return 'idle';
  const v = raw.toLowerCase();
  if (v === 'present' || v === 'late' || v === 'half day') {
    return 'working';
  }
  return 'idle';
}

/* ───────── component ───────── */

// No props needed — reads employeeId from auth context
export default function LiveAttendanceWidget() {
  const { user } = useAuth();

  const [attendanceId] = useState<string | null>(getStoredAttendanceId);

  const storedStatus =
    sessionStorage.getItem(ATT_KEYS.attendanceStatus) ??
    localStorage.getItem('att_status');

  const initialStatus = resolveInitialStatus(storedStatus);

  const storedRunningHours = parseFloat(
    sessionStorage.getItem(ATT_KEYS.runningHours) ??
      localStorage.getItem('att_runningHours') ??
      '0'
  );

  const employeeId = user?._id ?? '';

  const {
    display,
    totalSeconds,
    status,
    isLoading,
    error,
    startBreak,
    endBreak,
    logout,
  } = useLiveTimer(
    employeeId,
    attendanceId ?? undefined,
    initialStatus,
    storedRunningHours
  );

  /* ───── error toast ───── */
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const isOnBreak = status === 'break';
  const isDone = status === 'logged-out';

  const WORK_DAY = 8 * 3600;
  const progress = Math.min(totalSeconds / WORK_DAY, 1);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  /* ───────── UI ───────── */

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6 flex flex-col items-center gap-5">

      {/* header */}
      <div className="w-full flex justify-between items-center">
        <h2 className="text-sm font-bold text-blue-900">
          TODAY'S HOURS
        </h2>

        <span
          className={`text-xs font-bold uppercase ${
            status === 'working'
              ? 'text-emerald-500'
              : status === 'break'
              ? 'text-amber-500'
              : 'text-slate-400'
          }`}
        >
          {status === 'working'
            ? '● Working'
            : status === 'break'
            ? '◑ On Break'
            : status === 'logged-out'
            ? '○ Logged Out'
            : '○ Not Started'}
        </span>
      </div>

      {/* timer circle */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="absolute w-full h-full">
          <circle cx="72" cy="72" r={radius} stroke="#e2e8f0" strokeWidth="8" fill="none" />
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={isOnBreak ? '#f59e0b' : '#1e3a8a'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 72 72)"
          />
        </svg>

        <div className="text-center">
          <div className="text-xl font-mono font-bold text-blue-900">
            {display}
          </div>
          <div className="text-[10px] text-slate-400">HH:MM:SS</div>
        </div>
      </div>

      {/* progress */}
      <p className="text-xs text-slate-500">
        {Math.round(progress * 100)}% of 8-hour workday
      </p>

      {/* buttons */}
      {!isDone && (
        <div className="flex gap-3">
          {isOnBreak ? (
            <button
              onClick={endBreak}
              disabled={isLoading}
              className="px-4 py-2 rounded-full bg-blue-900 text-white text-xs font-bold disabled:opacity-50"
            >
              ▶ Resume
            </button>
          ) : (
            <button
              onClick={startBreak}
              disabled={isLoading}
              className="px-4 py-2 rounded-full bg-amber-500 text-white text-xs font-bold disabled:opacity-50"
            >
              ⏸ Break
            </button>
          )}

          <button
            onClick={logout}
            disabled={isLoading || !employeeId}
            className="px-4 py-2 rounded-full bg-red-500 text-white text-xs font-bold disabled:opacity-50"
          >
            ⏹ Clock Out
          </button>
        </div>
      )}

      {/* done */}
      {isDone && (
        <p className="text-xs text-slate-500 text-center">
          You've clocked out for today 👋
        </p>
      )}

    </div>
  );
}