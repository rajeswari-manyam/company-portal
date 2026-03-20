// src/modules/departments/components/DepartmentCards.tsx

import React, { useState } from 'react';
import { Edit2, Trash2, Users, UserCircle2, Building2 } from 'lucide-react';
import type { Department } from '../../../data/store';

// ─── Gradient icon bg colors per index ────────────────────────────────────────
const ICON_GRADIENTS = [
  'from-[#0B0E92] to-[#69A6F0]',
  'from-[#0B6E92] to-[#69F0D6]',
  'from-[#920B6E] to-[#F069C8]',
  'from-[#0B920B] to-[#69F082]',
  'from-[#92520B] to-[#F0C469]',
  'from-[#920B0B] to-[#F06969]',
];

function getGradient(index: number) {
  return ICON_GRADIENTS[index % ICON_GRADIENTS.length];
}

// ─── Single Department Card ────────────────────────────────────────────────────

interface DepartmentCardProps {
  department: Department;
  index: number;
  onEdit:   (dept: Department) => void;
  onDelete: (dept: Department) => void;
}

function DepartmentCard({ department, index, onEdit, onDelete }: DepartmentCardProps) {
  const [hovered, setHovered] = useState(false);
  const gradient = getGradient(index);

  return (
    <div
      className="group relative bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4
                 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Subtle gradient shimmer on hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300
                    bg-gradient-to-br ${gradient} pointer-events-none rounded-2xl`}
      />

      {/* Top row: icon + action buttons */}
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
          <Building2 size={22} className="text-white" />
        </div>

        {/* Action buttons — visible on hover */}
        <div className={`flex items-center gap-1.5 transition-all duration-200 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
          <button
            onClick={() => onEdit(department)}
            title="Edit department"
            className="p-2 rounded-lg bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                       text-white shadow-sm hover:shadow-md hover:scale-105
                       transition-all duration-150"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(department)}
            title="Delete department"
            className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-400
                       text-white shadow-sm hover:shadow-md hover:scale-105
                       transition-all duration-150"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Department Name */}
      <div>
        <h3 className="text-base font-semibold text-slate-800 leading-snug">
          {department.name}
        </h3>
        {department.description && (
          <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {department.description}
          </p>
        )}
      </div>

      {/* Footer: employee count + manager */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Users size={14} className="text-slate-400" />
          <span>
            <span className="font-semibold text-slate-700">{department.employeeCount ?? 0}</span>
            {' '}employees
          </span>
        </div>

        {department.head && (
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <UserCircle2 size={14} className="text-slate-400" />
            <span>
              Manager:{' '}
              <span className="font-semibold text-slate-700">{department.head}</span>
            </span>
          </div>
        )}
      </div>

      {/* Bottom gradient bar — slides in on hover */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}
                    transition-all duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center mb-4 opacity-20">
        <Building2 size={30} className="text-white" />
      </div>
      <p className="text-sm font-medium text-slate-500">No departments found</p>
      <p className="text-xs text-slate-400 mt-1">Add a department to get started</p>
    </div>
  );
}

// ─── Main Grid Component ───────────────────────────────────────────────────────

interface DepartmentCardsProps {
  departments: Department[];
  onEdit:   (dept: Department) => void;
  onDelete: (dept: Department) => void;
  loading?: boolean;
}

export default function DepartmentCards({
  departments,
  onEdit,
  onDelete,
  loading = false,
}: DepartmentCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 p-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 p-6">
      {departments.length === 0 ? (
        <EmptyState />
      ) : (
        departments.map((dept, i) => (
          <DepartmentCard
            key={dept.id}
            department={dept}
            index={i}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}