import apiClient from "./apiClient";

// ─────────────────────────────────────────────────────────────────────────────
// GET PAYSLIPS BY PAYSLIP _id
// /getPayslipsById/:payslipId  ← payslip ObjectId e.g. "69bdcfa19fec4bf2424373ea"
// ─────────────────────────────────────────────────────────────────────────────
export const getPayrollByEmployee = async (payslipId: string) => {
  const res = await apiClient.get(`/getPayslipsById/${payslipId}`);
  return res.data?.payslips || [];
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PAYSLIP _ids FOR AN EMPLOYEE
//
// How the data is structured in MongoDB:
//   Employee document:
//     { _id: "69bdcfa19fec4bf2424373e8", empId: "EMP003", payslips: ["69bdcfa19fec4bf2424373ea"] }
//
//   Payslip document:
//     { _id: "69bdcfa19fec4bf2424373ea", employeeId: "69bdcfa19fec4bf2424373e8", ... }
//     ↑ employeeId here is the employee's MongoDB _id, NOT the empId string
//
// So to get payslips for "EMP003":
//   1. /getemployees → find user where empId === "EMP003"
//   2. Read user.payslips[] → these are payslip ObjectIds
//   3. Call /getPayslipsById/:payslipId for each one
// ─────────────────────────────────────────────────────────────────────────────
export const getPayslipIdsByEmpId = async (empIdString: string): Promise<{
  payslipIds: string[];
  employeeMongoId: string;
} | null> => {
  try {
    const res = await apiClient.get("/getemployees");
    const users: any[] = res.data?.users ?? [];

    // Match by empId string (e.g. "EMP003") — case-insensitive
    const match = users.find(
      (u) =>
        u.empId?.toLowerCase() === empIdString.trim().toLowerCase() ||
        u.employeeId?.toLowerCase() === empIdString.trim().toLowerCase()
    );

    if (!match) {
      console.warn(`No employee found with empId: ${empIdString}`);
      return null;
    }

    // payslips[] array contains payslip ObjectIds directly
    const payslipIds: string[] = Array.isArray(match.payslips)
      ? match.payslips.filter(Boolean)
      : [];

    console.log(`Employee ${empIdString} → MongoDB _id: ${match._id}, payslipIds:`, payslipIds);

    return {
      payslipIds,
      employeeMongoId: match._id,
    };
  } catch (err) {
    console.error("getPayslipIdsByEmpId error:", err);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD PDF
// ─────────────────────────────────────────────────────────────────────────────
export const downloadPayslipFile = async (id: string, fileName?: string) => {
  const res = await apiClient.get(`/payslips/${id}/download`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "payslip.pdf";
  a.click();
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────────────────────
// ADD EMPLOYEE
// ─────────────────────────────────────────────────────────────────────────────
export const addEmployee = async (data: {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  baseSalary: number;
}) => {
  const params = new URLSearchParams();
  params.append("employeeId", data.employeeId);
  params.append("name", data.name);
  params.append("email", data.email);
  params.append("department", data.department);
  params.append("baseSalary", String(data.baseSalary));

  const res = await apiClient.post("/add-employee", params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// INCREMENT SALARY
// ─────────────────────────────────────────────────────────────────────────────
export const incrementSalary = async (
  payload: { employeeId: string; increment: number }[]
) => {
  const res = await apiClient.put("/increment-salaries", payload);
  return res.data;
};