import {
  getAllPayslips, getPayslipsForUser, generatePayslip,
  type Payslip
} from '../../data/store';

export const PayrollService = {
  getAll: () => getAllPayslips(),
  getForUser: (userId: string) => getPayslipsForUser(userId),

  getForMonth: (month: string, year: number) =>
    getAllPayslips().filter(p => p.month === month && p.year === year),

  generate: (userId: string, month: string, year: number) =>
    generatePayslip(userId, month, year),

  generateForAll: (userIds: string[], month: string, year: number) => {
    const existing = getAllPayslips().filter(p => p.month === month && p.year === year);
    const existingIds = new Set(existing.map(p => p.userId));
    userIds.forEach(id => {
      if (!existingIds.has(id)) generatePayslip(id, month, year);
    });
  },

  getTotalNetSalary: (payslips: Payslip[]) =>
    payslips.reduce((s, p) => s + p.netSalary, 0),

  getStats: (payslips: Payslip[], totalEmployees: number) => {
    const total = payslips.reduce((s, p) => s + p.netSalary, 0);
    return {
      total,
      count: payslips.length,
      avg: payslips.length ? Math.round(total / payslips.length) : 0,
      employees: totalEmployees,
    };
  },
};
