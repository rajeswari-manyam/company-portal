import { useState, useMemo } from 'react';
import { Plus, Search, ChevronDown, MoreHorizontal, Mail, Phone, Users } from 'lucide-react';
import { useUsers } from '../../modules/users/useUsers';
import { useDepartments } from '../../modules/departments/useDepartments';
import UserForm from '../../modules/users/components/UserForm';
import { Modal } from '../../components/ui';
import type { EmployeeRecord } from '../../services/Empolyee.service';
import type { Department } from '../../data/store';

// ── Avatar initials circle ────────────────────────────────────────────────────
const BG_COLORS = [
  'from-violet-400 to-violet-600',
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-cyan-400 to-sky-600',
  'from-indigo-400 to-indigo-600',
];

function AvatarCircle({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const idx = name.charCodeAt(0) % BG_COLORS.length;
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${BG_COLORS[idx]} flex items-center justify-center shrink-0 text-white font-bold`}
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initials}
    </div>
  );
}

// ── Status dot ────────────────────────────────────────────────────────────────
function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white ${active ? 'bg-emerald-400' : 'bg-slate-300'}`}
    />
  );
}

// ── Employee Card ─────────────────────────────────────────────────────────────
function EmployeeCard({
  user,
  onEdit,
}: {
  user: any;
  onEdit: (u: any) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = !user.firstLogin;

  // Dept — hide raw MongoDB ObjectId
  const dept = user.department && !/^[a-f0-9]{24}$/i.test(user.department)
    ? user.department : null;

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer
                    transition-all duration-300 ease-out
                    hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-900/10
                    hover:border-[#69A6F0]/40">

      {/* ── Gradient accent bar — slides in on hover ── */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />

      {/* ── Card top ── */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          {/* Avatar + status dot */}
          <div className="relative transition-transform duration-300 group-hover:scale-110 origin-bottom-left">
            <AvatarCircle name={user.name} size={56} />
            <StatusDot active={isActive} />
          </div>

          {/* ⋯ menu */}
          <div className="relative transition-transform duration-300 group-hover:scale-110 origin-bottom-left">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-20 w-36 bg-white rounded-xl border border-slate-100 shadow-lg py-1 overflow-hidden">
                  <button
                    onClick={() => { onEdit(user); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    View Profile
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Name + designation */}
        <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-[#0B0E92] transition-colors duration-200">{user.name}</h3>
        <p className="text-sm text-slate-400 mt-0.5">{user.designation ?? '—'}</p>

        {/* Dept badge */}
        {dept && (
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-[#EEF0FF] text-[#0B0E92] text-[11px] font-semibold">
            {dept}
          </span>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-slate-50" />

      {/* ── Card details grid ── */}
      <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {/* Emp ID */}
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Emp ID</p>
          <p className="text-sm font-semibold text-slate-700">{user.empId ?? '—'}</p>
        </div>

        {/* Role */}
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Role</p>
          <p className="text-sm font-semibold text-slate-700 capitalize">{user.role ?? '—'}</p>
        </div>

        {/* Phone */}
        <div className="col-span-2 flex items-center gap-2">
          <Phone size={12} className="text-slate-300 shrink-0" />
          <p className="text-sm text-slate-600 truncate">{user.phone ?? '—'}</p>
        </div>

        {/* Email */}
        <div className="col-span-2 flex items-center gap-2">
          <Mail size={12} className="text-slate-300 shrink-0" />
          <p className="text-sm text-slate-600 truncate">{user.email ?? '—'}</p>
        </div>
      </div>

      {/* ── Status footer ── */}
      <div className={`px-5 py-2.5 flex items-center justify-between ${isActive ? 'bg-emerald-50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
          <span className={`text-xs font-semibold ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
            {isActive ? 'Active' : 'Pending'}
          </span>
        </div>
        <button
          onClick={() => onEdit(user)}
          className="text-xs text-[#0B0E92] font-semibold hover:underline"
        >
          Edit →
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HREmployees() {
  const { users, loading, error, refetch, search, setSearch } = useUsers();
  const { departments } = useDepartments();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmployeeRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending'>('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      if (u.role === 'admin') return false;
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.empId ?? '').toLowerCase().includes(q) ||
        (u.designation ?? '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'All' ? true :
          statusFilter === 'Active' ? !u.firstLogin :
            u.firstLogin;
      const matchDept = deptFilter === 'All' || u.department === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [users, search, statusFilter, deptFilter]);

  const handleClose = () => { setShowForm(false); setEditing(null); };
  const handleSuccess = (_emp: EmployeeRecord) => { refetch(); handleClose(); };
  const nonAdminTotal = users.filter(u => u.role !== 'admin').length;

  return (
    <div className="space-y-6">

      {/* ── Page heading ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
        <p className="text-sm text-slate-400 mt-0.5">View and manage all employee records</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* Left: count */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EEF0FF] flex items-center justify-center">
              <Users size={15} className="text-[#0B0E92]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Employees</p>
              <p className="text-[11px] text-slate-400">{filtered.length} of {nonAdminTotal} total</p>
            </div>
          </div>

          {/* Right: Add button */}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                       bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white text-sm font-semibold
                       shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">

          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                         transition-all bg-slate-50"
            />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['All', 'Active', 'Pending'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${statusFilter === s
                  ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}>{s}</button>
            ))}
          </div>

          {/* Dept filter */}
          <div className="relative transition-transform duration-300 group-hover:scale-110 origin-bottom-left">
            <select
              value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 text-sm text-slate-700
                         bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20
                         focus:border-[#0B0E92] transition-all cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departments.map((d: Department) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded-lg" />
                <div className="h-3 bg-slate-100 rounded-lg w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Users size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No employees found</p>
          <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
        </div>
      )}

      {/* ── Cards grid ── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(user => (
            <EmployeeCard
              key={(user as any)._id ?? (user as any).id}
              user={user}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {(showForm || editing) && (
        <Modal title={editing ? 'Edit Employee' : 'Add Employee'} onClose={handleClose} size="lg">
          <UserForm initial={editing ?? undefined} onSuccess={handleSuccess} onCancel={handleClose} />
        </Modal>
      )}
    </div>
  );
}