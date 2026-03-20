import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePayroll } from '../../modules/payroll/usePayroll';
import PayrollTable from '../../modules/payroll/components/PayrollTable';
import { StatCard, Select, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import { MONTHS } from '../../constants';
import { formatCurrency } from '../../utils/helpers';

export default function MyPayslips() {
  const { user } = useAuth();
  const { payslips, monthPayslips, month, setMonth, year } = usePayroll(user?.id);

  const totalEarned = payslips.reduce((s, p) => s + p.netSalary, 0);
  const statCards = [
    { label: 'Total Payslips', value: payslips.length, icon: '📄', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'Total Earned (YTD)', value: formatCurrency(totalEarned), icon: '💰', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Latest Net Salary', value: payslips[0] ? formatCurrency(payslips[0].netSalary) : '—', icon: '📊', bg: 'bg-violet-50', text: 'text-violet-700' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Payslips"
        subtitle="View your salary and payslip history"
        action={
          <Select value={month} onChange={e => setMonth(e.target.value)} options={MONTHS.map(m => ({ value: m, label: m }))} className="w-40" />
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <Card padding={false}>
        <PayrollTable payslips={monthPayslips} showEmployee={false} />
      </Card>
    </div>
  );
}
