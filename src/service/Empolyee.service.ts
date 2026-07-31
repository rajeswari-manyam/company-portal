// src/services/Empolyee.service.ts

import axios from 'axios';

// ─── Axios Instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: (import.meta as unknown as { env: { VITE_API_BASE_URL: string } }).env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface EmployeeRecord {
  _id: string;
  name: string;
  empId?: string;
  email: string;
  password?: string;
  role: 'admin' | 'hr' | 'employee';
  department?: string;
  designation?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  address?: string;
  firstLogin: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  empId: string;
  departmentId: string;
  designation?: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  dateOfJoining: string;
  address: string;
}

// ✅ FIX: API /create-hr expects `empId` (not `hrId`) — confirmed from Postman
export interface CreateHRPayload {
  name: string;
  email: string;
  empId: string;        // ← was `hrId`, API always expects `empId`
  departmentId: string;
  designation?: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  dateOfJoining: string;
  address: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  email?: string;
  empId?: string;
  department?: string;
  designation?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  address?: string;
}

// ─── Response Types ────────────────────────────────────────────────────────────

export interface CreateEmployeeResponse {
  success: boolean;
  message: string;
  temporaryPassword: string;
  employee: EmployeeRecord;
}

export interface CreateHRResponse {
  success: boolean;
  message: string;
  temporaryPassword: string;
  hr: EmployeeRecord;
}

export interface GetEmployeesResponse {
  success: boolean;
  users: EmployeeRecord[];
}

export interface GetEmployeeResponse {
  success: boolean;
  employee?: EmployeeRecord;
  user?: EmployeeRecord;
}

export interface UpdateEmployeeResponse {
  success: boolean;
  message: string;
  user: EmployeeRecord;
}

export interface DeleteEmployeeResponse {
  success: boolean;
  message: string;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

/** Extracts the most useful message from an API error (backend message > axios message > fallback). */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function toFormData(payload: Record<string, string>): URLSearchParams {
  const form = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  });
  return form;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

/** POST /create-employee */
export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<CreateEmployeeResponse> {
  const { data } = await api.post<CreateEmployeeResponse>(
    '/create-employee',
    toFormData(payload as unknown as Record<string, string>)
  );
  return data;
}

/**
 * POST /create-hr
 * ✅ FIX: maps empId → empId (removed old hrId alias).
 * The backend /create-hr endpoint accepts the same field names as /create-employee.
 */
export async function createHR(
  payload: CreateHRPayload
): Promise<CreateHRResponse> {
  const { data } = await api.post<CreateHRResponse>(
    '/create-hr',
    toFormData(payload as unknown as Record<string, string>)
  );
  return data;
}

/** GET /getemployees */
export async function getEmployees(): Promise<GetEmployeesResponse> {
  const { data } = await api.get<GetEmployeesResponse>('/getemployees');
  return data;
}

/** GET /getemployee/:id */
export async function getEmployeeById(id: string): Promise<GetEmployeeResponse> {
  const { data } = await api.get<GetEmployeeResponse>(`/getemployee/${id}`);
  return data;
}

/** PUT /employee/:id */
export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload
): Promise<UpdateEmployeeResponse> {
  const { data } = await api.put<UpdateEmployeeResponse>(
    `/employee/${id}`,
    toFormData(payload as unknown as Record<string, string>)
  );
  return data;
}

/** DELETE /delete-employee/:id */
export async function deleteEmployee(id: string): Promise<DeleteEmployeeResponse> {
  const { data } = await api.delete<DeleteEmployeeResponse>(`/delete-employee/${id}`);
  return data;
}