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
  employeeId: string | { _id: string; name: string; email: string; empId?: string; department?: string };
  date: string;
  firstLogin: string;
  lastLogout?: string;
  sessions: AttendanceSession[];
  breaks: AttendanceBreak[];
  idles?: any[];
  totalWorkHours: number;
  breakHours: number;
  overtimeHours: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';
  createdAt: string;
  updatedAt: string;
}

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

// ─── Attendance API ────────────────────────────────────────────────────────────

/** GET /live-hours?employeeId=<id> → { hours: number } */
export async function getLiveHoursApi(employeeId: string): Promise<LiveHoursResponse> {
  const { data } = await api.get('/live-hours', { params: { employeeId } });
  return data;
}

/** POST /break-start  (JSON body) */
export async function startBreakApi(employeeId: string) {
  const { data } = await api.post(
    '/break-start',
    JSON.stringify({ employeeId }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return data;
}

/** POST /breakend  (JSON body) */
export async function endBreakApi(employeeId: string) {
  const { data } = await api.post(
    '/breakend',
    JSON.stringify({ employeeId }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return data;
}

/** POST /logout  (JSON body) */
export async function logoutAttendanceApi(employeeId: string) {
  const { data } = await api.post(
    '/logout',
    JSON.stringify({ employeeId }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return data;
}

/** GET /getAttendanceById/:attendanceId */
export async function getAttendanceByIdApi(
  attendanceId: string,
): Promise<AttendanceByIdResponse> {
  const { data } = await api.get<AttendanceByIdResponse>(
    `/getAttendanceById/${attendanceId}`,
  );
  return data;
}

/** GET /getAttendanceByemployee/:employeeId */
export async function getAttendanceByEmpIdApi(
  employeeId: string,
): Promise<AttendanceRecord[]> {
  const { data } = await api.get(`/getAttendanceByemployee/${employeeId}`);
  if (Array.isArray(data))          return data;
  if (Array.isArray(data?.data))    return data.data;
  if (Array.isArray(data?.records)) return data.records;
  return [];
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

