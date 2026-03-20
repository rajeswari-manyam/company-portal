import React from 'react';
import { usePayroll } from '../../modules/payroll/usePayroll';
import PayrollTable from '../../modules/payroll/components/PayrollTable';
import { StatCard, Select, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import { MONTHS } from '../../constants';
import { formatCurrency } from '../../utils/helpers';
import { Plus } from 'lucide-react';

export default function HRPayroll() {
  const { monthPayslips, month, setMonth, stats, generateAll } = usePayroll();

  const statCards = [
    { label: 'Total Payroll', value: formatCurrency(stats.total), icon: '💰', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Employees', value: stats.employees, icon: '👥', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'Payslips', value: stats.count, icon: '📄', bg: 'bg-violet-50', text: 'text-violet-700' },
    { label: 'Avg Salary', value: stats.avg ? formatCurrency(stats.avg) : '—', icon: '📊', bg: 'bg-amber-50', text: 'text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        subtitle="Generate and view employee payslips"
        action={
          <div className="flex gap-2">
            <Select value={month} onChange={e => setMonth(e.target.value)} options={MONTHS.map(m => ({ value: m, label: m }))} className="w-40" />
            <Button icon={<Plus size={16} />} onClick={generateAll}>Generate All</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <Card padding={false}>
        <PayrollTable payslips={monthPayslips} showEmployee />
      </Card>
    </div>
  );
}
