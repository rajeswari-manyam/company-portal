import apiClient from "./apiClient";

// ✅ CREATE LEAVE
export const createLeave = async (data: any) => {
  const payload: Record<string, string> = {
    employeeId: data.employeeId ?? '',
    empNumber:  data.empNumber  ?? '',
    leaveType:  data.leaveType  ?? '',
    startDate:  data.startDate  ?? '',
    endDate:    data.endDate    ?? '',
    reason:     data.reason     ?? '',
  };

  // Log so we can see exactly what's going to the backend
  console.group('%c[leaveApi] POST /apply', 'color:#6366f1;font-weight:bold');
  console.log('Payload:', payload);
  const missing = Object.entries(payload).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) console.warn('⚠️ Empty fields:', missing);
  console.groupEnd();

  // Send as form-encoded (backend expects form body on this route)
  const form = new URLSearchParams();
  Object.entries(payload).forEach(([k, v]) => { if (v) form.append(k, v); });

  const res = await apiClient.post("/apply", form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

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