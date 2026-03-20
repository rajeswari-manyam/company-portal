// src/pages/employee/MyAttendance.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../modules/attendance/useAttendance';
import { StatCard, Card, Badge } from '../../components/ui';
import { PageHeader } from '../../components/common';
import axios from 'axios';
import { ATT_KEYS } from "../../services/Attendance.service";

/* ── Types ─────────────────────────────────────────────────── */

interface BreakEntry {
  _id: string;
  start: string;
  end?: string;
}

interface SessionEntry {
  _id: string;
  loginTime: string;
  logoutTime?: string;
}

interface TodayAttendance {
  _id: string;
  date: string;
  firstLogin: string;
  lastLogout?: string;
  sessions: SessionEntry[];
  breaks: BreakEntry[];
  totalWorkHours: number;
  breakHours: number;
  status: string;
}

/* ── Helpers ───────────────────────────────────────────────── */

const BASE_URL = (import.meta as unknown as { env: { VITE_API_BASE_URL: string } }).env.VITE_API_BASE_URL;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDuration(startIso: string, endIso?: string) {
  if (!endIso) return 'Ongoing';
  const diff = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Present:  { label: 'P', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  Late:     { label: 'L', color: 'text-amber-700',   bg: 'bg-amber-100'   },
  Absent:   { label: 'A', color: 'text-red-700',     bg: 'bg-red-100'     },
  'Half Day': { label: 'H', color: 'text-blue-700',  bg: 'bg-blue-100'    },
  'On Leave': { label: 'OL', color: 'text-violet-700', bg: 'bg-violet-100' },
};

/* ── Calendar Component ────────────────────────────────────── */

interface CalendarProps {
  records: ReturnType<typeof useAttendance>['records'];
}

function AttendanceCalendar({ records }: CalendarProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });

  // Map date string → status
  const dateStatusMap: Record<string, string> = {};
  records.forEach(r => { dateStatusMap[r.date] = r.status; });

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  // Adjust so Monday is first: shift Sun to end
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const todayStr = now.toISOString().slice(0, 10);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card padding={false}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Attendance Calendar</h3>
          <p className="text-xs text-slate-400">{monthName} {viewYear} — Click any day for details</p>
        </div>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs">‹</button>
          <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs">›</button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 pt-2">
        {days.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 pb-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
        {/* Empty offset cells */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = dateStatusMap[dateStr];
          const cfg = status ? STATUS_CONFIG[status] : null;
          const isToday = dateStr === todayStr;
          const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <div
              key={day}
              className={`rounded-md p-0.5 flex flex-col items-center gap-0.5 min-h-[36px] border transition-all
                ${isToday ? 'border-blue-900 bg-blue-50' : 'border-transparent'}
                ${isWeekend && !status ? 'opacity-40' : ''}
              `}
            >
              <span className={`text-[10px] font-medium ${isToday ? 'text-blue-900 font-bold' : 'text-slate-500'}`}>{day}</span>
              {cfg ? (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

    </Card>
  );
}

/* ── Breaks Dropdown Row ───────────────────────────────────── */

interface BreaksRowProps {
  attendanceId: string;
  colSpan: number;
}

function BreaksDropdown({ attendanceId, colSpan }: BreaksRowProps) {
  const [open, setOpen] = useState(false);
  const [todayData, setTodayData] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (todayData || loading) { setOpen(o => !o); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(`${BASE_URL}/getAttendanceById/${attendanceId}`);
      if (data.success) setTodayData(data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); setOpen(true); }
  };

  return (
    <>
      <td colSpan={colSpan} className="px-4 py-2">
        <button
          onClick={load}
          className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
        >
          {open ? '▲' : '▼'} {open ? 'Hide' : 'View'} Breaks
        </button>
      </td>
      {open && todayData && (
        <tr>
          <td colSpan={colSpan + 1} className="bg-slate-50 px-6 py-3">
            {todayData.breaks.length === 0 ? (
              <p className="text-xs text-slate-400">No breaks recorded</p>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Break Details</p>
                <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-400 border-b border-slate-200 pb-1 mb-1">
                  <span>#</span>
                  <span>Start</span>
                  <span>End</span>
                  <span>Duration</span>
                </div>
                {todayData.breaks.map((b, idx) => (
                  <div key={b._id} className="grid grid-cols-4 gap-2 text-xs text-slate-700">
                    <span className="font-semibold">{idx + 1}</span>
                    <span>{fmtTime(b.start)}</span>
                    <span>{b.end ? fmtTime(b.end) : <span className="text-amber-500">Ongoing</span>}</span>
                    <span>{fmtDuration(b.start, b.end)}</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Attendance Table with breaks ──────────────────────────── */

interface AttendanceTableWithBreaksProps {
  records: ReturnType<typeof useAttendance>['records'];
}

function AttendanceTableWithBreaks({ records }: AttendanceTableWithBreaksProps) {
  const storedAttId =
    sessionStorage.getItem(ATT_KEYS.attendanceId) ??
    localStorage.getItem('att_attendanceId') ??
    null;

  function formatSeconds(s: number) {
    if (!s) return '—';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function getCompletionPct(ws: number) {
    return Math.min(Math.round((ws / (8 * 3600)) * 100), 100);
  }

  const cols = ['Date', 'Check In', 'Check Out', 'Hours Worked', 'Status', 'Completion', 'Breaks'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {cols.map(c => (
              <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {records.length === 0 ? (
            <tr>
              <td colSpan={cols.length} className="text-center py-12 text-slate-400">
                <div className="text-3xl mb-2">📅</div>
                No attendance records found
              </td>
            </tr>
          ) : records.map(r => {
            const pct = getCompletionPct(r.workSeconds);
            // Use stored attendance ID for today's record, else use record's own _id
            const isToday = r.date === new Date().toISOString().slice(0, 10);
            const attId = isToday && storedAttId ? storedAttId : r._id;

            return (
              <React.Fragment key={`${r.userId}-${r.date}-${r._id}`}>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.date}</td>
                  <td className="px-4 py-3 text-slate-600">{r.checkIn ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.checkOut ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatSeconds(r.workSeconds)}</td>
                  <td className="px-4 py-3">
                    <Badge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {/* Inline breaks toggle — fetches from API using attendanceId */}
                    <BreaksInlineToggle attendanceId={attId} />
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Inline Breaks Toggle (per-row) ───────────────────────── */

function BreaksInlineToggle({ attendanceId }: { attendanceId: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && !data) {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/getAttendanceById/${attendanceId}`);
        if (res.data.success) setData(res.data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    setOpen(o => !o);
  };

  return (
    <div>
      <button
        onClick={toggle}
        className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
      >
        {loading ? '...' : open ? '▲ Hide' : '▼ View'}
      </button>

      {open && data && (
        <div className="mt-2 bg-slate-50 rounded-lg p-3 min-w-[260px] z-10 shadow-sm border border-slate-100">
          {data.breaks.length === 0 ? (
            <p className="text-xs text-slate-400">No breaks recorded</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-slate-400 border-b border-slate-200 pb-1 mb-2 uppercase">
                <span>#</span><span>Start</span><span>End</span><span>Duration</span>
              </div>
              {data.breaks.map((b, i) => (
                <div key={b._id} className="grid grid-cols-4 gap-2 text-xs text-slate-700 py-0.5">
                  <span className="font-semibold">{i + 1}</span>
                  <span>{fmtTime(b.start)}</span>
                  <span>{b.end ? fmtTime(b.end) : <span className="text-amber-500 font-medium">Active</span>}</span>
                  <span className="text-slate-500">{fmtDuration(b.start, b.end)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function MyAttendance() {
  const { user } = useAuth();
  const { filtered, stats, records } = useAttendance(user?._id);

  const statCards = [
    { label: 'Present',       value: stats.present,   icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Late',          value: stats.late,       icon: '⏰', bg: 'bg-amber-50',   text: 'text-amber-700'  },
    { label: 'Half Day',      value: stats.halfDay,    icon: '🌓', bg: 'bg-blue-50',    text: 'text-blue-700'   },
    { label: 'Total Records', value: records.length,   icon: '📋', bg: 'bg-slate-50',   text: 'text-slate-700'  },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance" subtitle="View your attendance history" />

      {/* 1 — Calendar (compact, first) */}
      <AttendanceCalendar records={records} />

      {/* 2 — Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* 3 — History table with breaks */}
      <Card padding={false}>
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Attendance History</h3>
          <p className="text-xs text-slate-400 mt-0.5">Click "View" in the Breaks column to see break details</p>
        </div>
        <AttendanceTableWithBreaks records={filtered} />
      </Card>
    </div>
  );
}