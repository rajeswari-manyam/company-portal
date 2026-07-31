// src/service/departmentApi.ts
import apiClient from "./apiClient";

// ─── Types ─────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  description: string;
  head: string;
  createdAt: string;
  employeeCount: number;
  weekOffDays: string[];
}

export interface DepartmentRecord {
  _id: string;
  departmentName: string;
  managerName?: string;
  description?: string;
  employeeCount?: number;
  weekOffDays?: string[] | string;
  createdAt?: string;
}

// ─── Mappers ───────────────────────────────────────────

export const mapDepartment = (d: DepartmentRecord): Department => ({
  id: d._id,
  name: d.departmentName ?? "",
  head: d.managerName ?? "",
  description: d.description ?? "",
  employeeCount: d.employeeCount ?? 0,
  weekOffDays: Array.isArray(d.weekOffDays)
    ? d.weekOffDays
    : typeof d.weekOffDays === "string"
      ? d.weekOffDays.split(",").map(s => s.trim())
      : [],
  createdAt: d.createdAt ?? "",
});

// Converts frontend Department form → API payload
export const mapToDepartmentPayload = (data: {
  name: string;
  head?: string;
  description?: string;
  weekOffDays?: string[];
}) => ({
  name: data.name,
  head: data.head,
  description: data.description,
  weekOffDays: data.weekOffDays ?? [],
});

// ─── API CALLS ─────────────────────────────────────────

// GET all departments
export const getDepartments = async (): Promise<Department[]> => {
  const res = await apiClient.get("/getAllDepartments");

  const list: DepartmentRecord[] = Array.isArray(res.data)
    ? res.data
    : res.data.departments || res.data.data || [];

  return list.map(mapDepartment);
};

// GET department by ID
export const getDepartmentById = async (id: string): Promise<Department> => {
  const res = await apiClient.get(`/getDepartmentById/${id}`);
  const raw: DepartmentRecord = res.data?.department || res.data;
  return mapDepartment(raw);
};

// CREATE department
export const createDepartment = async (data: {
  name: string;
  head?: string;
  description?: string;
  weekOffDays?: string[];
}) => {
  const form = new URLSearchParams();
  form.append("departmentName", data.name);
  if (data.head) form.append("managerName", data.head);
  if (data.description) form.append("description", data.description);
  (data.weekOffDays || []).forEach(day => form.append("weekOffDays", day));

  await apiClient.post("/createDepartment", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return { success: true };
};

// UPDATE department
export const updateDepartment = async (
  id: string,
  data: {
    name: string;
    head?: string;
    description?: string;
    weekOffDays?: string[];
  }
) => {
  const form = new URLSearchParams();
  form.append("departmentName", data.name);
  if (data.head) form.append("managerName", data.head);
  if (data.description) form.append("description", data.description);
  (data.weekOffDays || []).forEach(day => form.append("weekOffDays", day));

  await apiClient.put(`/updateDepartment/${id}`, form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return { success: true };
};

// DELETE department
export const deleteDepartment = async (id: string) => {
  await apiClient.delete(`/deleteDepartment/${id}`);
  return { success: true };
};