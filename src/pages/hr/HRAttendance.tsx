import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Edit2, Trash2, ChevronDown, ChevronUp, Clock, Calendar, User } from 'lucide-react';
import { SearchInput, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Input from '../../components/ui/Input';
import {
  hrUpdateAttendanceApi,
  deleteAttendanceByIdApi,
} from "../../services/Attendance.service";
import type { AttendanceRecord } from "../../services/Attendance.service";
import axios from 'axios';
import toast from 'react-hot-toast';

/* ── Config ───────────────────────────────────────────── */

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL;

type StatusOption = AttendanceRecord['status'];
const STATUS_OPTIONS: StatusOption[] = [
  'Present',
  'Late',
  'Half Day',
  'Absent',
  'On Leave',
];

/* ── Status style map ─────────────────────────────────── */

const STATUS_STYLES: Record<StatusOption, { pill: string; dot: string }> = {
  Present: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Late: { pill: 'bg-amber-50  text-amber-700  border-amber-200', dot: 'bg-amber-500' },
  'Half Day': { pill: 'bg-blue-50   text-blue-700   border-blue-200', dot: 'bg-blue-500' },
  Absent: { pill: 'bg-red-50    text-red-700    border-red-200', dot: 'bg-red-500' },
  'On Leave': { pill: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

/* ── Types ───────────────────────────────────────────── */

interface NormalisedRow {
  _id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number;
  breakHours: number;
  status: StatusOption;
  breaks: AttendanceRecord['breaks'];
  sessions: AttendanceRecord['sessions'];
}

/* ── Helpers ─────────────────────────────────────────── */

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function fmtHours(h: number) {
  if (!h) return '—';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return hh > 0 ? `${hh}h ${mm}m` : `${mm}m`;
}

function fmtDuration(startIso: string, endIso?: string): string {
  if (!endIso) return 'Active';
  const diff = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000
  );
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
];
function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/* ── Normalize ───────────────────────────────────────── */

function normalise(raw: AttendanceRecord): NormalisedRow {
  const emp =
    raw.employeeId && typeof raw.employeeId === 'object'
      ? raw.employeeId
      : { _id: String(raw.employeeId ?? ''), name: String(raw.employeeId ?? ''), email: '' };

  const sessions = raw.sessions ?? [];
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime()
  );
  const firstSession = sortedSessions[0];
  const lastLogout =
    raw.lastLogout ??
    [...sessions].reverse().find((s) => s.logoutTime)?.logoutTime ??
    null;

  return {
    _id: raw._id,
    employeeId: emp._id,
    employeeName: emp.name,
    employeeEmail: emp.email,
    date: raw.date,
    checkIn: firstSession?.loginTime ? fmtTime(firstSession.loginTime) : null,
    checkOut: lastLogout ? fmtTime(lastLogout) : null,
    workHours: raw.totalWorkHours,
    breakHours: raw.breakHours,
    status: raw.status,
    breaks: raw.breaks ?? [],
    sessions,
  };
}

/* ── Status Badge ─────────────────────────────────────── */

function StatusBadge({ status }: { status: StatusOption }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES['Absent'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

/* ── Breaks Dropdown ─────────────────────────────────── */

function BreaksDropdown({ breaks }: { breaks: AttendanceRecord['breaks'] }) {
  const [open, setOpen] = useState(false);

  if (!breaks?.length)
    return <span className="text-xs text-slate-400">—</span>;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {breaks.length} break{breaks.length !== 1 ? 's' : ''}
      </button>

      {open && (
        <div className="absolute left-0 top-7 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-3 min-w-[280px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Break Details</p>
          <div className="grid grid-cols-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wide pb-1 border-b border-slate-100 mb-1">
            <span>#</span><span>Start</span><span>End</span><span>Duration</span>
          </div>
          {breaks.map((b, i) => (
            <div key={b._id ?? `${b.start}-${i}`} className="grid grid-cols-4 text-xs py-1 text-slate-600">
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

/* ── Edit Modal ───────────────────────────────────────── */

function EditModal({ row, onClose, onSaved }: { row: NormalisedRow; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState<StatusOption>(row.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await hrUpdateAttendanceApi({ attendanceId: row._id, status });
      toast.success('Attendance updated');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors text-lg leading-none"
        >✕</button>

        <div>
          <h3 className="text-lg font-semibold text-slate-800">Edit Attendance</h3>
          <p className="text-sm text-slate-400 mt-0.5">{row.employeeName} · {row.date}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusOption)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Modal ─────────────────────────────────────── */

function DeleteConfirm({ row, onClose, onDeleted }: { row: NormalisedRow; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    try {
      await deleteAttendanceByIdApi(row._id);
      toast.success('Record deleted');
      onDeleted();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors text-lg leading-none"
        >✕</button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <Trash2 size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Delete Record?</h3>
            <p className="text-sm text-slate-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          You are about to delete the attendance record for <span className="font-semibold text-slate-800">{row.employeeName}</span> on <span className="font-semibold text-slate-800">{row.date}</span>.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >Cancel</button>
          <button
            onClick={confirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >{deleting ? 'Deleting…' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Hook ─────────────────────────────────────────────── */

function useAttendance() {
  const [rows, setRows] = useState<NormalisedRow[]>([]);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(`${BASE_URL}/getAllAttendance`);
        setRows(data.data.map(normalise));
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tick]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchDate = r.date?.slice(0, 10) === date;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeEmail.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q);
      return matchDate && matchSearch;
    });
  }, [rows, search, date]);

  // Summary counts
  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filtered) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return counts;
  }, [filtered]);

  return {
    rows, filtered, summary,
    search, setSearch,
    date, setDate,
    loading, error,
    refresh: () => setTick((t) => t + 1),
  };
}

/* ── Summary Pill ─────────────────────────────────────── */

function SummaryPill({ label, count }: { label: StatusOption; count: number }) {
  const s = STATUS_STYLES[label];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${s.pill}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {count} {label}
    </div>
  );
}

/* ── Skeleton Row ─────────────────────────────────────── */

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4].map(i => (
        <tr key={i} className="border-b border-slate-50">
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-4 rounded-lg bg-slate-100 animate-pulse" style={{ width: `${40 + (j * 13) % 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Main Page ───────────────────────────────────────── */

export default function HRAttendance() {
  const {
    filtered, summary,
    search, setSearch,
    date, setDate,
    loading, error,
    refresh,
  } = useAttendance();

  const [editRow, setEditRow] = useState<NormalisedRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<NormalisedRow | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Attendance"
        subtitle="Employee attendance tracking"
      />

      {/* Summary pills */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(Object.entries(summary) as [StatusOption, number][]).map(([label, count]) => (
            <SummaryPill key={label} label={label} count={count} />
          ))}
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search employees…"
            />
          </div>

          {/* Date picker */}
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 pl-8 pr-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Count */}
        {!loading && (
          <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{filtered.length}</span> record{filtered.length !== 1 ? 's' : ''} on{' '}
            {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        )}

        {error && (
          <div className="mx-6 my-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Breaks', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <span className="text-4xl">📋</span>
                      <p className="text-sm font-medium">No attendance records found</p>
                      <p className="text-xs text-slate-300">Try a different date or search term</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition-colors group">

                    {/* Employee */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarColor(r.employeeName)}`}>
                          {getInitials(r.employeeName)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{r.employeeName}</p>
                          {r.employeeEmail && (
                            <p className="text-xs text-slate-400">{r.employeeEmail}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600 font-mono">{r.date}</span>
                    </td>

                    {/* Check In */}
                    <td className="px-5 py-4">
                      {r.checkIn ? (
                        <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
                          <Clock size={12} className="text-emerald-500" />
                          {r.checkIn}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Check Out */}
                    <td className="px-5 py-4">
                      {r.checkOut ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                          <Clock size={12} className="text-slate-400" />
                          {r.checkOut}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Hours */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-700 font-mono">
                        {fmtHours(r.workHours)}
                      </span>
                    </td>

                    {/* Breaks */}
                    <td className="px-5 py-4">
                      <BreaksDropdown breaks={r.breaks} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditRow(r)}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteRow(r)}
                          title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {editRow && (
        <EditModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSaved={refresh}
        />
      )}
      {deleteRow && (
        <DeleteConfirm
          row={deleteRow}
          onClose={() => setDeleteRow(null)}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}

/* ── Admin Export ─────────────────────────────────────── */
export function AdminAttendance() {
  return <HRAttendance />;
}