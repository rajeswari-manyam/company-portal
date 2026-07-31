import apiClient from "./apiClient";

export interface PayrollEmployee {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  baseSalary: number;
}

export interface Payslip {
  id: string;
  month: string;
  year: number;
  amountCredited: number;
  createdAt: string | null;
  name: string;
  department: string;
  baseSalary: number;
  status?: string;
  employee: PayrollEmployee;
}

function normalizeEmployee(emp: any): PayrollEmployee {
  return {
    employeeId: emp.employeeId || emp.empId || emp._id || "",
    name:       emp.name       || "Unknown",
    email:      emp.email      || "",
    department: emp.department || "",
    baseSalary: emp.baseSalary || 0,
  };
}

function mapPayslip(p: any): Payslip {
  return {
    id:             p._id ?? p.id ?? "",
    month:          p.month ?? "",
    year:           p.year  ?? new Date().getFullYear(),
    amountCredited: p.amountCredited ?? 0,
    createdAt:      p.createdAt ?? null,
    name:           p.name ?? "Unknown",
    department:     p.department ?? "",
    baseSalary:     p.baseSalary ?? 0,
    status:         p.status ?? "generated",
    employee:       normalizeEmployee(p.employee ?? {}),
  };
}

export const getAllPayslips = async (): Promise<Payslip[]> => {
  const res = await apiClient.get("/getAll");
  const data = res.data;
  const raw =
    Array.isArray(data)           ? data          :
    Array.isArray(data?.payslips) ? data.payslips :
    Array.isArray(data?.data)     ? data.data     : [];
  return raw.map(mapPayslip);
};

export const getPayslipsByEmployee = async (employeeId: string): Promise<Payslip[]> => {
  const res = await apiClient.get(`/getPayslipsByEmpId/${employeeId}`);
  const emp = res.data?.employee ?? {};
  const payslips: any[] = emp.payslips ?? [];

  return payslips.map((p, index) => ({
    id:             p._id ?? p.id ?? `${emp._id}-${p.month}-${p.year}-${index}`,
    employeeId:     emp._id ?? "",
    month:          p.month ?? "",
    year:           p.year  ?? new Date().getFullYear(),
    amountCredited: p.amountCredited ?? 0,
    createdAt:      p.createdAt ?? null,
    // Flattened from parent emp:
    name:           emp.name       ?? "Unknown",
    department:     emp.department ?? "",
    baseSalary:     emp.baseSalary ?? 0,
    status:         p.status       ?? "generated",
    employee:       normalizeEmployee(emp),
  }));
};

export const addEmployee = async (
  employeeId: string,
  baseSalary: number,
): Promise<{ message?: string; [key: string]: any }> => {
  const form = new URLSearchParams();
  form.append("employeeId", employeeId);
  form.append("baseSalary", String(baseSalary));

  const res = await apiClient.post("/add-employee", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
};

export const incrementSalary = async (
  employeeId: string,
  incrementAmount: number,
): Promise<{ message?: string; [key: string]: any }> => {
  const res = await apiClient.post("/increment-salaries", {
    employeeId,
    incrementAmount,
  });
  return res.data;
};

export const downloadPayslip = async (id: string, filename: string): Promise<void> => {
  const res = await apiClient.get(`/payslips/${id}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};