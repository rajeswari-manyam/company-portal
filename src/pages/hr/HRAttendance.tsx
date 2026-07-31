// src/pages/hr/HRAttendance.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  RefreshCw, Search, Calendar, Clock, ChevronDown, ChevronUp,
  Edit2, Trash2, Users, ChevronLeft, ChevronRight,
  BarChart3, TableProperties, TrendingUp, Coffee, Moon,
} from 'lucide-react';
import { PageHeader } from '../../components/common';
import { Card } from '../../components/ui';
import {
  hrUpdateAttendanceApi,
  deleteAttendanceByIdApi,
  getAttendanceByEmpIdApi,
  type AttendanceRecord,
} from '../../service/Attendance.service';
import {
  getIdleLogsApi,
  updateActivityApi,
  type IdleSession,
} from "../../service/IdleApi.service";
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusOption = AttendanceRecord['status'];
type ActiveTab = 'daily' | 'monthly';

const STATUS_OPTIONS: StatusOption[] = ['Present', 'Late', 'Half Day', 'Absent', 'On Leave'];

const STATUS_STYLES: Record<string, { pill: string; dot: string; bg: string; label: string; short: string }> = {
  Present: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', bg: 'bg-emerald-100', label: 'Present', short: 'P' },
  Late: { pill: 'bg-amber-50  text-amber-700  border-amber-200', dot: 'bg-amber-500', bg: 'bg-amber-100', label: 'Late', short: 'L' },
  'Half Day': { pill: 'bg-blue-50   text-blue-700   border-blue-200', dot: 'bg-blue-500', bg: 'bg-blue-100', label: 'Half Day', short: 'H' },
  Absent: { pill: 'bg-red-50    text-red-700    border-red-200', dot: 'bg-red-500', bg: 'bg-red-100', label: 'Absent', short: 'A' },
  'On Leave': { pill: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', bg: 'bg-purple-100', label: 'On Leave', short: 'OL' },
};

interface NormRow {
  _id: string;
  employeeId: string;
  employeeInternalId: string;
  employeeName: string;
  employeeEmail: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number;
  breakHours: number;
  overtimeHours: number;
  status: StatusOption;
  breaks: AttendanceRecord['breaks'];
  sessions: AttendanceRecord['sessions'];
}

interface MonthlySummaryRow {
  employeeId: string;
  employeeName: string;
  present: number; late: number; halfDay: number; absent: number; onLeave: number;
  totalDays: number; totalWorkHours: number; totalBreakHours: number;
  totalExtraHours: number; attendanceRate: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtHours(h: number) {
  if (!h) return '—';
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return hh > 0 ? `${hh}h ${mm}m` : `${mm}m`;
}
function fmtExtra(h: number): string {
  const extra = h - 8;
  if (extra <= 0) return '—';
  const hh = Math.floor(extra), mm = Math.round((extra - hh) * 60);
  return `+${hh > 0 ? `${hh}h ` : ''}${mm}m`;
}
function fmtDuration(startIso: string, endIso?: string) {
  if (!endIso) return 'Active';
  const diff = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
  const m = Math.floor(diff / 60), s = diff % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function getInitials(name: string) {
  return (name || 'UN').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700', 'bg-cyan-100 text-cyan-700',
];
function avatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}
function calcBreakHours(breaks: AttendanceRecord['breaks']): number {
  return (breaks ?? []).reduce((sum, b) => {
    if (b.start && b.end) return sum + (new Date(b.end).getTime() - new Date(b.start).getTime()) / (1000 * 60 * 60);
    return sum;
  }, 0);
}

function sumIdleSecondsToday(sessions: IdleSession[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return sessions
    .filter(s => s.startTime?.slice(0, 10) === today)
    .reduce((sum, s) => {
      if (!s.startTime) return sum;
      const end = s.endTime ? new Date(s.endTime).getTime() : Date.now();
      return sum + Math.max(0, Math.floor((end - new Date(s.startTime).getTime()) / 1000));
    }, 0);
}

function filterIdleSessionsToday(sessions: IdleSession[]): IdleSession[] {
  const today = new Date().toISOString().slice(0, 10);
  return sessions.filter(s => s.startTime?.slice(0, 10) === today);
}

function fmtIdleSecs(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtIdleDuration(startIso: string, endIso?: string): string {
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diff = Math.max(0, Math.floor((end - new Date(startIso).getTime()) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function normalise(raw: AttendanceRecord): NormRow {
  const empObj = raw.employeeId && typeof raw.employeeId === 'object' ? raw.employeeId as any : null;
  const empName: string = empObj?.name ?? (raw as any).employeeName ?? '';
  const empDisplayId: string = empObj?.empId ?? empObj?.empNumber ?? (raw as any).empId ?? '';
  const empInternalId: string = empObj?._id ?? (typeof raw.employeeId === 'string' ? raw.employeeId : '');
  const empEmail: string = empObj?.email ?? (raw as any).email ?? '';
  const sessions = raw.sessions ?? [];
  const sorted = [...sessions].sort((a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime());
  const lastLogout = raw.lastLogout ?? [...sessions].reverse().find(s => s.logoutTime)?.logoutTime ?? null;
  return {
    _id: raw._id,
    employeeId: empDisplayId || empInternalId,
    employeeInternalId: empInternalId,
    employeeName: empName,
    employeeEmail: empEmail,
    date: raw.date ? new Date(raw.date).toLocaleDateString('en-CA') : raw.date,
    checkIn: sorted[0]?.loginTime ? fmtTime(sorted[0].loginTime) : null,
    checkOut: lastLogout ? fmtTime(lastLogout) : null,
    workHours: raw.totalWorkHours ?? 0,
    breakHours: calcBreakHours(raw.breaks),
    overtimeHours: raw.overtimeHours ?? 0,
    status: raw.status,
    breaks: raw.breaks ?? [],
    sessions,
  };
}

// ─── Idle Cell ────────────────────────────────────────────────────────────────

function IdleCell({ sessions, totalSecs }: { sessions: IdleSession[]; totalSecs: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!totalSecs) return <span className="text-slate-300 text-xs">—</span>;

  const todaySessions = filterIdleSessionsToday(sessions);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 transition-colors"
      >
        <Moon size={10} />
        {fmtIdleSecs(totalSecs)}
        {todaySessions.length > 0 && (open ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
      </button>

      {open && todaySessions.length > 0 && (
        <div className="absolute left-0 top-8 z-30 bg-white rounded-xl shadow-xl border border-slate-100 p-3 min-w-[320px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Idle Sessions — {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1 mb-1">
            <span>#</span><span>Start</span><span>End</span><span>Duration</span>
          </div>
          {todaySessions.map((s, i) => (
            <div key={s._id ?? i} className="grid grid-cols-4 text-xs text-slate-700 py-1.5 border-b border-slate-50 last:border-0 items-center">
              <span className="text-slate-400 font-semibold">{i + 1}</span>
              <span className="font-medium">{fmtTime(s.startTime)}</span>
              <span>
                {s.endTime
                  ? <span className="font-medium">{fmtTime(s.endTime)}</span>
                  : <span className="text-amber-500 font-semibold">Active</span>}
              </span>
              <span className="text-slate-500">{fmtIdleDuration(s.startTime, s.endTime)}</span>
            </div>
          ))}
          {todaySessions.some(s => s.reason) && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reasons</p>
              {todaySessions.filter(s => s.reason).map((s, i) => (
                <div key={s._id ?? i} className="flex items-start gap-2 text-xs">
                  <span className="text-slate-400 font-semibold shrink-0 mt-0.5">
                    #{todaySessions.indexOf(s) + 1}
                  </span>
                  <span className="text-slate-600 italic">"{s.reason}"</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function RateBar({ rate, color = 'bg-emerald-500' }: { rate: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-10 text-right">{rate}%</span>
    </div>
  );
}

function BreaksInline({ breaks }: { breaks: AttendanceRecord['breaks'] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!breaks?.length) return <span className="text-xs text-slate-300">No breaks</span>;
  return (
    <div ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors">
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {breaks.length} break{breaks.length !== 1 ? 's' : ''}
      </button>
      {open && (
        <div className="mt-2 bg-white rounded-xl p-3 border border-violet-100 shadow-lg min-w-[260px] z-10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Break Details</p>
          <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1 mb-1">
            <span>#</span><span>Start</span><span>End</span><span>Duration</span>
          </div>
          {breaks.map((b, i) => (
            <div key={b._id ?? i} className="grid grid-cols-4 text-xs text-slate-700 py-1">
              <span className="text-slate-400 font-semibold">{i + 1}</span>
              <span>{fmtTime(b.start)}</span>
              <span>{b.end ? fmtTime(b.end) : <span className="text-amber-500 font-semibold">Active</span>}</span>
              <span className="text-slate-500">{fmtDuration(b.start, b.end)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditModal({ row, onClose, onSaved }: { row: NormRow; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState<StatusOption>(row.status);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await hrUpdateAttendanceApi({ attendanceId: row._id, status }); toast.success('Attendance updated'); onSaved(); onClose(); }
    catch (e: any) { toast.error(e?.message ?? 'Failed to update'); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 text-lg">✕</button>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(row.employeeName)}`}>{getInitials(row.employeeName)}</div>
          <div><h3 className="text-base font-bold text-slate-800">{row.employeeName}</h3><p className="text-xs text-slate-400">{row.date}</p></div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as StatusOption)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/30 bg-white">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#3B46D4] text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({ row, onClose, onDeleted }: { row: NormRow; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    try { await deleteAttendanceByIdApi(row._id); toast.success('Record deleted'); onDeleted(); onClose(); }
    finally { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 text-lg">✕</button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><Trash2 size={18} /></div>
          <div><h3 className="text-base font-bold text-slate-800">Delete Record?</h3><p className="text-xs text-slate-400">This action cannot be undone.</p></div>
        </div>
        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          Deleting attendance for <span className="font-semibold">{row.employeeName}</span> on <span className="font-semibold">{row.date}</span>.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={confirm} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>{[1, 2, 3, 4].map(i => (
      <tr key={i} className="border-b border-slate-50">
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} className="px-4 py-4"><div className="h-4 rounded-lg bg-slate-100 animate-pulse" style={{ width: `${40 + (j * 13) % 40}%` }} /></td>
        ))}
      </tr>
    ))}</>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function AttendanceCalendar({ allRows, selectedEmp }: { allRows: NormRow[]; selectedEmp: string }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });
  const dateStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    const rows = selectedEmp ? allRows.filter(r => r.employeeId === selectedEmp || r.employeeName === selectedEmp) : allRows;
    rows.forEach(r => { if (r.date) map[r.date] = r.status; });
    return map;
  }, [allRows, selectedEmp]);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = now.toISOString().slice(0, 10);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Attendance Calendar</h3>
          <p className="text-xs text-slate-400 mt-0.5">{selectedEmp ? 'Filtered employee' : 'All employees'} · {monthName} {viewYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"><ChevronLeft size={14} /></button>
          <span className="text-sm font-semibold text-slate-700 min-w-[110px] text-center">{monthName} {viewYear}</span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {days.map((d, i) => <div key={d} className={`text-center text-[11px] font-bold pb-2 ${i >= 5 ? 'text-slate-300' : 'text-slate-400'}`}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const status = dateStatusMap[dateStr];
            const cfg = status ? STATUS_STYLES[status] : null;
            const isToday = dateStr === todayStr;
            const isWeekend = [0, 6].includes(new Date(viewYear, viewMonth, day).getDay());
            return (
              <div key={day} className={`rounded-xl flex flex-col items-center justify-center min-h-[44px] gap-0.5 transition-all cursor-default
                ${isToday ? 'ring-2 ring-[#0B0E92] ring-offset-1 bg-[#EEF0FF]' : ''}
                ${isWeekend && !cfg ? 'opacity-30' : ''}`}>
                <span className={`text-[11px] font-semibold ${isToday ? 'text-[#0B0E92]' : 'text-slate-500'}`}>{day}</span>
                {cfg ? <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${cfg.bg}`}>{cfg.short}</span> : null}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 pt-3 border-t border-slate-100">
          {Object.values(STATUS_STYLES).map(s => (
            <div key={s.label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${s.bg}`}>{s.short}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Monthly Summary ───────────────────────────────────────────────────────────

function MonthlySummary({ allRows }: { allRows: NormRow[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof MonthlySummaryRow>('employeeName');
  const [sortAsc, setSortAsc] = useState(true);
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const summaries = useMemo<MonthlySummaryRow[]>(() => {
    const monthRows = allRows.filter(r => r.date?.startsWith(monthStr));
    const empMap = new Map<string, MonthlySummaryRow>();
    monthRows.forEach(r => {
      const key = r.employeeId || r.employeeName;
      if (!key) return;
      if (!empMap.has(key)) empMap.set(key, { employeeId: r.employeeId, employeeName: r.employeeName, present: 0, late: 0, halfDay: 0, absent: 0, onLeave: 0, totalDays: 0, totalWorkHours: 0, totalBreakHours: 0, totalExtraHours: 0, attendanceRate: 0 });
      const row = empMap.get(key)!;
      row.totalDays++; row.totalWorkHours += r.workHours ?? 0; row.totalBreakHours += r.breakHours ?? 0;
      const extra = (r.workHours ?? 0) - 8; row.totalExtraHours += extra > 0 ? extra : 0;
      if (r.status === 'Present') row.present++; else if (r.status === 'Late') row.late++;
      else if (r.status === 'Half Day') row.halfDay++; else if (r.status === 'Absent') row.absent++; else if (r.status === 'On Leave') row.onLeave++;
    });
    return [...empMap.values()].map(e => ({ ...e, attendanceRate: e.totalDays > 0 ? Math.round(((e.present + e.late + e.halfDay * 0.5) / e.totalDays) * 100) : 0 }));
  }, [allRows, monthStr]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let rows = summaries.filter(r => !q || r.employeeName.toLowerCase().includes(q));
    rows.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return rows;
  }, [summaries, search, sortKey, sortAsc]);
  const toggleSort = (key: keyof MonthlySummaryRow) => { if (sortKey === key) setSortAsc(a => !a); else { setSortKey(key); setSortAsc(true); } };
  const SortIcon = ({ col }: { col: keyof MonthlySummaryRow }) => (
    <span className="ml-1 text-[10px]">{sortKey === col ? (sortAsc ? '▲' : '▼') : <span className="text-slate-300">⇅</span>}</span>
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600"><ChevronLeft size={14} /></button>
          <span className="text-base font-bold text-slate-800 min-w-[140px] text-center">{monthName} {year}</span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600"><ChevronRight size={14} /></button>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…"
            className="pl-9 pr-3 h-9 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 w-56" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="mobile-scroll-container pb-2">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                {[{ key: 'employeeName', label: 'Employee' }, { key: 'present', label: 'Present' }, { key: 'late', label: 'Late' }, { key: 'halfDay', label: 'Half Day' }, { key: 'absent', label: 'Absent' }, { key: 'onLeave', label: 'On Leave' }, { key: 'totalWorkHours', label: 'Hrs Worked' }, { key: 'totalBreakHours', label: 'Break Hrs' }, { key: 'totalExtraHours', label: 'Extra Hrs' }, { key: 'attendanceRate', label: 'Rate' }].map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key as keyof MonthlySummaryRow)}
                    className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none whitespace-nowrap">
                    {col.label}<SortIcon col={col.key as keyof MonthlySummaryRow} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-16 text-center text-slate-400">No data for {monthName} {year}</td></tr>
              ) : filtered.map(r => {
                const rateColor = r.attendanceRate >= 80 ? 'bg-emerald-500' : r.attendanceRate >= 50 ? 'bg-amber-400' : 'bg-red-400';
                return (
                  <tr key={r.employeeId || r.employeeName} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(r.employeeName || 'UN')}`}>{getInitials(r.employeeName || 'UN')}</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{r.employeeName || 'Unknown'}</p>
                          {r.employeeId && !/^[a-f0-9]{20,}$/i.test(r.employeeId) && <p className="text-xs font-mono text-[#0B0E92]">{r.employeeId}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold">{r.present}</span></td>
                    <td className="px-4 py-4"><span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-sm font-bold">{r.late}</span></td>
                    <td className="px-4 py-4"><span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-bold">{r.halfDay}</span></td>
                    <td className="px-4 py-4"><span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-sm font-bold">{r.absent}</span></td>
                    <td className="px-4 py-4"><span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm font-bold">{r.onLeave}</span></td>
                    <td className="px-4 py-4 font-mono text-sm font-semibold text-slate-700">{fmtHours(r.totalWorkHours)}</td>
                    <td className="px-4 py-4">{r.totalBreakHours > 0 ? <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">{fmtHours(r.totalBreakHours)}</span> : <span className="text-slate-300 text-xs">—</span>}</td>
                    <td className="px-4 py-4">{r.totalExtraHours > 0 ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">+{fmtHours(r.totalExtraHours)}</span> : <span className="text-slate-300 text-xs">—</span>}</td>
                    <td className="px-4 py-4 min-w-[140px]"><RateBar rate={r.attendanceRate} color={rateColor} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HRAttendance() {
  const [allRows, setAllRows] = useState<NormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');

  const [empFilter, setEmpFilter] = useState('');
  const [empRows, setEmpRows] = useState<NormRow[] | null>(null);
  const [empLoading, setEmpLoading] = useState(false);

  // map: employeeInternalId → { secs, sessions[] }
  const [idleMap, setIdleMap] = useState<Record<string, { secs: number; sessions: IdleSession[] }>>({});

  const [search, setSearch] = useState('');
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [editRow, setEditRow] = useState<NormRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<NormRow | null>(null);

  // ── Load all attendance ─────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true); setError(null);
    axios.get(`${BASE_URL}/getAllAttendance`)
      .then(({ data }) => setAllRows((data.data ?? []).map(normalise)))
      .catch(e => setError(e?.message ?? 'Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [tick]);

  const handleRefresh = () => { setRefreshing(true); setTick(t => t + 1); setTimeout(() => setRefreshing(false), 800); };

  // ── Activity heartbeat ──────────────────────────────────────────────────────
  useEffect(() => {
    const uid = localStorage.getItem('userId') ?? sessionStorage.getItem('userId') ?? '';
    if (!uid) return;
    const interval = setInterval(() => updateActivityApi(uid).catch(() => { }), 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Employee filter: fetch per-employee attendance + idle ───────────────────
  const handleEmpFilterChange = useCallback(async (empId: string) => {
    setEmpFilter(empId);
    if (!empId) { setEmpRows(null); setIdleMap({}); return; }

    const matched = allRows.find(r => r.employeeId === empId || r.employeeName === empId);
    const internalId = matched?.employeeInternalId ?? empId;
    const mongoId = /^[a-f0-9]{24}$/i.test(internalId) ? internalId : null;

    setEmpLoading(true);
    try {
      const id = mongoId ?? empId;
      const records = await getAttendanceByEmpIdApi(id);
      setEmpRows(records.map(normalise));

      getIdleLogsApi(id)
        .then(sessions => {
          const secs = sumIdleSecondsToday(sessions);
          setIdleMap(prev => ({ ...prev, [internalId || id]: { secs, sessions } }));
        })
        .catch(() => { });
    } catch { setEmpRows(null); }
    finally { setEmpLoading(false); }
  }, [allRows]);

  const uniqueEmployees = useMemo(() => {
    const map = new Map<string, [string, string, string]>();
    allRows.forEach(r => {
      const key = r.employeeId || r.employeeName;
      if (key && !map.has(key)) map.set(key, [key, r.employeeName, r.employeeId]);
    });
    return [...map.values()].sort((a, b) => (a[1] || '').localeCompare(b[1] || ''));
  }, [allRows]);

  const sourceRows = empRows ?? allRows;

  const filtered = useMemo(() => sourceRows.filter(r => {
    const rowDate = r.date ? new Date(r.date).toLocaleDateString('en-CA') : '';
    const matchDate = !date || rowDate === date;
    const q = search.toLowerCase();
    const matchSearch = !q || r.employeeName.toLowerCase().includes(q) || r.employeeEmail.toLowerCase().includes(q) || r.status.toLowerCase().includes(q);
    return matchDate && matchSearch;
  }), [sourceRows, date, search]);

  // ── When no employee is filtered, load idle for all visible rows ─────────────
  useEffect(() => {
    if (empFilter) return;

    const seen = new Set<string>();
    const targets: { id: string; internalId: string }[] = [];
    filtered.forEach(r => {
      const key = r.employeeInternalId || r.employeeId;
      if (key && !seen.has(key)) {
        seen.add(key);
        targets.push({ id: key, internalId: r.employeeInternalId });
      }
    });

    if (!targets.length) { setIdleMap({}); return; }

    Promise.all(
      targets.map(({ id, internalId }) =>
        getIdleLogsApi(id)
          .then(sessions => ({ key: internalId || id, secs: sumIdleSecondsToday(sessions), sessions }))
          .catch(() => ({ key: internalId || id, secs: 0, sessions: [] as IdleSession[] }))
      )
    ).then(results => {
      const map: Record<string, { secs: number; sessions: IdleSession[] }> = {};
      results.forEach(({ key, secs, sessions }) => { map[key] = { secs, sessions }; });
      setIdleMap(map);
    });
  }, [filtered, empFilter]);

  const todayRows = useMemo(() => sourceRows.filter(r => r.date ? new Date(r.date).toLocaleDateString('en-CA') === date : false), [sourceRows, date]);

  const stats = useMemo(() => ({
    present: todayRows.filter(r => r.status === 'Present').length,
    late: todayRows.filter(r => r.status === 'Late').length,
    absent: todayRows.filter(r => r.status === 'Absent').length,
    halfDay: todayRows.filter(r => r.status === 'Half Day').length,
    onLeave: todayRows.filter(r => r.status === 'On Leave').length,
    extraHrs: todayRows.reduce((s, r) => s + Math.max(0, r.workHours - 8), 0),
    breakHrs: todayRows.reduce((s, r) => s + (r.breakHours ?? 0), 0),
  }), [todayRows]);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="All employees attendance overview" />

      <AttendanceCalendar allRows={empRows ?? allRows} selectedEmp={empFilter} />

      <div className="flex items-center gap-2">
        {[
          { key: 'daily', icon: <TableProperties size={14} />, label: 'Daily Records' },
          { key: 'monthly', icon: <BarChart3 size={14} />, label: 'Monthly Summary' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as ActiveTab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${activeTab === tab.key ? 'bg-gradient-to-r from-[#0B0E92] to-[#3B46D4] text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or status…"
                className="w-full pl-9 pr-3 h-10 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]" />
            </div>
            <div className="relative">
              <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={empFilter} onChange={e => handleEmpFilterChange(e.target.value)}
                className="pl-8 pr-8 h-10 rounded-xl border border-slate-200 text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20">
                <option value="">All Employees</option>
                {uniqueEmployees.map(([id, name, displayId]) => (
                  <option key={id} value={id}>{name}{displayId && !/^[a-f0-9]{20,}$/i.test(displayId) ? ` (${displayId})` : ''}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="pl-8 pr-3 h-10 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20" />
            </div>
            <button onClick={handleRefresh} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {/* Stats strip */}
          {!loading && !empLoading && (
            <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-wrap gap-x-5 gap-y-2 text-xs">
              {[
                { label: 'Present', count: stats.present, dot: 'bg-emerald-500', text: 'text-emerald-700' },
                { label: 'Late', count: stats.late, dot: 'bg-amber-500', text: 'text-amber-700' },
                { label: 'Absent', count: stats.absent, dot: 'bg-red-500', text: 'text-red-600' },
                { label: 'Half Day', count: stats.halfDay, dot: 'bg-blue-500', text: 'text-blue-700' },
                { label: 'On Leave', count: stats.onLeave, dot: 'bg-purple-500', text: 'text-purple-700' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} /><span className={`font-bold ${s.text}`}>{s.count}</span><span className="text-slate-400">{s.label}</span>
                </div>
              ))}
              {stats.breakHrs > 0 && (
                <div className="flex items-center gap-1.5">
                  <Coffee size={11} className="text-orange-400" />
                  <span className="font-bold text-orange-600">{fmtHours(stats.breakHrs)}</span>
                  <span className="text-slate-400">total break</span>
                </div>
              )}
              {stats.extraHrs > 0 && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <TrendingUp size={11} className="text-emerald-500" />
                  <span className="font-bold text-emerald-600">+{fmtHours(stats.extraHrs)}</span>
                  <span className="text-slate-400">extra hrs today</span>
                </div>
              )}
            </div>
          )}

          {!loading && !empLoading && (
            <div className="px-5 py-2 text-xs text-slate-500 border-b border-slate-100">
              <span className="font-semibold text-slate-700">{filtered.length}</span> record{filtered.length !== 1 ? 's' : ''} · {new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          )}

          {error && <div className="mx-5 my-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

          {/* Table */}
          <div className="mobile-scroll-container pb-2">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100">
                  {['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Break Time', 'Extra Hrs', 'Idle', 'Breaks', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(loading || empLoading) ? <SkeletonRows cols={11} /> :
                  filtered.length === 0 ? (
                    <tr><td colSpan={11} className="py-16 text-center text-slate-400"><div className="text-4xl mb-3">📋</div><p className="text-sm font-medium">No attendance records found</p><p className="text-xs text-slate-300 mt-1">Try a different date or employee</p></td></tr>
                  ) : filtered.map(r => {
                    const idleEntry = idleMap[r.employeeInternalId] ?? idleMap[r.employeeId] ?? null;

                    return (
                      <tr key={r._id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(r.employeeName || 'UN')}`}>{getInitials(r.employeeName || 'UN')}</div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 leading-tight">{r.employeeName || <span className="text-slate-400 italic">Unknown</span>}</p>
                              {r.employeeId && !/^[a-f0-9]{20,}$/i.test(r.employeeId) && <p className="text-xs font-mono text-[#0B0E92] font-semibold">{r.employeeId}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-sm text-slate-600">{r.date}</td>
                        <td className="px-4 py-4">
                          {r.checkIn ? <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-semibold"><Clock size={12} className="text-emerald-500" />{r.checkIn}</div> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          {r.checkOut ? <div className="flex items-center gap-1.5 text-sm text-slate-700 font-semibold"><Clock size={12} className="text-slate-400" />{r.checkOut}</div> : <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">Active</span>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${r.workHours >= 8 ? 'bg-emerald-500' : r.workHours >= 4 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${Math.min((r.workHours / 8) * 100, 100)}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 font-mono">{fmtHours(r.workHours)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {r.breakHours > 0 ? <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">{fmtHours(r.breakHours)}</span> : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          {r.workHours > 8 ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{fmtExtra(r.workHours)}</span> : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        {/* IDLE — clickable dropdown */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <IdleCell
                            sessions={idleEntry?.sessions ?? []}
                            totalSecs={idleEntry?.secs ?? 0}
                          />
                        </td>
                        <td className="px-4 py-4"><BreaksInline breaks={r.breaks} /></td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[r.status]?.pill ?? STATUS_STYLES['Absent'].pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[r.status]?.dot ?? 'bg-red-500'}`} />
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditRow(r)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => setDeleteRow(r)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50  text-slate-400 hover:text-red-600  transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {!loading && !empLoading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-400">
              Showing {filtered.length} of {sourceRows.length} total records
            </div>
          )}
        </div>
      )}

      {activeTab === 'monthly' && <MonthlySummary allRows={empRows ?? allRows} />}

      {editRow && <EditModal row={editRow} onClose={() => setEditRow(null)} onSaved={handleRefresh} />}
      {deleteRow && <DeleteConfirm row={deleteRow} onClose={() => setDeleteRow(null)} onDeleted={handleRefresh} />}
    </div>
  );
}

export function AdminAttendanceFromHR() { return <HRAttendance />; }