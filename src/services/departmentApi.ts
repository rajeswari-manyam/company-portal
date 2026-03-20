// src/services/departmentApi.ts

// ✅ Fix: import apiClient from the correct path (your existing axios instance)
//    Adjust this path if your apiClient lives elsewhere (e.g. './apiClient', '../utils/apiClient')
import apiClient from "./apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DepartmentRecord {
  _id:            string;
  departmentName: string;
  managerName?:   string;
  description?:   string;
  employeeCount?: number;
  weekOffDays?:   string[] | string;
  createdAt?:     string;
  updatedAt?:     string;
}

// ✅ Re-export EmployeeRecord so UserTable can import it from here
export type { EmployeeRecord } from "./Empolyee.service";

export interface GetDepartmentsResponse {
  success:     boolean;
  departments: DepartmentRecord[];
}

export interface CreateDepartmentPayload {
  departmentName: string;
  managerName?:   string;
  description?:   string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────
// ✅ Exported so useDepartments can import them

export const mapDepartment = (d: DepartmentRecord) => ({
  id:            d._id,
  name:          d.departmentName ?? '',
  head:          d.managerName    ?? '',
  description:   d.description   ?? '',
  employeeCount: d.employeeCount  ?? 0,
  // ✅ Always string[] — Department type requires string[], not string|string[]|undefined
  weekOffDays:   Array.isArray(d.weekOffDays)
                   ? d.weekOffDays
                   : typeof d.weekOffDays === 'string' && d.weekOffDays
                     ? d.weekOffDays.split(',').map((s: string) => s.trim())
                     : [],
  createdAt:     d.createdAt ?? '',
});

export const mapToDepartmentPayload = (data: {
  name: string; head?: string; description?: string;
}): CreateDepartmentPayload => ({
  departmentName: data.name,
  managerName:    data.head,
  description:    data.description,
});

// ─── Response parser ──────────────────────────────────────────────────────────

const extractList = (data: unknown): DepartmentRecord[] => {
  if (Array.isArray(data))                       return data as DepartmentRecord[];
  if (Array.isArray((data as any)?.data))        return (data as any).data;
  if (Array.isArray((data as any)?.departments)) return (data as any).departments;
  return [];
};

// ─── GET ALL ──────────────────────────────────────────────────────────────────

export const getDepartments = async (): Promise<GetDepartmentsResponse> => {
  const res  = await apiClient.get('/getAllDepartments');
  const list = extractList(res.data);

  console.group('%c📦 [getDepartments]', 'color:#6366f1;font-weight:bold;font-size:13px');
  console.log(`Total: ${list.length} departments`);
  console.table(list.map((d: DepartmentRecord) => ({ ID: d._id, Name: d.departmentName })));
  console.groupEnd();

  return { success: true, departments: list };
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────

export const getDepartmentById = async (id: string): Promise<{ success: boolean; department: DepartmentRecord }> => {
  const res = await apiClient.get(`/getDepartmentById/${id}`);
  const raw: DepartmentRecord =
    res.data?.department ?? res.data?.data ?? res.data;

  console.group('%c🏢 [getDepartmentById]', 'color:#6366f1;font-weight:bold;font-size:13px');
  console.log('ID:', id);
  console.log('Mapped:', mapDepartment(raw));
  console.groupEnd();

  return { success: true, department: raw };
};

// ─── CREATE ───────────────────────────────────────────────────────────────────

export const createDepartment = async (
  data: CreateDepartmentPayload
): Promise<{ success: boolean }> => {
  await apiClient.post('/createDepartment', data);
  return { success: true };
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export const updateDepartment = async (
  id: string,
  data: CreateDepartmentPayload
): Promise<{ success: boolean }> => {
  await apiClient.put(`/updateDepartment/${id}`, data);
  return { success: true };
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const deleteDepartment = async (
  id: string
): Promise<{ success: boolean }> => {
  await apiClient.delete(`/deleteDepartment/${id}`);
  return { success: true };
};