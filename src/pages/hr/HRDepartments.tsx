// src/pages/hr/HRDepartments.tsx

import { useState } from 'react';
import { Plus, Search, Building2, Users, UserCircle2, Edit2, X, Mail, Phone, Briefcase, ChevronRight } from 'lucide-react';
import { useDepartments } from '../../modules/departments/useDepartments';
import { useUsers } from '../../modules/users/useUsers';
import DepartmentForm from '../../modules/departments/components/DepartmentForm';
import { Modal } from '../../components/ui';
import type { Department } from '../../data/store';
import type { EmployeeRecord } from '../../modules/users/useUsers';

const ICON_GRADIENTS = [
  'from-[#0B0E92] to-[#69A6F0]',
  'from-[#0B6E92] to-[#69EAF0]',
  'from-[#6B0B92] to-[#C469F0]',
  'from-[#0B9245] to-[#69F0A6]',
  'from-[#92610B] to-[#F0C469]',
  'from-[#920B3A] to-[#F06990]',
];

function getGradient(i: number) {
  return ICON_GRADIENTS[i % ICON_GRADIENTS.length];
}

// ─── Employee Avatar (initials) ────────────────────────────────────────────────

function EmployeeAvatar({ emp, gradient }: { emp: EmployeeRecord; gradient: string }) {
  const initials = emp.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient}
                     flex items-center justify-center shrink-0 shadow-sm`}>
      <span className="text-white text-sm font-bold">{initials}</span>
    </div>
  );
}

// ─── Employee Drawer ───────────────────────────────────────────────────────────

function DepartmentEmployeesDrawer({
  dept,
  employees,
  gradient,
  onClose,
}: {
  dept: Department;
  employees: EmployeeRecord[];
  gradient: string;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${gradient} p-6 text-white shrink-0`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight">{dept.name}</h2>
                {dept.head && (
                  <p className="text-white/75 text-xs mt-0.5">Manager: {dept.head}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {dept.description && (
            <p className="text-white/80 text-sm mt-3 leading-relaxed">{dept.description}</p>
          )}

          <div className="mt-4">
            <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5">
              <Users size={13} />
              <span className="text-sm font-semibold">
                {employees.length} employee{employees.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient}
                               opacity-20 flex items-center justify-center`}>
                <Users size={26} className="text-white" />
              </div>
              <p className="text-sm font-medium text-slate-500">No employees in this department</p>
            </div>
          ) : (
            employees.map(emp => (
              <div
                key={emp._id}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100
                           hover:border-slate-200 hover:shadow-sm bg-white transition-all duration-200"
              >
                <EmployeeAvatar emp={emp} gradient={gradient} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>

                  {emp.designation && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Briefcase size={11} className="text-slate-400 shrink-0" />
                      <p className="text-xs text-slate-500 truncate">{emp.designation}</p>
                    </div>
                  )}
                  {emp.email && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail size={11} className="text-slate-400 shrink-0" />
                      <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                    </div>
                  )}
                  {emp.phone && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone size={11} className="text-slate-400 shrink-0" />
                      <p className="text-xs text-slate-400 truncate">{emp.phone}</p>
                    </div>
                  )}
                </div>

                {emp.role && (
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full
                                   bg-slate-100 text-slate-500 capitalize">
                    {emp.role}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── Department Card ───────────────────────────────────────────────────────────

function DepartmentCard({
  dept,
  index,
  onEdit,
  onClick,
  canEdit,
}: {
  dept: Department;
  index: number;
  onEdit: (d: Department) => void;
  onClick: (d: Department) => void;
  canEdit: boolean;
}) {
  const gradient = getGradient(index);

  return (
    <div
      onClick={() => onClick(dept)}
      className="group relative bg-white rounded-2xl border border-slate-100 p-6
                 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                 overflow-hidden flex flex-col gap-5 cursor-pointer"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.035]
                       transition-opacity duration-300 bg-gradient-to-br ${gradient}
                       pointer-events-none rounded-2xl`} />

      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient}
                         flex items-center justify-center shadow-md shrink-0`}>
          <Building2 size={22} className="text-white" />
        </div>

        <div className="flex items-center gap-1.5">
          {canEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(dept); }}
              title="Edit department"
              className="opacity-0 group-hover:opacity-100 p-2 rounded-xl
                         bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                         text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95
                         transition-all duration-150"
            >
              <Edit2 size={14} />
            </button>
          )}
          <span className="opacity-0 group-hover:opacity-60 p-2 rounded-xl
                           bg-slate-100 text-slate-500 transition-all duration-150">
            <ChevronRight size={14} />
          </span>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-semibold text-slate-800 leading-snug">{dept.name}</h3>
        {dept.description && (
          <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">{dept.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Users size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-700">{dept.employeeCount ?? 0}</span>
          <span>employees</span>
        </div>
        {dept.head && (
          <div className="flex items-center gap-1.5 text-sm text-slate-500 min-w-0">
            <UserCircle2 size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">
              Manager: <span className="font-semibold text-slate-700">{dept.head}</span>
            </span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-300 group-hover:text-slate-400 transition-colors -mt-3">
        Click to view employees
      </p>

      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </div>
  );
}

// ─── Skeleton & Empty ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0]
                      flex items-center justify-center opacity-20">
        <Building2 size={30} className="text-white" />
      </div>
      <p className="text-sm font-medium text-slate-500">No departments found</p>
      <p className="text-xs text-slate-400">Try adjusting your search</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-2/3 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-3 w-full rounded-lg bg-slate-100 animate-pulse" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="h-3 w-24 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-3 w-28 rounded-lg bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HRDepartments() {
  const { filtered, search, setSearch, createDepartment, updateDepartment, loading } = useDepartments();

  // ✅ Re-uses your existing useUsers hook — zero new files created
  const { users } = useUsers();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [viewing, setViewing] = useState<Department | null>(null);

  const handleClose = () => { setShowForm(false); setEditing(null); };
  const handleDrawerClose = () => setViewing(null);

  // Match employees by their `department` ObjectId against dept._id (dept.id)
  const deptEmployees = viewing
    ? users.filter(u => u.department === viewing.id)
    : [];

  const viewingIndex = viewing
    ? filtered.findIndex(d => d.id === viewing.id)
    : 0;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} department{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto
                     px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                     text-white text-sm font-semibold shadow-md
                     hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus size={16} /> Add Department
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search departments…"
          className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                     transition-all duration-200"
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {loading ? (
          [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((dept: Department, i: number) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              index={i}
              onEdit={setEditing}
              onClick={setViewing}
              canEdit
            />
          ))
        )}
      </div>

      {/* Add / Edit modal */}
      {(showForm || editing) && (
        <Modal title={editing ? 'Edit Department' : 'Add Department'} onClose={handleClose}>
          <DepartmentForm
            initial={editing ?? undefined}
            onSubmit={async data => {
              const ok = editing
                ? await updateDepartment(editing.id, data)
                : await createDepartment(data);
              if (ok) handleClose();
              return ok;
            }}
            onCancel={handleClose}
          />
        </Modal>
      )}

      {/* Employee details drawer — opens on card click */}
      {viewing && (
        <DepartmentEmployeesDrawer
          dept={viewing}
          employees={deptEmployees}
          gradient={getGradient(viewingIndex)}
          onClose={handleDrawerClose}
        />
      )}
    </div>
  );
}