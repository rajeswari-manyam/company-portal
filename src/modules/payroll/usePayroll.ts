import { useState, useCallback } from 'react';
import { PayrollService } from './PayrollService';
import { getUsers } from '../../data/store';
import type { Payslip } from '../../types';
import { MONTHS } from '../../constants';
import toast from 'react-hot-toast';

export function usePayroll(userId?: string) {
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year] = useState(new Date().getFullYear());

  const load = useCallback(() =>
    userId ? PayrollService.getForUser(userId) : PayrollService.getAll(),
    [userId]
  );

  const [payslips, setPayslips] = useState<Payslip[]>(load);
  const refresh = useCallback(() => setPayslips(load()), [load]);

  const employees = getUsers().filter(u => u.role === 'employee');

  const monthPayslips = userId
    ? payslips.filter(p => p.month === month && p.year === year)
    : PayrollService.getForMonth(month, year);

  const stats = PayrollService.getStats(monthPayslips, employees.length);

  const generateAll = async () => {
    PayrollService.generateForAll(employees.map(e => e.id), month, year);
    refresh();
    toast.success(`Payslips generated for ${employees.length} employees`);
  };

  const generateOne = async (empUserId: string) => {
    PayrollService.generate(empUserId, month, year);
    refresh();
    toast.success('Payslip generated');
  };

  return { payslips, monthPayslips, month, setMonth, year, stats, generateAll, generateOne, refresh, employees };
}
