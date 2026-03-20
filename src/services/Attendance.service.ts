// src/services/Attendance.service.ts
//
// ── ID reference ────────────────────────────────────────────────────────────
//  employee._id   e.g. "69bcfc633334d55035bc2818"  ← user._id from AuthContext
//  attendanceId   e.g. "69bcfc943334d55035bc2828"  ← from login response
//
// /live-hours    GET  ?employeeId = employee._id   → { hours: number }
// /break-start   POST  form body  employeeId = employee._id
// /breakend      POST  JSON body  employeeId = employee._id
// /logout        POST  JSON body  employeeId = employee._id
// /getAttendanceById/:attendanceId
// ────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as unknown as { env: { VITE_API_BASE_URL: string } }).env
    .VITE_API_BASE_URL,
});

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

export interface AttendanceRecord {
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

// /live-hours returns { "hours": 0.22 }
export interface LiveHoursResponse {
  hours: number;
}

export interface AttendanceByIdResponse {
  success: boolean;
  data: AttendanceRecord;
}

export interface HRUpdatePayload {
  attendanceId: string;
  status: AttendanceRecord['status'];
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
export const ATT_KEYS = {
  attendanceId:     'att_attendanceId',
  attendanceStatus: 'att_status',
  runningHours:     'att_runningHours',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toForm(obj: Record<string, string>): URLSearchParams {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => v != null && v !== '' && p.append(k, v));
  return p;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * GET /live-hours?employeeId=<employee._id>
 * Returns { "hours": 0.22 }
 *
 * The Postman example used a GET body — browsers drop GET bodies silently.
 * Axios query params (`params`) are identical from the server's perspective.
 */
export async function getLiveHoursApi(employeeId: string) {
  const { data } = await api.get('/live-hours', {
    params: { employeeId }, // ✅ correct
  });
  return data;
}
/** POST /break-start  (form-encoded)  employeeId = employee._id */
export async function startBreakApi(employeeId: string) {
  const { data } = await api.post('/break-start', toForm({ employeeId }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

/** POST /breakend  (JSON)  employeeId = employee._id */
export async function endBreakApi(employeeId: string) {
  const { data } = await api.post(
    '/breakend',
    JSON.stringify({ employeeId }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return data;
}

/** POST /logout  (JSON)  employeeId = employee._id */
export async function logoutAttendanceApi(employeeId: string) {
  const { data } = await api.post(
    '/logout',
    JSON.stringify({ employeeId }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return data;
}

/** GET /getAttendanceById/:attendanceId  (attendance record _id, NOT employee._id) */
export async function getAttendanceByIdApi(
  attendanceId: string,
): Promise<AttendanceByIdResponse> {
  const { data } = await api.get<AttendanceByIdResponse>(
    `/getAttendanceById/${attendanceId}`,
  );
  return data;
}

/** POST /hr-update  (form-encoded) */
export async function hrUpdateAttendanceApi(payload: HRUpdatePayload) {
  const { data } = await api.post(
    '/hr-update',
    toForm({ attendanceId: payload.attendanceId, status: payload.status }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  return data;
}

/** DELETE /deleteAttendanceById/:attendanceId */
export async function deleteAttendanceByIdApi(attendanceId: string) {
  const { data } = await api.delete(`/deleteAttendanceById/${attendanceId}`);
  return data;
}