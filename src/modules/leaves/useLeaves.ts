import { useState, useCallback } from 'react';
import { LeaveService } from './LeaveService';
import type { LeaveRequest } from '../../types';
import toast from 'react-hot-toast';

export function useLeaves(userId?: string) {
  const load = useCallback(
    () => (userId ? LeaveService.getForUser(userId) : LeaveService.getAll()),
    [userId]
  );

  const [leaves, setLeaves] = useState<LeaveRequest[]>(load);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const refresh = useCallback(() => setLeaves(load()), [load]);

  const filtered = leaves.filter(l => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.userName?.toLowerCase().includes(q) ||
      l.department?.toLowerCase().includes(q) ||
      l.leaveType?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ✅ Now fully async — awaits the API call inside LeaveService.create
  const apply = async (data: Omit<LeaveRequest, 'id'>): Promise<boolean> => {
    try {
      await LeaveService.create(data);
      refresh();
      toast.success('Leave request submitted!');
      return true;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to submit leave request';
      toast.error(message);
      return false;
    }
  };

  const approve = async (id: string, reviewedBy: string, note?: string) => {
    const ok = LeaveService.approve(id, reviewedBy, note);
    if (ok) { refresh(); toast.success('Leave approved'); }
    return ok;
  };

  const reject = async (id: string, reviewedBy: string, note?: string) => {
    const ok = LeaveService.reject(id, reviewedBy, note);
    if (ok) { refresh(); toast.error('Leave rejected'); }
    return ok;
  };

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  return {
    leaves,
    filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    apply,
    approve,
    reject,
    refresh,
    stats,
  };
}