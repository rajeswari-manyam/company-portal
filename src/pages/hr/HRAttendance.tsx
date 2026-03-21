// src/pages/hr/HRAttendance.tsx
// HR Attendance — same look/feel as MyAttendance but shows ALL employees.
// Includes: calendar heat-map, stat cards, employee filter, table with breaks.

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, Search, Calendar, Clock, ChevronDown, ChevronUp, Edit2, Trash2, Users, CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { PageHeader } from '../../components/common';
import { Card, Badge } from '../../components/ui';
import {
  hrUpdateAttendanceApi,
  deleteAttendanceByIdApi,
} from '../../services/Attendance.service';
import type { AttendanceRecord } from '../../services/Attendance.service';
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL;

/* ── Types ─────────────────────────────────────────────────── */

type StatusOption = AttendanceRecord['status'];

const STATUS_OPTIONS: StatusOption[] = ['Present', 'Late', 'Half Day', 'Absent', 'On Leave'];

const STATUS_STYLES: Record<string, { pill: string; dot: string; bg: string; label: string; short: string }> = {
  Present: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', bg: 'bg-emerald-100', label: 'Present', short: 'P' },
  Late: { pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', bg: 'bg-amber-100', label: 'Late', short: 'L' },
  'Half Day': { pill: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', bg: 'bg-blue-100', label: 'Half Day', short: 'H' },
  Absent: { pill: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', bg: 'bg-red-100', label: 'Absent', short: 'A' },
  'On Leave': { pill: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', bg: 'bg-purple-100', label: 'On Leave', short: 'OL' },
};

interface NormRow {
  _id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number;
  status: StatusOption;
  breaks: AttendanceRecord['breaks'];
  sessions: AttendanceRecord['sessions'];
}

/* ── Helpers ───────────────────────────────────────────────── */

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtHours(h: number) {
  if (!h) return '—';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return hh > 0 ? `${hh}h ${mm}m` : `${mm}m`;
}

function fmtDuration(startIso: string, endIso?: string) {
  if (!endIso) return 'Active';
  const diff = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700', 'bg-cyan-100 text-cyan-700',
];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function normalise(raw: AttendanceRecord): NormRow {
  // The API may populate employeeId as a full object or leave it as a string ID.
  // Handle every possible shape the backend might return.
  const empObj = raw.employeeId && typeof raw.employeeId === 'object' ? raw.employeeId as any : null;

  // Extract name — try every common field name
  const empName: string =
    empObj?.name ??
    empObj?.employeeName ??
    empObj?.fullName ??
    (empObj?.firstName ? `${empObj.firstName} ${empObj.lastName ?? ''}`.trim() : null) ??
    (raw as any).employeeName ??
    (raw as any).name ??
    '';

  // Extract display ID — try every common field name
  const empDisplayId: string =
    empObj?.empId ??
    empObj?.employeeId ??
    empObj?.empNumber ??
    empObj?.employeeCode ??
    (raw as any).empId ??
    (raw as any).empNumber ??
    '';

  // Extract internal _id
  const empInternalId: string =
    empObj?._id ??
    empObj?.id ??
    (typeof raw.employeeId === 'string' ? raw.employeeId : '') ??
    '';

  const empEmail: string =
    empObj?.email ??
    empObj?.emailId ??
    (raw as any).email ??
    '';

  const sessions = raw.sessions ?? [];
  const sorted = [...sessions].sort((a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime());
  const lastLogout = raw.lastLogout ?? [...sessions].reverse().find(s => s.logoutTime)?.logoutTime ?? null;

  return {
    _id: raw._id,
    employeeId: empDisplayId || empInternalId,   // prefer display ID like "EMP001"
    employeeName: empName,
    employeeEmail: empEmail,
    date: raw.date ? new Date(raw.date).toLocaleDateString('en-CA') : raw.date,
    checkIn: sorted[0]?.loginTime ? fmtTime(sorted[0].loginTime) : null,
    checkOut: lastLogout ? fmtTime(lastLogout) : null,
    workHours: raw.totalWorkHours,
    status: raw.status,
    breaks: raw.breaks ?? [],
    sessions,
  };
}

/* ── Calendar (same as employee but shows all emp data for selected emp) ── */

interface CalendarProps {
  allRows: NormRow[];
  selectedEmp: string;
}

function AttendanceCalendar({ allRows, selectedEmp }: CalendarProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });

  // Build date→status map for selected employee (or all if none selected)
  const dateStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    const rows = selectedEmp
      ? allRows.filter(r => r.employeeId === selectedEmp || r.employeeName === selectedEmp)
      : allRows;
    // r.date is already normalised to YYYY-MM-DD by normalise()
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
    <Card padding={false}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Attendance Calendar</h3>
          <p className="text-xs text-slate-400">
            {monthName} {viewYear} · {selectedEmp ? 'selected employee' : 'all employees (latest status per day)'}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs">‹</button>
          <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 px-3 pt-2">
        {days.map(d => <div key={d} className="text-center text-[10px] font-semibold text-slate-400 pb-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = dateStatusMap[dateStr];
          const cfg = status ? STATUS_STYLES[status] : null;
          const isToday = dateStr === todayStr;
          const isWeekend = [0, 6].includes(new Date(viewYear, viewMonth, day).getDay());
          return (
            <div key={day} className={`rounded-md p-0.5 flex flex-col items-center gap-0.5 min-h-[36px] border transition-all
              ${isToday ? 'border-blue-900 bg-blue-50' : 'border-transparent'}
              ${isWeekend && !status ? 'opacity-40' : ''}`}>
              <span className={`text-[10px] font-medium ${isToday ? 'text-blue-900 font-bold' : 'text-slate-500'}`}>{day}</span>
              {cfg && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${cfg.bg} ${cfg.dot.replace('bg-', 'text-').replace('500', '700')}`}>
                  {cfg.short}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 pb-3">
        {Object.values(STATUS_STYLES).map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${s.bg} ${s.dot.replace('bg-', 'text-').replace('500', '700')}`}>{s.short}</span>
            {s.label}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Breaks inline toggle ──────────────────────────────────── */

function BreaksInline({ breaks }: { breaks: AttendanceRecord['breaks'] }) {
  const [open, setOpen] = useState(false);
  if (!breaks?.length) return <span className="text-xs text-slate-300">—</span>;
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {breaks.length} break{breaks.length !== 1 ? 's' : ''}
      </button>
      {open && (
        <div className="mt-2 bg-slate-50 rounded-xl p-3 border border-slate-100 min-w-[260px] z-10 shadow-sm">
          <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 border-b border-slate-200 pb-1 mb-1 uppercase">
            <span>#</span><span>Start</span><span>End</span><span>Duration</span>
          </div>
          {breaks.map((b, i) => (
            <div key={b._id ?? i} className="grid grid-cols-4 text-xs text-slate-700 py-0.5">
              <span className="text-slate-400">{i + 1}</span>
              <span>{fmtTime(b.start)}</span>
              <span>{b.end ? fmtTime(b.end) : <span className="text-amber-500 font-medium">Active</span>}</span>
              <span className="text-slate-500">{fmtDuration(b.start, b.end)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Edit Modal ────────────────────────────────────────────── */

function EditModal({ row, onClose, onSaved }: { row: NormRow; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState<StatusOption>(row.status);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await hrUpdateAttendanceApi({ attendanceId: row._id, status });
      toast.success('Attendance updated');
      onSaved(); onClose();
    } catch (e: any) { toast.error(e?.message ?? 'Failed to update'); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 text-lg leading-none">✕</button>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Edit Attendance</h3>
          <p className="text-sm text-slate-400 mt-0.5">{row.employeeName} · {row.date}</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as StatusOption)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/30 bg-white">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Modal ──────────────────────────────────────────── */

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
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 text-lg leading-none">✕</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <Trash2 size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Delete Record?</h3>
            <p className="text-sm text-slate-400">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          Deleting attendance for <span className="font-semibold text-slate-800">{row.employeeName}</span> on <span className="font-semibold">{row.date}</span>.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={confirm} disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────── */

function SkeletonRows({ cols }: { cols: number }) {
  return <>
    {[1, 2, 3, 4].map(i => (
      <tr key={i} className="border-b border-slate-50">
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} className="px-4 py-4">
            <div className="h-4 rounded-lg bg-slate-100 animate-pulse" style={{ width: `${40 + (j * 13) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </>;
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function HRAttendance() {
  const [allRows, setAllRows] = useState<NormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  // Use local date (toISOString gives UTC which can be yesterday in IST)
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [empFilter, setEmpFilter] = useState(''); // employeeName or ''

  // Modals
  const [editRow, setEditRow] = useState<NormRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<NormRow | null>(null);

  // Fetch
  useEffect(() => {
    setLoading(true); setError(null);
    axios.get(`${BASE_URL}/getAllAttendance`)
      .then(({ data }) => setAllRows(data.data.map(normalise)))
      .catch(e => setError(e?.message ?? 'Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [tick]);

  const handleRefresh = () => { setRefreshing(true); setTick(t => t + 1); setTimeout(() => setRefreshing(false), 800); };

  // Expose setDate for the "try latest date" hint button
  useEffect(() => { (window as any).__setAttDate = setDate; return () => { delete (window as any).__setAttDate; }; }, []);

  // Unique employees for filter dropdown
  // Map: internalId → [internalId, displayName, displayId]
  const uniqueEmployees = useMemo(() => {
    const map = new Map<string, [string, string, string]>();
    allRows.forEach(r => {
      const key = r.employeeId || r.employeeName;
      if (key && !map.has(key)) map.set(key, [key, r.employeeName, r.employeeId]);
    });
    return [...map.values()].sort((a, b) => (a[1] || '').localeCompare(b[1] || ''));
  }, [allRows]);

  // Filtered rows for table
  const filtered = useMemo(() => allRows.filter(r => {
    // r.date may be a full ISO string ("2026-03-22T...") or just "2026-03-22"
    const rowDate = r.date ? new Date(r.date).toLocaleDateString('en-CA') : '';
    const matchDate = !date || rowDate === date;
    const matchEmp = empFilter ? (r.employeeId === empFilter || r.employeeName === empFilter) : true;
    const q = search.toLowerCase();
    const matchSearch = !q || r.employeeName.toLowerCase().includes(q) || r.employeeEmail.toLowerCase().includes(q) || r.status.toLowerCase().includes(q);
    return matchDate && matchEmp && matchSearch;
  }), [allRows, date, empFilter, search]);

  // Stats for today (all employees, no emp filter)
  const todayRows = useMemo(() => allRows.filter(r => r.date ? new Date(r.date).toLocaleDateString('en-CA') === date : false), [allRows, date]);

  const stats = useMemo(() => ({
    present: todayRows.filter(r => r.status === 'Present').length,
    late: todayRows.filter(r => r.status === 'Late').length,
    absent: todayRows.filter(r => r.status === 'Absent').length,
    halfDay: todayRows.filter(r => r.status === 'Half Day').length,
    onLeave: todayRows.filter(r => r.status === 'On Leave').length,
    total: todayRows.length,
  }), [todayRows]);

  // Rows for calendar — either selected employee or all
  const calendarRows = useMemo(() =>
    empFilter ? allRows.filter(r => r.employeeId === empFilter || r.employeeName === empFilter) : allRows,
    [allRows, empFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="All employees attendance overview" />

      {/* ── Calendar ── */}
      <AttendanceCalendar allRows={calendarRows} selectedEmp={empFilter} />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: <Users size={16} />, color: 'from-[#0B0E92] to-[#69A6F0]', text: 'text-[#0B0E92]', bg: 'bg-[#EEF0FF]' },
          { label: 'Present', value: stats.present, icon: <CheckCircle2 size={16} />, color: 'from-emerald-500 to-teal-400', text: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Late', value: stats.late, icon: <AlertCircle size={16} />, color: 'from-amber-400 to-orange-400', text: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Absent', value: stats.absent, icon: <XCircle size={16} />, color: 'from-red-400 to-rose-400', text: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Half Day', value: stats.halfDay, icon: <Clock size={16} />, color: 'from-blue-400 to-sky-400', text: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'On Leave', value: stats.onLeave, icon: <TrendingUp size={16} />, color: 'from-purple-400 to-violet-400', text: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{s.label}</span>
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <span className="text-white">{s.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <Card padding={false}>
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or status…"
              className="w-full pl-9 pr-3 h-10 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all" />
          </div>

          {/* Employee filter */}
          <div className="relative">
            <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
              className="pl-8 pr-8 h-10 rounded-xl border border-slate-200 text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all">
              <option value="">All Employees</option>
              {uniqueEmployees.map(([id, name, displayId]) => (
                <option key={id} value={id}>
                  {name}{displayId && !/^[a-f0-9]{20,}$/i.test(displayId) ? ` (${displayId})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date picker */}
          <div className="relative">
            <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="pl-8 pr-3 h-10 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92] transition-all" />
          </div>

          {/* Refresh */}
          <button onClick={handleRefresh}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Row count */}
        {!loading && (
          <div className="px-5 py-2.5 bg-slate-50/60 border-b border-slate-100 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <span>
              <span className="font-semibold text-slate-700">{filtered.length}</span> record{filtered.length !== 1 ? 's' : ''} on{' '}
              {new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
            {filtered.length === 0 && allRows.length > 0 && (
              <span className="text-amber-600 font-medium">
                {allRows.length} total records found (different dates) —{' '}
                <button
                  className="underline hover:text-amber-800"
                  onClick={() => {
                    // Jump to the most recent date that has data
                    const latest = allRows.map(r => r.date).sort().reverse()[0];
                    if (latest) (window as any).__setAttDate?.(latest);
                  }}
                >
                  try latest date
                </button>
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="mx-5 my-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Breaks', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <SkeletonRows cols={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <span className="text-4xl">📋</span>
                      <p className="text-sm font-medium">No attendance records found</p>
                      <p className="text-xs text-slate-300">Try a different date, employee or search term</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r._id} className="hover:bg-slate-50/60 transition-colors group">

                  {/* Employee */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(r.employeeName || 'Unknown')}`}>
                        {getInitials(r.employeeName || 'UN')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 leading-tight">
                          {r.employeeName || <span className="text-slate-400 italic">Unknown</span>}
                        </p>
                        {/* Show employee ID (EMP001 etc.) if available */}
                        {r.employeeId && !/^[a-f0-9]{20,}$/i.test(r.employeeId) && (
                          <p className="text-xs font-mono text-[#0B0E92] font-semibold">{r.employeeId}</p>
                        )}
                        {/* Fall back to email if no display ID */}
                        {(!r.employeeId || /^[a-f0-9]{20,}$/i.test(r.employeeId)) && r.employeeEmail && (
                          <p className="text-xs text-slate-400">{r.employeeEmail}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 font-mono text-sm text-slate-600">{r.date}</td>

                  {/* Check In */}
                  <td className="px-4 py-4">
                    {r.checkIn
                      ? <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium"><Clock size={12} className="text-emerald-500" />{r.checkIn}</div>
                      : <span className="text-slate-300 text-sm">—</span>}
                  </td>

                  {/* Check Out */}
                  <td className="px-4 py-4">
                    {r.checkOut
                      ? <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium"><Clock size={12} className="text-slate-400" />{r.checkOut}</div>
                      : <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">Active</span>}
                  </td>

                  {/* Hours */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${r.workHours >= 8 ? 'bg-emerald-500' : r.workHours >= 4 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min((r.workHours / 8) * 100, 100)}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 font-mono">{fmtHours(r.workHours)}</span>
                    </div>
                  </td>

                  {/* Breaks */}
                  <td className="px-4 py-4"><BreaksInline breaks={r.breaks} /></td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[r.status]?.pill ?? STATUS_STYLES['Absent'].pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[r.status]?.dot ?? 'bg-red-500'}`} />
                      {r.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditRow(r)} title="Edit"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteRow(r)} title="Delete"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {editRow && <EditModal row={editRow} onClose={() => setEditRow(null)} onSaved={handleRefresh} />}
      {deleteRow && <DeleteConfirm row={deleteRow} onClose={() => setDeleteRow(null)} onDeleted={handleRefresh} />}
    </div>
  );
}

export function AdminAttendance() { return <HRAttendance />; }