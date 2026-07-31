// src/pages/employee/MyAttendance.tsx
// ─── Key changes ──────────────────────────────────────────────────────────────
// • IdleToggle now reads r.idles[] directly (embedded in attendance record)
//   instead of a separate idleMap fetched from /getIdleLogs
// • Removed idleMap state and the separate getIdleLogsApi useEffect
// • AttRow and AttTable no longer need/pass idleMap prop
// • AttendanceIdle interface added for the embedded idles shape { start, end, reason }
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAttendanceByEmpIdApi,
  type AttendanceRecord,
} from '../../service/Attendance.service';
import { getDepartmentById } from '../../service/departmentApi';
import { getHolidays as getHolidaysApi } from '../../service/holidayApi';
import { getLeaves } from '../../service/leaveApi';
import { Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import { RefreshCw, CalendarOff, Moon } from 'lucide-react';

// ─── Embedded idle shape (from attendance record) ─────────────────────────────
interface AttendanceIdle {
  _id: string;
  start: string;
  end?: string;
  reason?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtTimeFull(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function fmtDuration(startIso: string, endIso?: string | null): string {
  if (!endIso) return 'Ongoing';
  const diff = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000,
  );
  const m = Math.floor(diff / 60), s = diff % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtHours(h: number): string {
  if (!h || h <= 0) return '—';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return hh > 0 ? `${hh}h ${mm}m` : `${mm}m`;
}

function calcWorkHours(r: AttendanceRecord): number {
  const sessions = r.sessions ?? [];
  if (!sessions.length) return 0;
  const dateStr = r.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const isPast = dateStr < today;
  const autoLogout = new Date(`${dateStr}T18:30:00`);
  const firstLoginIso = sessions[0]?.loginTime;
  if (!firstLoginIso) return 0;
  const firstLogin = new Date(firstLoginIso);
  const lastSessionWithLogout = [...sessions].reverse().find(s => s.logoutTime);
  let lastLogout: Date;
  if (lastSessionWithLogout?.logoutTime) {
    lastLogout = new Date(lastSessionWithLogout.logoutTime);
  } else if (isPast) {
    lastLogout = autoLogout;
  } else {
    lastLogout = new Date();
  }
  if (lastLogout > autoLogout) lastLogout = autoLogout;
  const ms = lastLogout.getTime() - firstLogin.getTime();
  if (ms <= 0) return 0;
  return Math.min(ms / (1000 * 60 * 60), 10);
}

function fmtExtra(workHours: number): string {
  const extra = workHours - 8;
  if (extra <= 0) return '—';
  const hh = Math.floor(extra);
  const mm = Math.round((extra - hh) * 60);
  return `+${hh > 0 ? `${hh}h ` : ''}${mm}m`;
}

function getCheckIn(r: AttendanceRecord): string {
  return fmtTime(r.sessions?.[0]?.loginTime ?? null);
}

function getCheckOut(r: AttendanceRecord): string {
  const sessions = r.sessions ?? [];
  const last = [...sessions].reverse().find(s => s.logoutTime);
  if (last?.logoutTime) return fmtTime(last.logoutTime);
  const dateStr = r.date?.slice(0, 10) ?? '';
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr && dateStr < today && sessions.length > 0) return '06:30 PM (auto)';
  return '—';
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { pill: string }> = {
  Present: { pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  Absent: { pill: 'bg-red-50 text-red-700 border-red-200' },
  'Half Day': { pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  Late: { pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  'On Leave': { pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  Holiday: { pill: 'bg-red-50 text-red-600 border-red-200' },
  'Week Off': { pill: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const DAY_COLORS: Record<string, string> = {
  Monday: 'bg-blue-50 text-blue-600 border-blue-100',
  Tuesday: 'bg-purple-50 text-purple-600 border-purple-100',
  Wednesday: 'bg-teal-50 text-teal-600 border-teal-100',
  Thursday: 'bg-amber-50 text-amber-600 border-amber-100',
  Friday: 'bg-green-50 text-green-600 border-green-100',
  Saturday: 'bg-red-50 text-red-500 border-red-100',
  Sunday: 'bg-red-50 text-red-500 border-red-100',
};

// ─── WeekOffCard ───────────────────────────────────────────────────────────────
function WeekOffCard({ weekOffDays, deptName }: { weekOffDays: string[]; deptName: string }) {
  if (!weekOffDays.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
          <CalendarOff size={14} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            {deptName ? `${deptName} — ` : ''}Week Off Days
          </h3>
          <p className="text-xs text-slate-400">Regular weekly offs for your department</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {weekOffDays.map(day => (
          <span
            key={day}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border
              ${DAY_COLORS[day] ?? 'bg-slate-50 text-slate-600 border-slate-100'}`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Calendar ──────────────────────────────────────────────────────────────────
const DAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalendarProps {
  records: AttendanceRecord[];
  weekOffDays: string[];
  holidays: { id: string; name: string; date: string }[];
  leaveDates: Set<string>;
  onSelectDate: (date: string) => void;
}

function AttendanceCalendar({ records, weekOffDays, holidays, leaveDates, onSelectDate }: CalendarProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = now.toISOString().slice(0, 10);

  const dateStatusMap: Record<string, string> = {};
  records.forEach(r => { dateStatusMap[r.date?.slice(0, 10)] = r.status; });
  const holidayDateSet = new Set(holidays.map(h => h.date?.slice(0, 10)));

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  function getMarker(dateStr: string) {
    const attStatus = dateStatusMap[dateStr];
    const isHoliday = holidayDateSet.has(dateStr);
    const isLeave = leaveDates.has(dateStr);
    if (attStatus) {
      if (attStatus === 'Present') return { label: 'P', bgClass: 'bg-blue-500', textClass: 'text-white' };
      if (attStatus === 'Absent') return { label: 'A', bgClass: 'bg-red-500', textClass: 'text-white' };
      if (attStatus === 'Half Day') return { label: 'H', bgClass: 'bg-amber-400', textClass: 'text-white' };
      if (attStatus === 'Late') return { label: 'L', bgClass: 'bg-amber-400', textClass: 'text-white' };
      if (attStatus === 'On Leave') return { label: 'L', bgClass: 'bg-blue-500', textClass: 'text-white' };
      if (attStatus === 'Holiday') return { label: 'HLD', bgClass: 'bg-red-500', textClass: 'text-white' };
      if (attStatus === 'Week Off') return null;
    }
    if (isLeave) return { label: 'L', bgClass: 'bg-blue-500', textClass: 'text-white' };
    if (isHoliday) return { label: 'HLD', bgClass: 'bg-red-500', textClass: 'text-white' };
    return null;
  }

  return (
    <Card padding={false}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Attendance Calendar</h3>
          <p className="text-xs text-slate-400">{monthName} {viewYear}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs transition-colors">‹</button>
          <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs transition-colors">›</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
        {[
          { label: 'P', bg: 'bg-blue-500', text: 'text-white', name: 'Present' },
          { label: 'A', bg: 'bg-red-500', text: 'text-white', name: 'Absent' },
          { label: 'HLD', bg: 'bg-red-500', text: 'text-white', name: 'Holiday' },
          { label: 'H', bg: 'bg-amber-400', text: 'text-white', name: 'Half Day' },
          { label: 'L', bg: 'bg-blue-500', text: 'text-white', name: 'On Leave' },
        ].map(({ label, bg, text, name }) => (
          <div key={name} className="flex items-center gap-1">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${bg} ${text}`}>{label}</span>
            <span className="text-[10px] text-slate-400">{name}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 px-3 pt-1">
        {DAYS_HEADER.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 pb-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const marker = getMarker(dateStr);
          const isToday = dateStr === todayStr;
          return (
            <div
              key={day}
              onClick={() => onSelectDate(dateStr)}
              className={`rounded-md p-0.5 flex flex-col items-center gap-0.5 min-h-[40px] border cursor-pointer
                transition-all hover:bg-slate-50
                ${isToday ? 'border-blue-900 bg-blue-50' : 'border-transparent'}`}
            >
              <span className={`text-[10px] font-medium ${isToday ? 'text-blue-900 font-bold' : 'text-slate-500'}`}>{day}</span>
              {marker && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${marker.bgClass} ${marker.textClass}`}>
                  {marker.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── BreaksToggle ──────────────────────────────────────────────────────────────
function BreaksToggle({ record }: { record: AttendanceRecord }) {
  const [open, setOpen] = useState(false);
  const breaks = record.breaks ?? [];
  if (!breaks.length) return <span className="text-xs text-slate-300">No breaks</span>;
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="text-xs text-blue-700 font-semibold hover:underline">
        {open ? '▲ Hide' : `▼ ${breaks.length} break${breaks.length > 1 ? 's' : ''}`}
      </button>
      {open && (
        <div className="mt-2 bg-slate-50 rounded-lg p-3 border border-slate-100 shadow-sm min-w-[260px]">
          <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-slate-400 border-b border-slate-200 pb-1 mb-2 uppercase">
            <span>#</span><span>Start</span><span>End</span><span>Duration</span>
          </div>
          {breaks.map((b, i) => (
            <div key={b._id} className="grid grid-cols-4 gap-2 text-xs text-slate-700 py-0.5">
              <span className="font-semibold">{i + 1}</span>
              <span>{fmtTimeFull(b.start)}</span>
              <span>{b.end ? fmtTimeFull(b.end) : <span className="text-amber-500 font-medium">Active</span>}</span>
              <span className="text-slate-500">{fmtDuration(b.start, b.end)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── IdleToggle — reads embedded r.idles[] directly ───────────────────────────
// The attendance record already contains idles[] with { _id, start, end, reason }
// No separate API call needed — simpler and always in sync.
function IdleToggle({ idles }: { idles: AttendanceIdle[] }) {
  const [open, setOpen] = useState(false);

  if (!idles.length) {
    return <span className="text-xs text-slate-300">No idle</span>;
  }

  // Total idle seconds across all sessions for this record
  const totalSecs = idles.reduce((sum, s) => {
    const end = s.end ? new Date(s.end).getTime() : Date.now();
    return sum + Math.max(0, Math.floor((end - new Date(s.start).getTime()) / 1000));
  }, 0);
  const totalMins = Math.floor(totalSecs / 60);
  const totalLabel = totalMins > 0 ? `${totalMins}m` : `${totalSecs}s`;

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-amber-600 font-semibold hover:underline flex items-center gap-1"
      >
        <Moon size={10} />
        {open ? '▲ Hide' : `▼ ${idles.length} session${idles.length > 1 ? 's' : ''} · ${totalLabel}`}
      </button>
      {open && (
        <div className="mt-2 bg-amber-50/60 rounded-lg p-3 border border-amber-100 shadow-sm min-w-[300px]">
          <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-slate-400 border-b border-amber-200 pb-1 mb-2 uppercase">
            <span>#</span><span>Start</span><span>End</span><span>Reason</span>
          </div>
          {idles.map((s, i) => (
            <div key={s._id ?? i} className="grid grid-cols-4 gap-2 text-xs text-slate-700 py-0.5 items-start">
              <span className="font-semibold text-amber-600">{i + 1}</span>
              <span>{fmtTimeFull(s.start)}</span>
              <span>
                {s.end
                  ? fmtTimeFull(s.end)
                  : <span className="text-amber-500 font-medium">Active</span>}
              </span>
              <span className="text-slate-500 truncate" title={s.reason ?? ''}>
                {s.reason || <span className="text-slate-300 italic">—</span>}
              </span>
            </div>
          ))}
          <div className="mt-2 pt-1.5 border-t border-amber-200 text-[11px] font-semibold text-amber-700">
            Total idle: {totalLabel}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AttRow ────────────────────────────────────────────────────────────────────
function AttRow({ r }: { r: AttendanceRecord }) {
  const checkIn = getCheckIn(r);
  const checkOut = getCheckOut(r);
  const status = r.status;
  const cfg = STATUS_CONFIG[status];
  const workH = calcWorkHours(r);
  const extraH = workH - 8;
  const pct = Math.min(Math.round((workH / 8) * 100), 100);
  const isToday = r.date?.slice(0, 10) === new Date().toISOString().slice(0, 10);

  const breaks = r.breaks ?? [];
  const totalBreakMs = breaks.reduce((sum, b) => {
    if (b.start && b.end)
      return sum + (new Date(b.end).getTime() - new Date(b.start).getTime());
    return sum;
  }, 0);
  const breakH = totalBreakMs / (1000 * 60 * 60);

  // Read idles directly from the attendance record
  const idles: AttendanceIdle[] = (r as any).idles ?? [];

  return (
    <tr className="hover:bg-slate-50/60 transition-colors border-b border-slate-50">
      <td className="px-4 py-3 font-mono text-sm text-slate-700">{r.date?.slice(0, 10) ?? ''}</td>
      <td className="px-4 py-3">
        <span className={`text-sm font-semibold ${status === 'Absent' ? 'text-red-500' : 'text-slate-700'}`}>
          {checkIn}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-slate-500">
          {checkOut === '—'
            ? isToday
              ? <span className="text-xs text-amber-500 italic">Still clocked in</span>
              : '—'
            : checkOut}
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{fmtHours(workH)}</td>
      <td className="px-4 py-3">
        {breakH > 0
          ? <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">{fmtHours(breakH)}</span>
          : <span className="text-slate-300 text-xs">—</span>}
      </td>
      <td className="px-4 py-3">
        {extraH > 0
          ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{fmtExtra(workH)}</span>
          : <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3">
        {cfg
          ? <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cfg.pill}`}>{status}</span>
          : <span className="text-xs text-slate-400">{status}</span>}
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
      <td className="px-4 py-3"><BreaksToggle record={r} /></td>
      <td className="px-4 py-3"><IdleToggle idles={idles} /></td>
    </tr>
  );
}

// ─── AttTable ──────────────────────────────────────────────────────────────────
function AttTable({ records }: { records: AttendanceRecord[] }) {
  const cols = [
    'Date', 'Check In', 'Check Out', 'Hours', 'Break Time',
    'Extra Hrs', 'Status', 'Completion', 'Breaks', 'Idle Time',
  ];
  return (
    <div className="mobile-scroll-container pb-2">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {cols.map(c => (
              <th
                key={c}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap
                  ${c === 'Idle Time' ? 'text-amber-500' : 'text-slate-400'}`}
              >
                {c === 'Idle Time' && <Moon size={10} className="inline mr-1" />}
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={cols.length} className="text-center py-12 text-slate-400">
                <div className="text-3xl mb-2">📅</div>
                No attendance records found
              </td>
            </tr>
          ) : (
            records.map(r => <AttRow key={r._id} r={r} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-2 p-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
    </div>
  );
}

function expandLeaveDates(leaves: Record<string, unknown>[]): Set<string> {
  const dates = new Set<string>();
  leaves.forEach(l => {
    if (!l.startDate || !l.endDate) return;
    const s = ((l.status as string) ?? '').toLowerCase();
    if (s !== 'approved' && s !== 'pending') return;
    const start = new Date(l.startDate as string);
    const end = new Date(l.endDate as string);
    const cur = new Date(start);
    while (cur <= end) {
      dates.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  });
  return dates;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyAttendance() {
  const { user } = useAuth();
  const userId: string =
    (user as unknown as Record<string, unknown>)?._id as string ??
    (user as unknown as Record<string, unknown>)?.id as string ??
    '';

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [weekOffDays, setWeekOffDays] = useState<string[]>([]);
  const [deptName, setDeptName] = useState('');
  const [holidays, setHolidays] = useState<{ id: string; name: string; date: string }[]>([]);
  const [leaveDates, setLeaveDates] = useState<Set<string>>(new Set());

  // ── Fetch attendance ───────────────────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (!userId) return;
    setLoading(true); setError('');
    try {
      const data = await getAttendanceByEmpIdApi(userId);
      setRecords([...data].sort((a, b) => b.date.localeCompare(a.date)));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  // ── Department week-off days ───────────────────────────────────────────────
  useEffect(() => {
    if (!user?.department) return;
    getDepartmentById(user.department)
      .then((res: { success: boolean; department?: { departmentName?: string; weekOffDays?: string | string[] } }) => {
        if (res.success && res.department) {
          setDeptName(res.department.departmentName ?? '');
          const days = Array.isArray(res.department.weekOffDays)
            ? res.department.weekOffDays
            : typeof res.department.weekOffDays === 'string' && res.department.weekOffDays
              ? [res.department.weekOffDays]
              : [];
          setWeekOffDays(days);
        }
      })
      .catch(() => { });
  }, [user?.department]);

  // ── Holidays ───────────────────────────────────────────────────────────────
  useEffect(() => {
    getHolidaysApi().then(setHolidays).catch(() => { });
  }, []);

  // ── Leave dates ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    getLeaves()
      .then((all: unknown[]) => {
        const mine = (all as Record<string, unknown>[]).filter(l =>
          l.userId === userId ||
          l.empNumber === (user as unknown as Record<string, unknown>)?.empNumber ||
          l.empNumber === (user as unknown as Record<string, unknown>)?.empId,
        );
        setLeaveDates(expandLeaveDates(mine));
      })
      .catch(() => { });
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  };

  const selectedRecords = selectedDate
    ? records.filter(r => r.date?.slice(0, 10) === selectedDate)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="My Attendance" subtitle="Your attendance history from the server" />
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <WeekOffCard weekOffDays={weekOffDays} deptName={deptName} />

      {!loading && (
        <AttendanceCalendar
          records={records}
          weekOffDays={weekOffDays}
          holidays={holidays}
          leaveDates={leaveDates}
          onSelectDate={setSelectedDate}
        />
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
        <span className="text-base leading-none">ℹ️</span>
        <div>
          <p className="font-semibold mb-0.5">How attendance status works</p>
          <p>
            Logging in <strong>after 9:40 AM</strong> marks you <strong>Absent</strong>.
            At <strong>6:30 PM</strong> the system auto-logs you out and recalculates:
            ≥7 hrs → <strong>Present</strong> · 4–7 hrs → <strong>Half Day</strong> · &lt;4 hrs → <strong>Absent</strong>.
            Extra hours are counted beyond 8 hrs.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {selectedDate && (
        <Card padding={false}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Attendance for {selectedDate}</h3>
            <button onClick={() => setSelectedDate(null)} className="text-xs text-slate-400 hover:text-slate-600">✕ Clear</button>
          </div>
          {selectedRecords.length === 0
            ? <p className="text-center py-8 text-sm text-slate-400">No records for this date</p>
            : <AttTable records={selectedRecords} />}
        </Card>
      )}

      <Card padding={false}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-slate-800">Attendance History</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {records.length} record{records.length !== 1 ? 's' : ''} · fetched from /getAttendanceByemployee
            </p>
          </div>
        </div>
        {loading ? <Skeleton /> : <AttTable records={records} />}
      </Card>
    </div>
  );
}