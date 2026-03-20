// src/modules/departments/components/DepartmentTable.tsx

import React, { useState } from 'react';
import { Edit2, Trash2, Building2, Users, UserCircle2, CalendarOff, ChevronDown, ChevronUp } from 'lucide-react';
import type { Department } from '../../../data/store';

interface DepartmentTableProps {
  departments: Department[];
  onEdit?:     (dept: Department) => void;
  onDelete?:   (dept: Department) => void;
  canEdit?:    boolean;
  canDelete?:  boolean;
}

// ─── Week-off pill ──────────────────────────────────────────────────────────────

function WeekOffPills({ days }: { days: string[] | string | undefined }) {
  if (!days) return <span className="text-slate-300 text-xs">—</span>;
  const list = Array.isArray(days)
    ? days
    : String(days).split(',').map(d => d.trim()).filter(Boolean);
  if (list.length === 0) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {list.map(day => (
        <span
          key={day}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                     bg-[#EEF0FF] text-[#0B0E92] border border-[#0B0E92]/10"
        >
          {day}
        </span>
      ))}
    </div>
  );
}

// ─── Mobile Card ────────────────────────────────────────────────────────────────

function MobileCard({
  dept,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  dept: Department;
  onEdit?:    (d: Department) => void;
  onDelete?:  (d: Department) => void;
  canEdit:    boolean;
  canDelete:  boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Gradient top strip */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]" />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0]
                            flex items-center justify-center shrink-0 shadow-sm">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm leading-snug">{dept.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Users size={11} className="text-slate-400" />
                <span className="text-xs text-slate-400">{dept.employeeCount ?? 0} employees</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(dept)}
                className="p-2 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                           text-white shadow-sm hover:shadow-md hover:scale-105
                           transition-all duration-150"
              >
                <Edit2 size={13} />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(dept)}
                className="p-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-400
                           text-white shadow-sm hover:shadow-md hover:scale-105
                           transition-all duration-150"
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              onClick={() => setExpanded(p => !p)}
              className="p-2 rounded-xl border border-slate-200 text-slate-400
                         hover:bg-slate-50 transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Expandable details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-1 gap-3">
            {dept.head && (
              <div className="flex items-start gap-2">
                <UserCircle2 size={14} className="text-[#0B0E92] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Department Head</p>
                  <p className="text-sm text-slate-700 font-medium">{dept.head}</p>
                </div>
              </div>
            )}
            {dept.description && (
              <div className="flex items-start gap-2">
                <span className="text-[#0B0E92] mt-0.5 shrink-0 text-xs">📝</span>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Description</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{dept.description}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <CalendarOff size={14} className="text-[#0B0E92] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Week Off Days</p>
                <WeekOffPills days={dept.weekOffDays as string[] | string | undefined} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Desktop Table ──────────────────────────────────────────────────────────────

function DesktopTable({
  departments,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: DepartmentTableProps & { canEdit: boolean; canDelete: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {['Department', 'Department Head', 'Description', 'Employee Count', 'Week Off Days', 'Actions'].map(h => (
              <th
                key={h}
                className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5 py-3.5"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {departments.map((dept, i) => (
            <tr
              key={dept.id}
              className="hover:bg-[#EEF0FF]/30 transition-colors group"
            >
              {/* Department */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0]
                                  flex items-center justify-center shadow-sm shrink-0">
                    <Building2 size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{dept.name}</p>
                    <p className="text-xs text-slate-400">{dept.employeeCount ?? 0} employees</p>
                  </div>
                </div>
              </td>

              {/* Head */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5">
                  <UserCircle2 size={14} className="text-slate-300 shrink-0" />
                  <span className="text-sm text-slate-600">{dept.head || '—'}</span>
                </div>
              </td>

              {/* Description */}
              <td className="px-5 py-4 max-w-[220px]">
                <p className="text-sm text-slate-500 truncate" title={dept.description}>
                  {dept.description || '—'}
                </p>
              </td>

              {/* Employee Count */}
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                 text-xs font-semibold bg-[#EEF0FF] text-[#0B0E92]">
                  <Users size={11} />
                  {dept.employeeCount ?? 0}
                </span>
              </td>

              {/* Week Off Days */}
              <td className="px-5 py-4">
                <WeekOffPills days={dept.weekOffDays as string[] | string | undefined} />
              </td>

              {/* Actions */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  {canEdit && onEdit && (
                    <button
                      onClick={() => onEdit(dept)}
                      title="Edit"
                      className="p-2 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                                 text-white shadow-sm hover:shadow-md hover:scale-105
                                 transition-all duration-150"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  {canDelete && onDelete && (
                    <button
                      onClick={() => onDelete(dept)}
                      title="Delete"
                      className="p-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-400
                                 text-white shadow-sm hover:shadow-md hover:scale-105
                                 transition-all duration-150"
                    >
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
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0]
                      flex items-center justify-center opacity-20">
        <Building2 size={26} className="text-white" />
      </div>
      <p className="text-sm font-medium text-slate-500">No departments found</p>
      <p className="text-xs text-slate-400">Create a department to get started</p>
    </div>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────────

export default function DepartmentTable({
  departments,
  onEdit,
  onDelete,
  canEdit   = true,
  canDelete = true,
}: DepartmentTableProps) {
  if (departments.length === 0) return <EmptyState />;

  return (
    <>
      {/* Mobile: card stack (visible below md) */}
      <div className="md:hidden flex flex-col gap-3 p-4">
        {departments.map(dept => (
          <MobileCard
            key={dept.id}
            dept={dept}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))}
      </div>

      {/* Desktop: table (visible md and up) */}
      <div className="hidden md:block">
        <DesktopTable
          departments={departments}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>
    </>
  );
}