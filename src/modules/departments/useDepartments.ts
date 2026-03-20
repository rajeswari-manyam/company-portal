import { useState, useCallback } from 'react';
import { DepartmentService } from './DepartmentService';
import type { Department } from '../../data/store';
import toast from 'react-hot-toast';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>(() => DepartmentService.getAll());
  const [search, setSearch] = useState('');

  const refresh = useCallback(() => setDepartments(DepartmentService.getAll()), []);

  const filtered = search
    ? DepartmentService.search(departments, search)
    : departments;

  const createDepartment = async (data: Omit<Department, 'id'>) => {
    DepartmentService.create(data);
    refresh();
    toast.success('Department created');
    return true;
  };

  const updateDepartment = async (id: string, data: Partial<Department>) => {
    const ok = DepartmentService.update(id, data);
    if (ok) { refresh(); toast.success('Department updated'); }
    else toast.error('Update failed');
    return ok;
  };

  const deleteDepartment = async (id: string) => {
    const ok = DepartmentService.delete(id);
    if (ok) { refresh(); toast.success('Department deleted'); }
    else toast.error('Cannot delete this department');
    return ok;
  };

  return { departments, filtered, search, setSearch, createDepartment, updateDepartment, deleteDepartment, refresh };
}
