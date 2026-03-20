// src/pages/hr/HREmployees.tsx

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useUsers } from '../../modules/users/useUsers';
import { useDepartments } from '../../modules/departments/useDepartments';
import UserTable from '../../modules/users/components/UserTable';
import UserForm from '../../modules/users/components/UserForm';
import { Modal } from '../../components/ui';
import type { EmployeeRecord } from '../../service/Empolyee.service';

export default function HREmployees() {
  const {
    users, loading, error,
    refetch, search, setSearch,
  } = useUsers();

  const { departments } = useDepartments();

  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<EmployeeRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending'>('All');
  const [deptFilter,   setDeptFilter]   = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      if (u.role === 'admin') return false;
      const matchSearch = !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.empId ?? '').toLowerCase().includes(q) ||
        (u.designation ?? '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'All'    ? true :
        statusFilter === 'Active' ? !u.firstLogin :
        u.firstLogin;
      const matchDept = deptFilter === 'All' || u.department === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [users, search, statusFilter, deptFilter]);

  const handleClose = () => { setShowForm(false); setEditing(null); };
  const handleSuccess = (employee: EmployeeRecord) => {
    refetch();
    handleClose();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">View and manage employee records</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Employees</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {filtered.length} of {users.filter(u => u.role !== 'admin').length} employees
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus size={16} />
              Add Employee
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(['All', 'Active', 'Pending'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Department dropdown — name shown, _id as value */}
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="h-10 px-3 pr-8 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="All">All</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>
                  {d.departmentName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <UserTable
          users={filtered}
          onEdit={setEditing}
          canEdit
          canDelete={false}
          loading={loading}
        />
      </div>

      {(showForm || editing) && (
        <Modal title={editing ? 'Edit Employee' : 'Add Employee'} onClose={handleClose} size="lg">
          <UserForm
            initial={editing ?? undefined}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        </Modal>
      )}
    </div>
  );
}