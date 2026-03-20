// src/pages/admin/AdminEmployees.tsx

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useUsers } from '../../modules/users/useUsers';
import { useDepartments } from '../../modules/departments/useDepartments';
import UserTable from '../../modules/users/components/UserTable';
import UserForm from '../../modules/users/components/UserForm';
import { Modal, ConfirmDialog } from '../../components/ui';
import type { EmployeeRecord } from "../../services/Empolyee.service";
import type { Department } from '../../data/store';

export default function AdminEmployees() {
  const { users, loading, error, deleteUser, refetch, search, setSearch } = useUsers();
  const { departments } = useDepartments();

  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<EmployeeRecord | null>(null);
  const [deleting,     setDeleting]     = useState<EmployeeRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending'>('All');
  const [deptFilter,   setDeptFilter]   = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
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

  const handleClose   = () => { setShowForm(false); setEditing(null); };
  const handleSuccess = (employee: EmployeeRecord) => {
    console.group('%c[AdminEmployees] Saved', 'color:#10b981;font-weight:bold');
    console.log(employee);
    console.groupEnd();
    refetch();
    handleClose();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage all users and their roles</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Employees</h2>
              <p className="text-sm text-slate-400 mt-0.5">{filtered.length} of {users.length} employees</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                         text-white text-sm font-semibold shadow-md
                         hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={16} /> Add Employee
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                           transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(['All', 'Active', 'Pending'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    statusFilter === s
                      ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}>{s}</button>
              ))}
            </div>

            {/* ✅ Fix: explicit type annotation (d: Department) — no implicit any */}
            <select
              value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="h-10 px-3 pr-8 rounded-xl border border-slate-200 text-sm text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                         bg-white transition-all duration-200"
            >
              <option value="All">All</option>
              {departments.map((d: Department) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <UserTable users={filtered} onEdit={setEditing} onDelete={setDeleting} canEdit canDelete loading={loading} />
      </div>

      {(showForm || editing) && (
        <Modal title={editing ? 'Edit Employee' : 'Add Employee'} onClose={handleClose} size="lg">
          <UserForm initial={editing ?? undefined} onSuccess={handleSuccess} onCancel={handleClose} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Are you sure you want to delete ${deleting.name}? This action cannot be undone.`}
          onConfirm={async () => { await deleteUser(deleting._id); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}