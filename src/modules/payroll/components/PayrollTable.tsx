import React from 'react';
import { Table, Badge } from '../../../components/ui';
import type { Column } from '../../../components/ui/Table';
import type { Payslip } from '../../../types';
import { formatCurrency } from '../../../utils/helpers';

interface PayrollTableProps {
  payslips: Payslip[];
  showEmployee?: boolean;
}

export default function PayrollTable({ payslips, showEmployee = true }: PayrollTableProps) {
  const columns: Column<Payslip>[] = [
    ...(showEmployee ? [{
      key: 'userName',
      header: 'Employee',
      render: (p: Payslip) => <span className="font-semibold text-slate-800">{p.userName}</span>,
    }] : []),
    { key: 'month', header: 'Period', render: (p) => `${p.month} ${p.year}` },
    { key: 'basicSalary', header: 'Basic', render: (p) => formatCurrency(p.basicSalary) },
    { key: 'hra', header: 'HRA', render: (p) => formatCurrency(p.hra) },
    { key: 'allowances', header: 'Allowances', render: (p) => formatCurrency(p.allowances) },
    { key: 'deductions', header: 'Deductions', render: (p) => <span className="text-red-600">-{formatCurrency(p.deductions)}</span> },
    { key: 'netSalary', header: 'Net Salary', render: (p) => <span className="font-bold text-emerald-700">{formatCurrency(p.netSalary)}</span> },
    { key: 'status', header: 'Status', render: (p) => <Badge status={p.status} /> },
  ];

  return (
    <Table<Payslip>
      columns={columns}
      data={payslips}
      keyExtractor={(p) => p.id}
      emptyMessage='No payslips found. Click "Generate All" to create payslips.'
      emptyIcon="💰"
    />
  );
}
