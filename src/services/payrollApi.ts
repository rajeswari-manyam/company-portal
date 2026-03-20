import apiClient from "./apiClient";

// ✅ CREATE PAYROLL
export const createPayroll = async (data: any) => {
  const payload = {
    employeeId: data.employeeId,
    name: data.name,
    email: data.email,
    department: data.department,
    baseSalary: Number(data.baseSalary), // ✅ ensure number
  };

  const res = await apiClient.post("/createPayroll", payload);

  return {
    id: res.data?.id || res.data?._id || Math.random().toString(),
    ...payload,
    netSalary: res.data?.netSalary || payload.baseSalary,
    createdAt: res.data?.createdAt || new Date().toISOString(),
  };
};

// ✅ GET ALL PAYROLLS
export const getPayrolls = async () => {
  const res = await apiClient.get("/getAllPayrolls");

  const list = Array.isArray(res.data)
    ? res.data
    : res.data.payrolls || res.data.data || [];

  return list.map((p: any) => ({
    id: p.id || p._id,
    employeeId: p.employeeId,
    name: p.name,
    email: p.email,
    department: p.department,
    baseSalary: Number(p.baseSalary),
    netSalary: Number(p.netSalary || p.baseSalary),
    createdAt: p.createdAt,
  }));
};

// ✅ GET SINGLE PAYROLL
export const getPayrollByEmployee = async (employeeId: string) => {
  const res = await apiClient.get(`/getPayroll/${employeeId}`);

  const p = res.data.payroll || res.data;

  return {
    id: p.id || p._id,
    employeeId: p.employeeId,
    name: p.name,
    email: p.email,
    department: p.department,
    baseSalary: Number(p.baseSalary),
    netSalary: Number(p.netSalary || p.baseSalary),
    createdAt: p.createdAt,
  };
};

// ✅ UPDATE PAYROLL
export const updatePayroll = async (id: string, data: any) => {
  const payload = {
    name: data.name,
    email: data.email,
    department: data.department,
    baseSalary: Number(data.baseSalary),
  };

  await apiClient.put(`/updatePayroll/${id}`, payload);

  return { id, ...payload };
};

// ✅ DELETE PAYROLL
export const deletePayroll = async (id: string) => {
  return apiClient.delete(`/deletePayroll/${id}`);
};