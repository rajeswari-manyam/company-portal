// src/modules/departments/useDepartments.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import * as DeptService from "../../service/departmentApi";
import { mapToDepartmentPayload } from "../../service/departmentApi";
import type { Department } from '../../service/departmentApi';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await DeptService.getDepartments(); // Department[]
      setDepartments(res);
    } catch (err) {
      console.error('[useDepartments] refetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? departments.filter(d => d.name.toLowerCase().includes(q))
      : departments;
  }, [departments, search]);

  const getDeptName = useCallback(
    (id?: string): string => {
      if (!id) return '—';
      return departments.find(d => d.id === id)?.name ?? '—';
    },
    [departments]
  );

  const createDepartment = useCallback(
    async (data: Omit<Department, 'id'>): Promise<boolean> => {
      try {
        await DeptService.createDepartment(mapToDepartmentPayload(data));
        await refetch();
        return true;
      } catch { return false; }
    },
    [refetch]
  );

  const updateDepartment = useCallback(
    async (id: string, data: Omit<Department, 'id'>): Promise<boolean> => {
      try {
        await DeptService.updateDepartment(id, mapToDepartmentPayload(data));
        await refetch();
        return true;
      } catch { return false; }
    },
    [refetch]
  );

  const deleteDepartment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await DeptService.deleteDepartment(id);
        await refetch();
        return true;
      } catch { return false; }
    },
    [refetch]
  );

  return {
    departments,
    filtered,
    loading,
    search,
    setSearch,
    refetch,
    getDeptName,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}