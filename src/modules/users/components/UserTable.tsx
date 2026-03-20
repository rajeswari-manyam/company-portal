// src/modules/users/components/UserTable.tsx
// ✅ Fix: EmployeeRecord imported from '../../../service/Empolyee.service' (correct path, not departmentApi)

import React, { useState } from 'react';
import { Eye, Edit2, Trash2, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EmployeeRecord } from "../../../services/Empolyee.service";
import { useDepartments } from '../../departments/useDepartments';

const PAGE_SIZE = 5;

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700', 'bg-cyan-100 text-cyan-700',
];
function getAvatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
function getInitials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

function StatusBadge({ firstLogin }: { firstLogin: boolean }) {
  return firstLogin ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Pending</span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    hr:    'bg-[#EEF0FF] text-[#0B0E92] border-[#0B0E92]/20',
    employee: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[role] ?? styles.employee}`}>
      {role}
    </span>
  );
}

type ProfileTab = 'Personal' | 'Job';

function ProfileModal({ employee, getDeptName, onClose }: {
  employee: EmployeeRecord; getDeptName: (id?: string) => string; onClose: () => void;
}) {
  const [tab, setTab] = useState<ProfileTab>('Personal');
  function Field({ label, value }: { label: string; value?: string }) {
    return (
      <div className="flex flex-col gap-0.5 py-3 border-b border-slate-50 last:border-0">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className="text-sm text-slate-800 font-medium">{value || '—'}</span>
      </div>
    );
  }
  const deptName = getDeptName(employee.department);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]" />
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">✕</button>
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold text-slate-800 mb-5">Employee Profile</h2>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${getAvatarColor(employee.name)}`}>
              {getInitials(employee.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-slate-800">{employee.name}</h3>
                <StatusBadge firstLogin={employee.firstLogin} />
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {[employee.designation, deptName !== '—' ? deptName : null].filter(Boolean).join(' · ') || 'No designation'}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-xs text-slate-400">✉ {employee.email}</span>
                {employee.phone && <span className="text-xs text-slate-400">📞 {employee.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-1 border-b border-slate-100">
            {(['Personal', 'Job'] as ProfileTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                  tab === t ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="px-6 pb-6 max-h-72 overflow-y-auto">
          {tab === 'Personal' && (
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="Employee ID" value={employee.empId} />
              <Field label="Full Name"   value={employee.name} />
              <Field label="Email"       value={employee.email} />
              <Field label="Phone"       value={employee.phone} />
              <Field label="Gender"      value={employee.gender} />
              <Field label="Date of Birth" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined} />
              <Field label="Address"     value={employee.address} />
            </div>
          )}
          {tab === 'Job' && (
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="Employee ID"     value={employee.empId} />
              <Field label="Role"            value={employee.role} />
              <Field label="Department"      value={deptName} />
              <Field label="Designation"     value={employee.designation} />
              <Field label="Date of Joining" value={employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined} />
              <Field label="Status"          value={employee.firstLogin ? 'Pending' : 'Active'} />
              <Field label="Created At"      value={new Date(employee.createdAt).toLocaleDateString('en-IN')} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({ total, page, pageSize, onPageChange }: {
  total: number; page: number; pageSize: number; onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  const pages: (number | 'ellipsis')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if ((i === page - 2 && page - 2 > 1) || (i === page + 2 && page + 2 < totalPages)) pages.push('ellipsis');
  }
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
      <p className="text-xs text-slate-400">
        Showing <span className="font-semibold text-slate-600">{from}–{to}</span> of{' '}
        <span className="font-semibold text-slate-600">{total}</span> employees
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={15} />
        </button>
        {pages.map((p, idx) => p === 'ellipsis'
          ? <span key={`e-${idx}`} className="px-1.5 text-xs text-slate-400">…</span>
          : <button key={p} onClick={() => onPageChange(p)}
              className={`min-w-[30px] h-[30px] rounded-lg text-xs font-medium transition-all duration-200 ${
                p === page ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}>{p}</button>
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

function MobileCard({ user, onView, onEdit, onDelete, canEdit, canDelete, getDeptName }: {
  user: EmployeeRecord; onView: () => void;
  onEdit?: (u: EmployeeRecord) => void; onDelete?: (u: EmployeeRecord) => void;
  canEdit: boolean; canDelete: boolean; getDeptName: (id?: string) => string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-0.5 w-full bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarColor(user.name)}`}>
              {getInitials(user.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <StatusBadge firstLogin={user.firstLogin} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { label: 'ID',          value: user.empId ?? '—' },
            { label: 'Department',  value: getDeptName(user.department) },
            { label: 'Designation', value: user.designation ?? '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{value}</p>
            </div>
          ))}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Role</p>
            <div className="mt-0.5"><RoleBadge role={user.role} /></div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
          <button onClick={onView}
            className="flex-1 h-8 rounded-lg border border-slate-200 text-xs font-medium text-slate-600
                       hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
            <Eye size={12} /> View
          </button>
          {canEdit && onEdit && (
            <button onClick={() => onEdit(user)}
              className="flex-1 h-8 rounded-lg bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                         text-white text-xs font-medium shadow-sm hover:shadow-md hover:scale-[1.02]
                         transition-all duration-150 flex items-center justify-center gap-1.5">
              <Edit2 size={12} /> Edit
            </button>
          )}
          {canDelete && onDelete && (
            <button onClick={() => onDelete(user)}
              className="flex-1 h-8 rounded-lg bg-gradient-to-r from-rose-500 to-rose-400
                         text-white text-xs font-medium shadow-sm hover:shadow-md hover:scale-[1.02]
                         transition-all duration-150 flex items-center justify-center gap-1.5">
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface UserTableProps {
  users: EmployeeRecord[];
  onEdit?:    (user: EmployeeRecord) => void;
  onDelete?:  (user: EmployeeRecord) => void;
  canEdit?:   boolean;
  canDelete?: boolean;
  loading?:   boolean;
}

export default function UserTable({ users, onEdit, onDelete, canEdit = true, canDelete = true, loading = false }: UserTableProps) {
  const [viewing, setViewing] = useState<EmployeeRecord | null>(null);
  const [page, setPage]       = useState(1);
  React.useEffect(() => { setPage(1); }, [users]);
  const { getDeptName } = useDepartments();

  if (loading) return (
    <div className="space-y-3 p-4">
      {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
    </div>
  );
  if (users.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <span className="text-4xl mb-3">👤</span>
      <p className="text-sm font-medium">No employees found</p>
    </div>
  );

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const safePage   = Math.min(page, totalPages);
  const paginated  = users.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-3 p-4">
        {paginated.map(user => (
          <MobileCard key={user._id} user={user} onView={() => setViewing(user)}
            onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} getDeptName={getDeptName} />
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Employee','ID','Department','Designation','Role','Status','Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.map(user => (
              <tr key={user._id} className="hover:bg-[#EEF0FF]/30 transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarColor(user.name)}`}>
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4"><span className="text-sm text-slate-600 font-mono">{user.empId ?? '—'}</span></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <span>🏢</span><span>{getDeptName(user.department)}</span>
                  </div>
                </td>
                <td className="px-5 py-4"><span className="text-sm text-slate-600">{user.designation ?? '—'}</span></td>
                <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                <td className="px-5 py-4"><StatusBadge firstLogin={user.firstLogin} /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewing(user)} title="View"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Eye size={15} />
                    </button>
                    {canEdit && onEdit && (
                      <button onClick={() => onEdit(user)} title="Edit"
                        className="p-1.5 rounded-lg bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                                   text-white shadow-sm hover:shadow-md hover:scale-110 transition-all duration-150">
                        <Edit2 size={13} />
                      </button>
                    )}
                    <button title="Manage role"
                      className="p-1.5 rounded-lg hover:bg-[#EEF0FF] text-slate-400 hover:text-[#0B0E92] transition-colors">
                      <UserCheck size={15} />
                    </button>
                    {canDelete && onDelete && (
                      <button onClick={() => onDelete(user)} title="Delete"
                        className="p-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-400
                                   text-white shadow-sm hover:shadow-md hover:scale-110 transition-all duration-150">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination total={users.length} page={safePage} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {viewing && (
        <ProfileModal employee={viewing} getDeptName={getDeptName} onClose={() => setViewing(null)} />
      )}
    </>
  );
}