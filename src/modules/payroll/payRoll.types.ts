export interface MyPayslip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  amountCredited: number;
  createdAt: string | null;
  name: string;
  department: string;
  baseSalary: number;
  status?: string;
}