import React, { useState, useEffect, useMemo } from 'react';
import { SearchInput, Card, Badge } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Input from '../../components/ui/Input';
import {
  hrUpdateAttendanceApi,
  deleteAttendanceByIdApi,
} from '../../service/Attendance.service';
import type { AttendanceRecord } from '../../service/Attendance.service';
import axios from 'axios';
import toast from 'react-hot-toast';

/* ── Config ───────────────────────────────────────────── */

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL;
const STANDARD_HOURS = 8;

type StatusOption = AttendanceRecord['status'];
const STATUS_OPTIONS: StatusOption[] = [
  'Present',
  'Late',
  'Half Day',
  'Absent',
  'On Leave',
];

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

/* ── Normalize ───────────────────────────────────────── */

function normalise(raw: AttendanceRecord): NormalisedRow {
  const emp =
    raw.employeeId && typeof raw.employeeId === 'object'
      ? raw.employeeId
      : {
          _id: String(raw.employeeId ?? ''),
          name: String(raw.employeeId ?? ''),
          email: '',
        };

  const sessions = raw.sessions ?? [];

  const sortedSessions = [...sessions].sort(
    (a, b) =>
      new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime()
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

/* ── Breaks Dropdown ─────────────────────────────────── */

function BreaksDropdown({
  breaks,
}: {
  breaks: AttendanceRecord['breaks'];
}) {
  const [open, setOpen] = useState(false);

  if (!breaks?.length)
    return <span className="text-xs text-slate-400">—</span>;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-blue-700 font-semibold hover:underline"
      >
        {open ? '▲' : '▼'} {breaks.length} break
        {breaks.length !== 1 ? 's' : ''}
      </button>

      {open && (
        <div className="absolute left-0 top-6 z-20 bg-white border rounded-xl shadow-lg p-3 min-w-[260px]">
          <div className="text-[10px] font-bold text-slate-400 mb-2">
            Break Details
          </div>

          {breaks.map((b, i) => (
            <div
              key={b._id ?? `${b.start}-${i}`}
              className="grid grid-cols-4 text-xs py-0.5"
            >
              <span>{i + 1}</span>
              <span>{fmtTime(b.start)}</span>
              <span>
                {b.end ? fmtTime(b.end) : <span>Active</span>}
              </span>
              <span>{fmtDuration(b.start, b.end)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Edit Modal ───────────────────────────────────────── */

function EditModal({
  row,
  onClose,
  onSaved,
}: {
  row: NormalisedRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<StatusOption>(row.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await hrUpdateAttendanceApi({
        attendanceId: row._id,
        status,
      });
      toast.success('Updated');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30">
      <div className="bg-white p-6 rounded-xl w-[340px] space-y-4">
        <h3 className="font-bold">Edit Attendance</h3>

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as StatusOption)
          }
          className="w-full border p-2 rounded"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border p-2">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-blue-900 text-white p-2"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Modal ─────────────────────────────────────── */

function DeleteConfirm({
  row,
  onClose,
  onDeleted,
}: {
  row: NormalisedRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    try {
      await deleteAttendanceByIdApi(row._id);
      toast.success('Deleted');
      onDeleted();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30">
      <div className="bg-white p-6 rounded-xl w-[340px] space-y-4">
        <h3 className="font-bold">Delete Record?</h3>

        <p className="text-sm text-slate-600">
          Delete attendance of {row.employeeName}?
        </p>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border p-2">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={deleting}
            className="flex-1 bg-red-500 text-white p-2"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Hook ─────────────────────────────────────────────── */

function useAttendance() {
  const [rows, setRows] = useState<NormalisedRow[]>([]);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${BASE_URL}/getAllAttendance`
      );

      setRows(data.data.map(normalise));
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  return {
    rows,
    filtered,
    search,
    setSearch,
    date,
    setDate,
    loading,
    error,
    refresh: () => setTick((t) => t + 1),
  };
}

/* ── Main Page ───────────────────────────────────────── */

export default function HRAttendance() {
  const {
    filtered,
    search,
    setSearch,
    date,
    setDate,
    loading,
    error,
    refresh,
  } = useAttendance();

  const [editRow, setEditRow] = useState<NormalisedRow | null>(
    null
  );
  const [deleteRow, setDeleteRow] =
    useState<NormalisedRow | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle="Employee attendance tracking"
      />

      <Card>
        <div className="flex gap-3 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search..."
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button onClick={refresh}>Refresh</button>
        </div>

        {loading && <p className="p-4">Loading...</p>}
        {error && <p className="p-4 text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Breaks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td>{r.employeeName}</td>
                    <td>{r.date}</td>
                    <td>{r.checkIn}</td>
                    <td>{r.checkOut}</td>
                    <td>{fmtHours(r.workHours)}</td>
                    <td>
                      <BreaksDropdown breaks={r.breaks} />
                    </td>
                    <td>
                      <Badge status={r.status} />
                    </td>
                    <td className="flex gap-2">
                      <button
                        onClick={() => setEditRow(r)}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteRow(r)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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