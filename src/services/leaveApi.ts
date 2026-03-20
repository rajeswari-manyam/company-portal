import apiClient from "./apiClient";

// ✅ CREATE LEAVE
export const createLeave = async (data: any) => {
  const payload = {
    employeeId: data.employeeId,
    empNumber: data.empNumber,
    leaveType: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
  };

  const res = await apiClient.post("/apply", payload);

  return {
    id: res.data?.id || res.data?._id || Math.random().toString(),
    ...payload,
    status: res.data?.status || "pending",
  };
};

// ✅ GET ALL LEAVES
export const getLeaves = async () => {
  const res = await apiClient.get("/getAllLeaves");

  const list = Array.isArray(res.data)
    ? res.data
    : res.data.leaves || res.data.data || [];

  return list.map((l: any) => ({
    id: l.id || l._id,
    employeeId: l.employeeId,
    empNumber: l.empNumber,
    leaveType: l.leaveType,
    startDate: l.startDate,
    endDate: l.endDate,
    reason: l.reason,
    status: l.status || "pending",
  }));
};

// ✅ DELETE LEAVE
export const deleteLeave = async (id: string) => {
  return apiClient.delete(`/deleteLeave/${id}`);
};

// ✅ UPDATE LEAVE STATUS (APPROVE / REJECT)
export const updateLeaveStatus = async (id: string, status: string) => {
  return apiClient.put(`/updateLeaveStatus/${id}`, { status });
};