// src/modules/users/useUsers.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type EmployeeRecord,
  type CreateEmployeePayload,
  type UpdateEmployeePayload,
} from '../../services/Empolyee.service';

export type { EmployeeRecord };

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useUsers() {
  const [users, setUsers]           = useState<EmployeeRecord[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // ── Fetch all employees (GET /getemployees) ────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployees();
      if (res.success) {
        setUsers(res.users);
        console.group('%c[GET ALL EMPLOYEES] Success', 'color: #6366f1; font-weight: bold;');
        console.log(`Total employees fetched: ${res.users.length}`);
        console.table(
          res.users.map(u => ({
            _id:         u._id,
            name:        u.name,
            empId:       u.empId ?? '—',
            email:       u.email,
            role:        u.role,
            designation: u.designation ?? '—',
            department:  u.department  ?? '—',
          }))
        );
        console.groupEnd();
      } else {
        setError('Failed to load employees');
        toast.error('Failed to load employees');
        console.error('%c[GET ALL EMPLOYEES] Failed', 'color: red;');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
      toast.error(msg);
      console.error('%c[GET ALL EMPLOYEES] Error', 'color: red;', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchRole   = roleFilter === 'all' || u.role === roleFilter;
      const matchSearch = !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.empId       ?? '').toLowerCase().includes(q) ||
        (u.designation ?? '').toLowerCase().includes(q) ||
        (u.phone       ?? '').toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  // ── CREATE ─────────────────────────────────────────────────────────────────
  const createUser = async (payload: CreateEmployeePayload): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await createEmployee(payload);
      if (res.success) {
        setUsers(prev => [...prev, res.employee]);
        toast.success(`Employee created! Temp password: ${res.temporaryPassword}`);
        return true;
      }
      toast.error(res.message ?? 'Failed to create employee');
      return false;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  const updateUser = async (id: string, payload: UpdateEmployeePayload): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await updateEmployee(id, payload);
      if (res.success) {
        setUsers(prev => prev.map(u => (u._id === id ? res.employee : u)));
        toast.success('Employee updated successfully');
        return true;
      }
      toast.error(res.message ?? 'Failed to update employee');
      return false;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ── DELETE ─────────────────────────────────────────────────────────────────
  const deleteUser = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await deleteEmployee(id);
      if (res.success) {
        setUsers(prev => prev.filter(u => u._id !== id));
        toast.success('Employee deleted successfully');
        return true;
      }
      toast.error(res.message ?? 'Failed to delete employee');
      return false;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    filtered,
    loading,
    error,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}