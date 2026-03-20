import React from 'react';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { Table, Badge, Avatar } from '../../../components/ui';
import type { Column } from '../../../components/ui/Table';
import type { UserRecord } from '../../../types';
import { formatDate } from '../../../utils/helpers';

interface UserTableProps {
  users: UserRecord[];
  onEdit?: (user: UserRecord) => void;
  onDelete?: (user: UserRecord) => void;
  onView?: (user: UserRecord) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function UserTable({ users, onEdit, onDelete, onView, canEdit = true, canDelete = true }: UserTableProps) {
  const columns: Column<UserRecord>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <div>
            <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
            <p className="text-xs text-slate-400">{u.employeeId}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'department', header: 'Department' },
    { key: 'designation', header: 'Designation' },
    { key: 'role', header: 'Role', render: (u) => <Badge status={u.role} /> },
    { key: 'status', header: 'Status', render: (u) => <Badge status={u.status} /> },
    { key: 'joinDate', header: 'Join Date', render: (u) => formatDate(u.joinDate) },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-1">
          {onView && (
            <button onClick={() => onView(u)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              <Eye size={15} />
            </button>
          )}
          {canEdit && onEdit && (
            <button onClick={() => onEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
              <Edit2 size={15} />
            </button>
          )}
          {canDelete && onDelete && (
            <button onClick={() => onDelete(u)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table<UserRecord>
      columns={columns}
      data={users}
      keyExtractor={(u) => u.id}
      emptyMessage="No users found"
      emptyIcon="👤"
    />
  );
}
