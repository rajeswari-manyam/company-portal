// src/pages/hr/HRDepartments.tsx

import { useState } from 'react';
import { Plus, Search, Building2, Users, UserCircle2, Edit2 } from 'lucide-react';
import { useDepartments } from '../../modules/departments/useDepartments';
import DepartmentForm from '../../modules/departments/components/DepartmentForm';
import { Modal } from '../../components/ui';
import type { Department } from '../../data/store';

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

function DepartmentCard({
  dept,
  index,
  onEdit,
  canEdit,
}: {
  dept: Department;      // ✅ explicit type — no implicit any
  index: number;         // ✅ explicit type — no implicit any
  onEdit: (d: Department) => void;
  canEdit: boolean;
}) {
  const gradient = getGradient(index);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 p-6
                    shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                    overflow-hidden flex flex-col gap-5">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.035]
                       transition-opacity duration-300 bg-gradient-to-br ${gradient}
                       pointer-events-none rounded-2xl`} />
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient}
                         flex items-center justify-center shadow-md shrink-0`}>
          <Building2 size={22} className="text-white" />
        </div>
        {canEdit && (
          <button
            onClick={() => onEdit(dept)}
            title="Edit department"
            className="opacity-0 group-hover:opacity-100 p-2 rounded-xl
                       bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                       text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95
                       transition-all duration-150"
          >
            <Edit2 size={14} />
          </button>
        )}
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
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </div>
  );
}

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

export default function HRDepartments() {
  const { filtered, search, setSearch, createDepartment, updateDepartment, loading } = useDepartments();
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Department | null>(null);
  const handleClose = () => { setShowForm(false); setEditing(null); };

  return (
    <div className="space-y-6 px-4 sm:px-0">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {loading ? (
          [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          // ✅ Explicit types on dept: Department and i: number — fixes implicit any errors
          filtered.map((dept: Department, i: number) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              index={i}
              onEdit={setEditing}
              canEdit
            />
          ))
        )}
      </div>

      {(showForm || editing) && (
        <Modal title={editing ? 'Edit Department' : 'Add Department'} onClose={handleClose}>
          <DepartmentForm
            initial={editing ?? undefined}
            onSubmit={async (data) => {
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
    </div>
  );
}