// src/modules/departments/useDepartments.ts

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getDepartments,
  type DepartmentRecord,
} from '../../service/Department.service';

export function useDepartments() {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');

  // ── Fetch all departments from GET /getAllDepartments ──────────────────────
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDepartments();
      if (res.success) {
        setDepartments(res.departments);
        console.group('%c[GET ALL DEPARTMENTS]', 'color:#6366f1;font-weight:bold');
        console.table(res.departments.map(d => ({
          _id:            d._id,
          departmentName: d.departmentName,
          managerName:    d.managerName,
          employeeCount:  d.employeeCount,
        })));
        console.groupEnd();
      } else {
        setError('Failed to load departments');
        toast.error('Failed to load departments');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  // ── Search filter (client-side) ────────────────────────────────────────────
  const filtered = search
    ? departments.filter(d =>
        d.departmentName.toLowerCase().includes(search.toLowerCase()) ||
        d.managerName.toLowerCase().includes(search.toLowerCase())
      )
    : departments;

  // ── getDeptName: resolve MongoDB _id → departmentName ─────────────────────
  function getDeptName(idOrName?: string): string {
    if (!idOrName) return '—';
    const found = departments.find(d => d._id === idOrName);
    return found ? found.departmentName : idOrName;
  }

  return {
    departments,
    filtered,
    loading,
    error,
    search,
    setSearch,
    refetch: fetchDepartments,
    getDeptName,
  };
}