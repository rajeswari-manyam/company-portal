import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  type Department
} from '../../data/store';

export const DepartmentService = {
  getAll: () => getDepartments(),

  create: (data: Omit<Department, 'id'>) => createDepartment(data),
  update: (id: string, data: Partial<Department>) => updateDepartment(id, data),
  delete: (id: string) => deleteDepartment(id),

  search: (depts: Department[], query: string) => {
    const q = query.toLowerCase();
    return depts.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.head.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  },
};
