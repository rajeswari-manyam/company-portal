// src/modules/attendance/components/LiveAttendanceWidget.tsx
import React, { useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLiveTimerWithIdle } from '../../../hooks/UseLiveTimerWithIdle';
import type { TimerStatus } from '../../../hooks/UseLiveTimerWithIdle';
import { ATT_KEYS } from '../../../service/Attendance.service';
import IdleReasonModal from "../../idle/components/IdleReasonModal";

/* ───────── helpers ───────── */

function getStoredAttendanceId(): string | null {
  return (
    sessionStorage.getItem(ATT_KEYS.attendanceId) ??
    localStorage.getItem('att_attendanceId') ??
    null
  );
}

/* ───────── component ───────── */

export default function LiveAttendanceWidget() {
  const { user } = useAuth();
  const employeeId = user?._id ?? '';

  const {
    display,
    totalSeconds,
    status,
    isIdle,
    idleSeconds,
    idleDisplay,
    clearIdle,
    startBreak,
    endBreak,
    logout,
  } = useLiveTimerWithIdle(employeeId || undefined);

  // Modal state
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError]   = useState('');

  const handleIdleSubmit = useCallback(async (reason: string) => {
    setModalSaving(true);
    setModalError('');
    try {
      await clearIdle(reason);
    } catch {
      setModalError('Failed to save. Please try again.');
    } finally {
      setModalSaving(false);
    }
  }, [clearIdle]);

  const isOnBreak = status === 'break';
  const isDone    = status === 'logged-out';

  const WORK_DAY      = 8 * 3600;
  const progress      = Math.min(totalSeconds / WORK_DAY, 1);
  const radius        = 54;
  const circumference = 2 * Math.PI * radius;

  return (
    <>
      {/* ── Idle reason modal — shown whenever isIdle is true ── */}
      {isIdle && (
        <IdleReasonModal
          idleSeconds={idleSeconds}
          onSubmit={handleIdleSubmit}
          saving={modalSaving}
          error={modalError}
        />
      )}

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6 flex flex-col items-center gap-5">

        {/* header */}
        <div className="w-full flex justify-between items-center">
          <h2 className="text-sm font-bold text-blue-900">TODAY'S HOURS</h2>

          <span className={`text-xs font-bold uppercase ${
            isIdle
              ? 'text-orange-400'
              : status === 'working'
              ? 'text-emerald-500'
              : status === 'break'
              ? 'text-amber-500'
              : 'text-slate-400'
          }`}>
            {isIdle
              ? '◌ Idle'
              : status === 'working'
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
              cx="72" cy="72" r={radius}
              stroke={isIdle ? '#fb923c' : isOnBreak ? '#f59e0b' : '#1e3a8a'}
              strokeWidth="8" fill="none" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              transform="rotate(-90 72 72)"
            />
          </svg>
          <div className="text-center">
            <div className="text-xl font-mono font-bold text-blue-900">{display}</div>
            <div className="text-[10px] text-slate-400">HH:MM:SS</div>
          </div>
        </div>

        {/* progress label */}
        <p className="text-xs text-slate-500">
          {Math.round(progress * 100)}% of 8-hour workday
        </p>

        {/* idle indicator strip (shown while idle, before modal interaction) */}
        {isIdle && (
          <div className="w-full flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <span className="text-xs text-orange-600 font-medium">⏳ Idle time</span>
            <span className="text-xs font-mono text-orange-600">{idleDisplay}</span>
          </div>
        )}

        {/* action buttons */}
        {!isDone && (
          <div className="flex gap-3">
            {isOnBreak ? (
              <button
                onClick={endBreak}
                className="px-4 py-2 rounded-full bg-blue-900 text-white text-xs font-bold disabled:opacity-50"
              >
                ▶ Resume
              </button>
            ) : (
              <button
                onClick={startBreak}
                disabled={isIdle}
                className="px-4 py-2 rounded-full bg-amber-500 text-white text-xs font-bold disabled:opacity-50"
              >
                ⏸ Break
              </button>
            )}

            <button
              onClick={logout}
              disabled={!employeeId}
              className="px-4 py-2 rounded-full bg-red-500 text-white text-xs font-bold disabled:opacity-50"
            >
              ⏹ Clock Out
            </button>
          </div>
        )}

        {isDone && (
          <p className="text-xs text-slate-500 text-center">
            You've clocked out for today 👋
          </p>
        )}
      </div>
    </>
  );
}