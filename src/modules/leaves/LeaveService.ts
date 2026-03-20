import {
  getAllLeaves, getLeavesForUser, getLeavesForDept,
  createLeave, updateLeave, type LeaveRequest
} from '../../data/store';

export const LeaveService = {
  getAll: () => getAllLeaves(),
  getForUser: (userId: string) => getLeavesForUser(userId),
  getForDept: (deptId: string) => getLeavesForDept(deptId),

  create: (data: Omit<LeaveRequest, 'id'>) => createLeave(data),
  approve: (id: string, reviewedBy: string, note?: string) =>
    updateLeave(id, { status: 'approved', reviewedBy, reviewNote: note ?? 'Approved' }),
  reject: (id: string, reviewedBy: string, note?: string) =>
    updateLeave(id, { status: 'rejected', reviewedBy, reviewNote: note ?? 'Rejected' }),

  countDays: (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  },

  filterByStatus: (leaves: LeaveRequest[], status: string) =>
    status === 'all' ? leaves : leaves.filter(l => l.status === status),

  search: (leaves: LeaveRequest[], query: string) => {
    const q = query.toLowerCase();
    return leaves.filter(l =>
      l.userName?.toLowerCase().includes(q) ||
      l.department?.toLowerCase().includes(q) ||
      l.leaveType?.toLowerCase().includes(q)
    );
  },
};
