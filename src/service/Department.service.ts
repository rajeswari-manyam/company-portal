// src/service/departmentService.ts

import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as unknown as { env: { VITE_API_BASE_URL: string } }).env.VITE_API_BASE_URL,
});

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DepartmentRecord {
  _id: string;
  departmentName: string;
  managerName: string;
  description: string;
  employeeCount: number;
  weekOffDays?: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface GetDepartmentsResponse {
  success: boolean;
  departments: DepartmentRecord[];
}

export interface GetDepartmentByIdResponse {
  success: boolean;
  department: DepartmentRecord;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

/** GET /getAllDepartments */
export async function getDepartments(): Promise<GetDepartmentsResponse> {
  const { data } = await api.get<GetDepartmentsResponse>('/getAllDepartments');
  return data;
}

/** GET /getDepartmentById/:id */
export async function getDepartmentById(id: string): Promise<GetDepartmentByIdResponse> {
  const { data } = await api.get<GetDepartmentByIdResponse>(`/getDepartmentById/${id}`);
  return data;
}