// src/pages/admin/AdminEmployees.tsx

import { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useUsers } from '../../modules/users/useUsers';
import { useDepartments } from '../../modules/departments/useDepartments';
import UserTable from '../../modules/users/components/UserTable';
import UserForm from '../../modules/users/components/UserForm';
import { Modal, ConfirmDialog } from '../../components/ui';
import type { EmployeeRecord } from "../../service/Empolyee.service";
import type { Department } from '../../service/departmentApi';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const ROLE_OPTIONS = ['employee', 'hr'] as const;
type RoleOption = typeof ROLE_OPTIONS[number];

export default function AdminEmployees() {
  const { users, loading, error, deleteUser, refetch, search, setSearch } = useUsers();
  const { departments } = useDepartments();

  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<EmployeeRecord | null>(null);
  const [deleting,     setDeleting]     = useState<EmployeeRecord | null>(null);
  const [newRole,      setNewRole]      = useState<RoleOption>('employee'); // ✅ role for new user
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending'>('All');
  const [deptFilter,   setDeptFilter]   = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);

  // Reset to page 1 whenever filters/search change
  const resetPage = () => setCurrentPage(1);

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

  // Derived pagination values
  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage    = Math.min(currentPage, totalPages);
  const startIndex  = (safePage - 1) * pageSize;
  const paginated   = filtered.slice(startIndex, startIndex + pageSize);

  // Page number window (max 5 visible page buttons)
  const pageWindow = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, safePage - delta);
      i <= Math.min(totalPages, safePage + delta);
      i++
    ) range.push(i);
    return range;
  }, [safePage, totalPages]);

  const handleClose   = () => { setShowForm(false); setEditing(null); };
  const handleSuccess = (employee: EmployeeRecord) => {
    console.group('%c[AdminEmployees] Saved', 'color:#10b981;font-weight:bold');
    console.log(employee);
    console.groupEnd();
    refetch();
    handleClose();
  };

  const handleSearchChange   = (val: string)                    => { setSearch(val);       resetPage(); };
  const handleStatusChange   = (s: 'All' | 'Active' | 'Pending') => { setStatusFilter(s); resetPage(); };
  const handleDeptChange     = (val: string)                    => { setDeptFilter(val);   resetPage(); };
  const handlePageSizeChange = (val: number)                    => { setPageSize(val);     resetPage(); };

  // Derived role for the open modal:
  // - editing: use the existing employee's role (cast to RoleOption, fallback to 'employee')
  // - adding:  use newRole picker
  const activeRole: RoleOption =
    editing
      ? ((editing.role === 'hr' ? 'hr' : 'employee') as RoleOption)
      : newRole;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Employee Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage all users and their roles</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">

          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">Employees</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {filtered.length} of {users.length} employees
              </p>
            </div>

            {/* Add button + role picker */}
            <div className="shrink-0 flex items-center gap-2">
              {/* Role picker — only shown when NOT editing */}
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as RoleOption)}
                className="h-9 sm:h-10 px-3 pr-8 rounded-xl border border-slate-200
                           text-xs sm:text-sm text-slate-700
                           focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                           bg-white transition-all duration-200"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>

              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 sm:gap-2
                           px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl
                           bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                           text-white text-xs sm:text-sm font-semibold shadow-md
                           hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <Plus size={14} className="sm:hidden" />
                <Plus size={16} className="hidden sm:block" />
                <span className="hidden xs:inline">
                  Add {newRole === 'hr' ? 'HR' : 'Employee'}
                </span>
                <span className="xs:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">

            {/* Search */}
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-9 pr-4 h-9 sm:h-10 rounded-xl border border-slate-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                           transition-all duration-200"
              />
            </div>

            {/* Status filter + dept filter row on mobile */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status pill group */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                {(['All', 'Active', 'Pending'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium
                                transition-all duration-200 ${
                      statusFilter === s
                        ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >{s}</button>
                ))}
              </div>

              {/* Department select */}
              <select
                value={deptFilter}
                onChange={e => handleDeptChange(e.target.value)}
                className="h-9 sm:h-10 px-3 pr-8 rounded-xl border border-slate-200
                           text-xs sm:text-sm text-slate-700
                           focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                           bg-white transition-all duration-200"
              >
                <option value="All">All Departments</option>
                {departments.map((d: Department) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <UserTable
          users={paginated}
          onEdit={setEditing}
          onDelete={setDeleting}
          canEdit
          canDelete
          loading={loading}
        />

        {/* Pagination footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100
                          flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            {/* Rows per page + info */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
              <span className="hidden sm:inline">Rows per page:</span>
              <span className="sm:hidden">Per page:</span>
              <select
                value={pageSize}
                onChange={e => handlePageSizeChange(Number(e.target.value))}
                className="h-8 px-2 rounded-lg border border-slate-200 text-xs sm:text-sm
                           text-slate-700 bg-white focus:outline-none
                           focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]"
              >
                {PAGE_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-slate-400">
                {startIndex + 1}–{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length}
              </span>
            </div>

            {/* Page controls */}
            <div className="flex items-center gap-1 justify-center sm:justify-end">
              {/* First */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="First page"
              >
                <ChevronsLeft size={16} />
              </button>

              {/* Prev */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page number buttons */}
              {pageWindow[0] > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="min-w-[32px] h-8 px-2 rounded-lg text-xs sm:text-sm text-slate-600
                               hover:bg-slate-100 transition-all"
                  >1</button>
                  {pageWindow[0] > 2 && (
                    <span className="px-1 text-slate-400 text-sm">…</span>
                  )}
                </>
              )}

              {pageWindow.map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-xs sm:text-sm font-medium
                              transition-all duration-150 ${
                    p === safePage
                      ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >{p}</button>
              ))}

              {pageWindow[pageWindow.length - 1] < totalPages && (
                <>
                  {pageWindow[pageWindow.length - 1] < totalPages - 1 && (
                    <span className="px-1 text-slate-400 text-sm">…</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="min-w-[32px] h-8 px-2 rounded-lg text-xs sm:text-sm text-slate-600
                               hover:bg-slate-100 transition-all"
                  >{totalPages}</button>
                </>
              )}

              {/* Next */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>

              {/* Last */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Last page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(showForm || editing) && (
        <Modal
          title={editing ? `Edit ${activeRole === 'hr' ? 'HR' : 'Employee'}` : `Add ${newRole === 'hr' ? 'HR' : 'Employee'}`}
          onClose={handleClose}
          size="lg"
        >
          <UserForm
            initial={editing ?? undefined}
            onSuccess={handleSuccess}
            onCancel={handleClose}
            role={activeRole}
          />
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