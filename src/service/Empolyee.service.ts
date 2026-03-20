// src/service/employeeService.ts

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
  department?: string;       // MongoDB ObjectId string
  designation?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;      // ISO string from backend
  dateOfJoining?: string;    // ISO string from backend
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
  designation: string;
  phone: string;
  gender: string;
  dateOfBirth: string;       // "YYYY-MM-DD"
  dateOfJoining: string;     // "YYYY-MM-DD"
  address: string;
}

export interface CreateHRPayload {
  name: string;
  email: string;
  hrId: string;              // ← HR uses "hrId", not "empId"
  departmentId: string;
  designation: string;
  phone: string;
  gender: string;
  dateOfBirth: string;       // "YYYY-MM-DD"
  dateOfJoining: string;     // "YYYY-MM-DD"
  address: string;
}

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;

// ─── Response Types ────────────────────────────────────────────────────────────

export interface CreateEmployeeResponse {
  success: boolean;
  message: string;
  temporaryPassword: string;
  employee: EmployeeRecord;  // ← employee endpoint returns "employee"
}

export interface CreateHRResponse {
  success: boolean;
  message: string;
  temporaryPassword: string;
  hr: EmployeeRecord;        // ← HR endpoint returns "hr"
}

export interface GetEmployeesResponse {
  success: boolean;
  users: EmployeeRecord[];   // backend returns key "users"
}

export interface GetEmployeeResponse {
  success: boolean;
  employee: EmployeeRecord;
}

export interface UpdateEmployeeResponse {
  success: boolean;
  message: string;
  employee: EmployeeRecord;
}

export interface DeleteEmployeeResponse {
  success: boolean;
  message: string;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

/** Convert object to URLSearchParams (x-www-form-urlencoded) */
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

/** POST /create-hr */
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