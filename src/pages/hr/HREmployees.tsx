import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useUsers } from '../../modules/users/useUsers';
import { useDepartments } from '../../modules/departments/useDepartments';
import UserForm from '../../modules/users/components/UserForm';
import { Modal } from '../../components/ui';
import type { EmployeeRecord } from '../../service/Empolyee.service';
import type { Department } from '../../service/departmentApi';

const ITEMS_PER_PAGE = 10;

export default function HREmployeesTable() {
  const { users, loading, error, refetch, search, setSearch } = useUsers();
  const { departments } = useDepartments();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmployeeRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending'>('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [page, setPage] = useState(1);

  // Filter users
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (u.role === 'admin') return false;
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.empId ?? '').toLowerCase().includes(q) ||
        (u.designation ?? '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Active'
            ? !u.firstLogin
            : u.firstLogin;
      const matchDept =
        deptFilter === 'All' ||
        u.department === deptFilter ||
        departments.some(
          (d: Department) =>
            (d.id === deptFilter || (d as any)._id === deptFilter) &&
            (u.department === d.id || u.department === (d as any)._id)
        );
      return matchSearch && matchStatus && matchDept;
    });
  }, [users, search, statusFilter, deptFilter, departments]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const handleClose = () => {
    setShowForm(false);
    setEditing(null);
  };
  const handleSuccess = (_emp: EmployeeRecord) => {
    refetch();
    handleClose();
  };
  const nonAdminTotal = users.filter((u) => u.role !== 'admin').length;

  return (
    <div className="space-y-6">
      {/* ── Heading ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          View and manage all employee records
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-800">Employees: {filtered.length} of {nonAdminTotal}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="pl-9 pr-4 h-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['All', 'Active', 'Pending'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${statusFilter === s
                  ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Add Employee */}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {!loading && paginatedUsers.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="px-4 py-3 font-medium text-slate-500">Phone</th>
                <th className="px-4 py-3 font-medium text-slate-500">Department</th>
                <th className="px-4 py-3 font-medium text-slate-500">Role</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => {
                const isActive = !user.firstLogin;
                return (
                  <tr key={(user as any)._id ?? (user as any).id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">{user.name}</td>
                    <td className="px-4 py-3">{user.email ?? '—'}</td>
                    <td className="px-4 py-3">{user.phone ?? '—'}</td>
                    {/* Display department name */}
                    <td className="px-4 py-3">
                      {departments.find(
                        (d: Department) =>
                          d.id === user.department || (d as any)._id === user.department
                      )?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 capitalize">{user.role ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {isActive ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditing(user)}
                        className="text-blue-600 text-sm font-semibold hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 mt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center gap-3">
          <p className="text-slate-500 font-medium">No employees found</p>
          <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {(showForm || editing) && (
        <Modal title={editing ? 'Edit Employee' : 'Add Employee'} onClose={handleClose} size="lg">
          <UserForm initial={editing ?? undefined} onSuccess={handleSuccess} onCancel={handleClose} role="employee" />
        </Modal>
      )}
    </div>
  );
}