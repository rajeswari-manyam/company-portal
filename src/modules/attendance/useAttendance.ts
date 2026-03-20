// src/modules/attendance/useAttendance.ts
//
// Works for all three roles:
//   Employee  → pass user._id; fetches only their own records
//   HR/Admin  → call without userId; fetches ALL records from /getAllAttendance
//               (swap the endpoint name to match your backend)
//
// Drop-in replacement for the old mock-based version —
// keeps the same return shape so HRAttendance, AdminAttendance, MyAttendance
// need zero changes.

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ATT_KEYS } from "../../service/Attendance.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttendanceSession {
  _id: string;
  loginTime: string;
  logoutTime?: string;
}

export interface AttendanceBreak {
  _id: string;
  start: string;
  end?: string;
}

export interface RawAttendanceRecord {
  _id: string;
  employeeId: string | { _id: string; name: string; email: string };
  date: string;
  firstLogin: string;
  lastLogout?: string;
  sessions: AttendanceSession[];
  breaks: AttendanceBreak[];
  totalWorkHours: number;
  breakHours: number;
  overtimeHours: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';
  createdAt: string;
  updatedAt: string;
}

// Normalised shape — matches the old AttendanceSummary so AttendanceTable
// and stats functions need no changes
export interface AttendanceSummary {
  _id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workSeconds: number;
  status: RawAttendanceRecord['status'];
  raw: RawAttendanceRecord;
}

export interface AttendanceStats {
  present: number;
  late: number;
  halfDay: number;
  absent: number;
}

export type UserNameMap = Record<string, string>;

export interface UseAttendanceReturn {
  records: AttendanceSummary[];
  filtered: AttendanceSummary[];
  stats: AttendanceStats;
  userNames: UserNameMap;
  totalEmployees: number;
  search: string;
  setSearch: (v: string) => void;
  dateFilter: string;
  setDateFilter: (v: string) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta as unknown as { env: { VITE_API_BASE_URL: string } })
  .env.VITE_API_BASE_URL;

function resolveEmployeeId(raw: RawAttendanceRecord['employeeId']): string {
  return typeof raw === 'object' ? raw._id : raw;
}

function resolveEmployeeName(
  raw: RawAttendanceRecord['employeeId'],
  fallback: UserNameMap,
): string {
  if (typeof raw === 'object') return raw.name;
  return fallback[raw] ?? raw;
}

function normalise(rec: RawAttendanceRecord): AttendanceSummary {
  const checkIn = rec.sessions?.[0]?.loginTime
    ? new Date(rec.sessions[0].loginTime).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  const rawCheckout =
    rec.lastLogout ??
    [...(rec.sessions ?? [])].reverse().find(s => s.logoutTime)?.logoutTime ??
    null;

  const checkOut = rawCheckout
    ? new Date(rawCheckout).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return {
    _id:         rec._id,
    userId:      resolveEmployeeId(rec.employeeId),
    date:        rec.date,
    checkIn,
    checkOut,
    workSeconds: Math.round(rec.totalWorkHours * 3600),
    status:      rec.status,
    raw:         rec,
  };
}

function computeStats(records: AttendanceSummary[]): AttendanceStats {
  return records.reduce(
    (acc, r) => {
      if (r.status === 'Present')  acc.present  += 1;
      if (r.status === 'Late')     acc.late      += 1;
      if (r.status === 'Half Day') acc.halfDay   += 1;
      if (r.status === 'Absent')   acc.absent    += 1;
      return acc;
    },
    { present: 0, late: 0, halfDay: 0, absent: 0 },
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAttendance(userId?: string): UseAttendanceReturn {
  const today = new Date().toISOString().slice(0, 10);

  const [records,    setRecords]    = useState<AttendanceSummary[]>([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [dateFilter, setDateFilter] = useState(today);
  const [tick,       setTick]       = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        let raw: RawAttendanceRecord[] = [];

        if (userId) {
          // ── Employee view ──────────────────────────────────────────────────
          // Fetch today's record using the attendanceId stored during login
          const storedId =
            sessionStorage.getItem(ATT_KEYS.attendanceId) ??
            localStorage.getItem('att_attendanceId');

          if (storedId) {
            const { data } = await axios.get(`${BASE_URL}/getAttendanceById/${storedId}`);
            if (data.success && data.data) raw = [data.data];
          }

          // ── If your backend has a history endpoint, uncomment: ────────────
          // const { data: hist } = await axios.get(
          //   `${BASE_URL}/attendance?employeeId=${userId}`,
          // );
          // if (hist.success && Array.isArray(hist.data)) raw = hist.data;

        } else {
          // ── HR / Admin view ───────────────────────────────────────────────
          // ⚠️ Replace '/getAllAttendance' with your actual list endpoint
          const { data } = await axios.get(`${BASE_URL}/getAllAttendance`);
          if (data.success && Array.isArray(data.data)) raw = data.data;
        }

        if (!cancelled) setRecords(raw.map(normalise));
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error)?.message ?? 'Failed to load attendance');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, tick]);

  // Name map derived from embedded employee objects (HR/Admin records
  // come back with { employeeId: { _id, name, email } })
  const userNames = useMemo<UserNameMap>(() => {
    const m: UserNameMap = {};
    records.forEach(r => { m[r.userId] = resolveEmployeeName(r.raw.employeeId, m); });
    return m;
  }, [records]);

  const filtered = useMemo(() => {
    let out = records;
    if (dateFilter) out = out.filter(r => r.date === dateFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(r => {
        const name = (userNames[r.userId] ?? '').toLowerCase();
        return name.includes(q) || r.userId.toLowerCase().includes(q) || r.status.toLowerCase().includes(q);
      });
    }
    return out;
  }, [records, dateFilter, search, userNames]);

  const stats          = useMemo(() => computeStats(filtered), [filtered]);
  const totalEmployees = useMemo(() => new Set(records.map(r => r.userId)).size, [records]);

  return {
    records, filtered, stats, userNames, totalEmployees,
    search, setSearch, dateFilter, setDateFilter,
    isLoading, error,
    refresh: () => setTick(t => t + 1),
  };
}