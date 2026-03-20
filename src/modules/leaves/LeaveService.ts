import {
  getAllLeaves, getLeavesForUser, getLeavesForDept,
  createLeave as localCreateLeave, updateLeave, type LeaveRequest
} from '../../data/store';
import { createLeave as apiCreateLeave } from "../../services/leaveApi";

export const LeaveService = {
  getAll: () => getAllLeaves(),
  getForUser: (userId: string) => getLeavesForUser(userId),
  getForDept: (deptId: string) => getLeavesForDept(deptId),

  create: async (data: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest> => {
    console.log('[LeaveService] create() received:', data);

    // empNumber fallback chain:
    // 1. data.empNumber (populated from emp.empId at login via AuthContext)
    // 2. localStorage 'empNumber' (saved at login)
    // 3. Parse stored session — backend sends empId (e.g. "EMP_01"), not empNumber
    // 4. data.empId directly
    const storedSession = (() => {
      try { return JSON.parse(localStorage.getItem('hrportal_session') ?? '{}'); }
      catch { return {}; }
    })();

    const empNumber =
      data.empNumber ||
      localStorage.getItem('empNumber') ||
      storedSession?.empNumber ||
      storedSession?.empId ||
      (data as any).empId ||
      '';

    const apiPayload = {
      employeeId: data.userId,
      empNumber,
      leaveType:  data.leaveType,
      startDate:  data.startDate,
      endDate:    data.endDate,
      reason:     data.reason,
    };

    console.log('[LeaveService] API payload sent:', apiPayload);

    const serverLeave = await apiCreateLeave(apiPayload);

    const merged: Omit<LeaveRequest, 'id'> = {
      ...data,
      empNumber,
      status: serverLeave.status ?? 'pending',
    };

    return localCreateLeave({ ...merged, id: serverLeave.id } as LeaveRequest);
  },

  approve: (id: string, reviewedBy: string, note?: string) =>
    updateLeave(id, { status: 'approved', reviewedBy, reviewNote: note ?? 'Approved' }),

  reject: (id: string, reviewedBy: string, note?: string) =>
    updateLeave(id, { status: 'rejected', reviewedBy, reviewNote: note ?? 'Rejected' }),

  countDays: (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff =
      Math.ceil(
        (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    return diff > 0 ? diff : 0;
  },

  filterByStatus: (leaves: LeaveRequest[], status: string) =>
    status === 'all' ? leaves : leaves.filter(l => l.status === status),

  search: (leaves: LeaveRequest[], query: string) => {
    const q = query.toLowerCase();
    return leaves.filter(
      l =>
        l.userName?.toLowerCase().includes(q) ||
        l.department?.toLowerCase().includes(q) ||
        l.leaveType?.toLowerCase().includes(q)
    );
  },
};