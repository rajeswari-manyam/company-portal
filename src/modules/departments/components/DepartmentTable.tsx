import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Table } from '../../../components/ui';
import type { Column } from '../../../components/ui/Table';
import type { Department } from '../../../data/store';
import { formatDate } from '../../../utils/helpers';

interface DepartmentTableProps {
  departments: Department[];
  onEdit?: (dept: Department) => void;
  onDelete?: (dept: Department) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function DepartmentTable({ departments, onEdit, onDelete, canEdit = true, canDelete = true }: DepartmentTableProps) {
  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'Department',
      render: (d) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EEF0FF] flex items-center justify-center text-lg">🏢</div>
          <div>
            <p className="font-semibold text-slate-800">{d.name}</p>
            <p className="text-xs text-slate-400">{d.employeeCount} employees</p>
          </div>
        </div>
      ),
    },
    { key: 'head', header: 'Department Head' },
    { key: 'description', header: 'Description' },
    
    {key:'employeeCount',header:'employeeCount',render:(d)=>(<p>{d.employeeCount}</p>)},
    {key:'weekOffDays',header:'weekOffDays',render:(d)=>(<p>{d.weekOffDays}</p>)},
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <div className="flex items-center gap-1">
          {canEdit && onEdit && (
            <button onClick={() => onEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
              <Edit2 size={15} />
            </button>
          )}
          {canDelete && onDelete && (
            <button onClick={() => onDelete(d)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table<Department>
      columns={columns}
      data={departments}
      keyExtractor={(d) => d.id}
      emptyMessage="No departments found"
      emptyIcon="🏢"
    />
  );
}
