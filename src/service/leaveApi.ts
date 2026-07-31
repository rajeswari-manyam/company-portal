// src/service/leaveApi.ts
import apiClient from "./apiClient";

// ─── Common mapper ────────────────────────────────────────────────────────────
const mapLeave = (l: any) => ({
  id: l._id,
  userId: l.employeeId,
  empNumber: l.empNumber,
  userName: l.empNumber,
  department: l.department || '',
  leaveType: l.leaveType,
  startDate: l.startDate,
  endDate: l.endDate,
  days: l.totalDays ?? 0,
  reason: l.reason,
  status: l.status || 'pending',
  appliedOn: l.createdAt,
  reviewedBy: l.reviewedBy || '',
  reviewNote: l.reviewNote || '',
});

// ✅ 1. GET ALL LEAVES (HR/Admin)
export const getLeaves = async () => {
  const res = await apiClient.get("/LeavesStatus");
  const list = res.data?.data || [];
  return list.map(mapLeave);
};

// ✅ 2. GET PENDING LEAVES (HR)
export const getPendingLeaves = async () => {
  const res = await apiClient.get("/pending");
  const list = res.data?.data || res.data || [];
  return list.map(mapLeave);
};

// ✅ 3. GET LEAVES BY EMPLOYEE ID (MongoDB _id)
export const getLeavesByEmployee = async (employeeId: string) => {
  const res = await apiClient.get(`/getLeavesByEmployee/${employeeId}`);
  const list =
    res.data?.data ||
    res.data?.leaves ||
    (Array.isArray(res.data) ? res.data : []);
  return list.map(mapLeave);
};

// ✅ 4. GET LEAVE BY ID
export const getLeaveById = async (id: string) => {
  const res = await apiClient.get(`/leave/${id}`);
  return mapLeave(res.data?.data || res.data);
};

// ✅ 5. APPLY LEAVE
export const createLeave = async (data: any) => {
  const form = new URLSearchParams();
  form.append("employeeId", data.userId);
  form.append("empNumber", data.empNumber);
  form.append("leaveType", data.leaveType);
  form.append("startDate", data.startDate);
  form.append("endDate", data.endDate);
  form.append("reason", data.reason);

  const res = await apiClient.post("/apply", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return {
    id: res.data?.leave?._id || "",
    status: res.data?.leave?.status || "pending",
    ...data,
  };
};

// ✅ 6. APPROVE / REJECT
export const updateLeaveStatus = async (id: string, status: string) => {
  const form = new URLSearchParams();
  form.append("leaveId", id);
  form.append("status", status);

  return apiClient.put("/update-status", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

// ✅ 7. DELETE LEAVE
export const deleteLeave = async (id: string) => {
  return apiClient.delete(`/deleteLeave/${id}`);
};

// ✅ 8. LEAVE CALENDAR
export const getLeaveCalendar = async (empNumber: string, year: number) => {
  const res = await apiClient.get(
    `/leave-calendar?empNumber=${empNumber}&year=${year}`
  );
  return res.data?.data || res.data || [];
};

// ✅ 9. GET LEAVE BALANCE — GET /balance/:employeeId
// API returns: { success: true, leaveBalance: { sickLeave, casualLeave, ... } }
export const getLeaveBalance = async (employeeId: string) => {
  const res = await apiClient.get(`/balance/${employeeId}`);
  return res.data?.leaveBalance ?? null;
};