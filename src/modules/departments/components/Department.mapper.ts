import type { DepartmentRecord } from "../../../services/departmentApi";
import type { Department } from "../../../data/store";

// API → UI
export function mapDepartment(record: DepartmentRecord): Department {
  return {
    id: record._id,
    name: record.departmentName,
    head: record.managerName ?? '',
    description: record.description ?? '',
    employeeCount: record.employeeCount ?? 0,
    weekOffDays: Array.isArray(record.weekOffDays)
      ? record.weekOffDays
      : typeof record.weekOffDays === 'string' && record.weekOffDays
        ? record.weekOffDays.split(',').map((s: string) => s.trim())
        : [],
    createdAt: record.createdAt ?? '',
  };
}

// UI → API
export function mapToDepartmentPayload(data: Omit<Department, 'id'>) {
  return {
    departmentName: data.name,
    managerName: data.head,
    description: data.description,
    employeeCount: data.employeeCount,
    weekOffDays: data.weekOffDays ?? [],
  };
}