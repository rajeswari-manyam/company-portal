// src/modules/users/components/UserForm.tsx

import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Hash, Building2, Briefcase,
  Calendar, MapPin, ChevronDown, CheckCircle2,
  AlertCircle, Loader2, Eye, EyeOff, Sparkles,
} from 'lucide-react';
import { GENDERS } from '../../../constants';
import {
  createEmployee,
  createHR,
  updateEmployee,
  getErrorMessage,
  type EmployeeRecord,
  type CreateEmployeePayload,
  type CreateHRPayload,
  type UpdateEmployeePayload,
} from '../../../service/Empolyee.service';
import {
  getDepartments,
  type Department,
} from '../../../service/departmentApi';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface UserFormProps {
  initial?: Partial<EmployeeRecord>;
  onSuccess: (employee: EmployeeRecord) => void;
  onCancel: () => void;
  role: 'employee' | 'hr' | 'admin';
  existingIds?: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDateInput(iso?: string) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function suggestNextId(existingIds: string[], prefix: string): string {
  const upper = prefix.toUpperCase();
  const nums = existingIds
    .map(id => id.toUpperCase())
    .filter(id => id.startsWith(upper))
    .map(id => { const n = parseInt(id.slice(upper.length), 10); return isNaN(n) ? 0 : n; });

  if (nums.length === 0) return `${prefix}0001`;
  const max  = Math.max(...nums);
  const next = max + 1;
  const sample   = existingIds.find(id => id.toUpperCase().startsWith(upper));
  const numPart  = sample ? sample.slice(upper.length) : '0001';
  const padWidth = Math.max(numPart.length, String(next).length);
  return `${prefix}${String(next).padStart(padWidth, '0')}`;
}

function detectPrefix(existingIds: string[], role: 'employee' | 'hr' | 'admin'): string {
  const fallback = role === 'hr' ? 'HR' : 'EMP';
  if (!existingIds.length) return fallback;
  const match = existingIds.map(id => id.match(/^([A-Za-z]+)/)).find(m => m !== null);
  return match ? match[1].toUpperCase() : fallback;
}

// ─── Styled primitives ─────────────────────────────────────────────────────────

const inputBase =
  'w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 ' +
  'placeholder:text-slate-300 outline-none transition-all duration-200 ' +
  'focus:border-[#0B0E92] focus:ring-2 focus:ring-[#0B0E92]/10 ' +
  'disabled:bg-slate-50 disabled:text-slate-400';

const selectBase =
  'w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-800 ' +
  'outline-none transition-all duration-200 appearance-none cursor-pointer ' +
  'focus:border-[#0B0E92] focus:ring-2 focus:ring-[#0B0E92]/10 ' +
  'disabled:bg-slate-50 disabled:text-slate-400';

interface FieldProps {
  label: string; required?: boolean; icon?: React.ReactNode;
  children: React.ReactNode; className?: string; hint?: string;
}
function Field({ label, required, icon, children, className = '', hint }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {icon && <span className="text-[#0B0E92]">{icon}</span>}
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string; icon?: React.ReactNode; hint?: string; wrapperClassName?: string;
}
function TextInput({ label, icon, hint, wrapperClassName = '', required, ...rest }: TextInputProps) {
  return (
    <Field label={label} required={required} icon={icon} className={wrapperClassName} hint={hint}>
      <input className={inputBase} required={required} {...rest} />
    </Field>
  );
}

interface SelectFieldProps {
  label: string; icon?: React.ReactNode; required?: boolean; wrapperClassName?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean; children: React.ReactNode; placeholder?: string;
}
function SelectField({ label, icon, required, wrapperClassName = '', value, onChange, disabled, children, placeholder }: SelectFieldProps) {
  return (
    <Field label={label} required={required} icon={icon} className={wrapperClassName}>
      <div className="relative">
        <select value={value} onChange={onChange} required={required} disabled={disabled} className={selectBase}>
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </Field>
  );
}

function SectionHeader({ title, step }: { title: string; step: number }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-white">{step}</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UserForm({ initial, onSuccess, onCancel, role, existingIds = [] }: UserFormProps) {
  const isEdit = Boolean(initial?._id);

  const prefix      = detectPrefix(existingIds, role);
  const suggestedId = isEdit ? (initial?.empId ?? '') : suggestNextId(existingIds, prefix);

  const [form, setForm] = useState({
    name:          initial?.name          ?? '',
    email:         initial?.email         ?? '',
    phone:         initial?.phone         ?? '',
    empId:         suggestedId,
    designation:   initial?.designation   ?? '',   // ✅ designation field
    departmentId:  initial?.department    ?? '',
    gender:        initial?.gender        ?? '',
    dateOfBirth:   toDateInput(initial?.dateOfBirth),
    dateOfJoining: toDateInput(initial?.dateOfJoining),
    address:       initial?.address       ?? '',
  });

  const [idTouched,  setIdTouched]  = useState(false);
  const [idConflict, setIdConflict] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError,   setDeptError]   = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [apiError,    setApiError]    = useState<string | null>(null);
  const [tempPass,    setTempPass]    = useState<string | null>(null);
  const [showPass,    setShowPass]    = useState(false);

  useEffect(() => {
    if (isEdit) return;
    const val = form.empId.trim().toUpperCase();
    setIdConflict(existingIds.some(id => id.toUpperCase() === val));
  }, [form.empId, existingIds, isEdit]);

  useEffect(() => {
    let cancelled = false;

    setDeptLoading(true);
    setDeptError(null);

    getDepartments()
      .then((res) => {
        if (cancelled) return;

        const list = Array.isArray(res)
          ? res
          : (res as { departments?: Department[] }).departments ?? [];

        if (list.length > 0) {
          setDepartments(list);

          if (isEdit && initial?.department) {
            const stored = initial.department;
            const match = list.find((d) => d.id === stored || d.name === stored);
            if (match) setForm((p) => ({ ...p, departmentId: match.id }));
          }

          if (!isEdit && !form.departmentId) {
            setForm((p) => ({ ...p, departmentId: list[0].id }));
          }
        } else {
          setDeptError('No departments found. Please create one first.');
        }
      })
      .catch(() => {
        if (!cancelled) setDeptError('Failed to load departments. Check your connection.');
      })
      .finally(() => {
        if (!cancelled) setDeptLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setTempPass(null);

    if (!isEdit && idConflict) {
      setApiError(`ID "${form.empId}" already exists. Please use a different ID.`);
      return;
    }

    const deptId = form.departmentId.trim();
    if (!deptId) { setApiError('Please select a department.'); return; }

    setSubmitting(true);
    try {
      if (isEdit && initial?._id) {
        const payload: UpdateEmployeePayload = {
          name: form.name, email: form.email, phone: form.phone,
          empId: form.empId, department: deptId,
          designation: form.designation,
          gender: form.gender, dateOfBirth: form.dateOfBirth,
          dateOfJoining: form.dateOfJoining, address: form.address,
        };
        const res = await updateEmployee(initial._id, payload);
        if (!res.success) { setApiError(res.message); return; }
        onSuccess(res.user);

      } else if (role === 'hr') {
        const payload: CreateHRPayload = {
          name: form.name, email: form.email, phone: form.phone,
          empId: form.empId, departmentId: deptId,
          designation: form.designation,
          gender: form.gender, dateOfBirth: form.dateOfBirth,
          dateOfJoining: form.dateOfJoining, address: form.address,
        };
        const res = await createHR(payload);
        if (!res.success) { setApiError(res.message); return; }
        setTempPass(res.temporaryPassword);
        onSuccess(res.hr);

      } else {
        const payload: CreateEmployeePayload = {
          name: form.name, email: form.email, phone: form.phone,
          empId: form.empId, departmentId: deptId,
          designation: form.designation,
          gender: form.gender, dateOfBirth: form.dateOfBirth,
          dateOfJoining: form.dateOfJoining, address: form.address,
        };
        const res = await createEmployee(payload);
        if (!res.success) { setApiError(res.message); return; }
        setTempPass(res.temporaryPassword);
        onSuccess(res.employee);
      }
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, 'An unexpected error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ── API error banner ── */}
      {apiError && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
          <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-700">{apiError}</p>
        </div>
      )}

      {/* ── Temp password banner ── */}
      {tempPass && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">
              {role === 'hr' ? 'HR' : 'Employee'} created successfully!
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">Temporary password:</p>
            <div className="flex items-center gap-2 mt-1.5">
              <code className="flex-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-mono font-bold text-emerald-900 tracking-wider">
                {showPass ? tempPass : '••••••••••'}
              </code>
              <button type="button" onClick={() => setShowPass((p) => !p)}
                className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 1: Basic Info ── */}
      <div className="space-y-4">
        <SectionHeader title="Basic Information" step={1} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput label="Full Name" icon={<User size={12} />}
            value={form.name} onChange={set('name')}
            placeholder="e.g. Rahul Sharma" required wrapperClassName="sm:col-span-2" />
          <TextInput label="Email Address" icon={<Mail size={12} />}
            type="email" value={form.email} onChange={set('email')}
            placeholder="rahul@company.com" required />
          <TextInput label="Phone Number" icon={<Phone size={12} />}
            type="tel" value={form.phone} onChange={set('phone')}
            placeholder="+91 98765 43210" />
        </div>
      </div>

      {/* ── Section 2: Employment ── */}
      <div className="space-y-4">
        <SectionHeader title="Employment Details" step={2} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Employee / HR ID with auto-suggest + conflict detection */}
          <Field label={role === 'hr' ? 'HR ID' : 'Employee ID'} icon={<Hash size={12} />} required>
            <div className="relative">
              <input
                className={[
                  inputBase, 'pr-10',
                  !isEdit && idTouched && idConflict
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/10'
                    : !isEdit && idTouched && !idConflict
                    ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/10'
                    : '',
                ].join(' ')}
                value={form.empId}
                onChange={e => { setIdTouched(true); setForm(p => ({ ...p, empId: e.target.value })); }}
                placeholder={role === 'hr' ? 'HR001' : 'EMP001'}
                required
              />
              {!isEdit && !idTouched && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B0E92]">
                  <Sparkles size={14} />
                </span>
              )}
              {!isEdit && idTouched && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${idConflict ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {idConflict ? '✕' : '✓'}
                </span>
              )}
            </div>
            {!isEdit && !idTouched && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles size={10} className="text-[#0B0E92]" />
                Auto-suggested based on existing IDs
              </p>
            )}
            {!isEdit && idTouched && idConflict && (
              <p className="text-xs text-rose-500 flex items-center gap-1 flex-wrap">
                <AlertCircle size={11} />
                This ID already exists. Next available:&nbsp;
                <button type="button"
                  className="underline font-semibold hover:text-rose-700 transition-colors"
                  onClick={() => { setForm(p => ({ ...p, empId: suggestedId })); setIdTouched(false); }}>
                  {suggestedId}
                </button>
              </p>
            )}
          </Field>

          {/* ✅ Designation field */}
          <TextInput
            label="Designation"
            icon={<Briefcase size={12} />}
            value={form.designation}
            onChange={set('designation')}
            placeholder={role === 'hr' ? 'e.g. HR Manager' : 'e.g. Software Engineer'}
          />

          {/* Department */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="text-[#0B0E92]"><Building2 size={12} /></span>
              Department <span className="text-rose-400 ml-0.5">*</span>
            </label>
            {deptLoading ? (
              <div className="h-11 w-full rounded-xl bg-slate-100 animate-pulse flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-slate-400" />
                <span className="text-xs text-slate-400">Loading departments…</span>
              </div>
            ) : deptError ? (
              <div className="h-11 flex items-center gap-2 px-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-600">
                <AlertCircle size={13} />{deptError}
              </div>
            ) : (
              <div className="relative">
                <select value={form.departmentId} onChange={set('departmentId')} required className={selectBase}>
                  {isEdit && <option value="">Select department…</option>}
                  {departments.map((dept: Department) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          <TextInput label="Date of Joining" icon={<Calendar size={12} />}
            type="date" value={form.dateOfJoining} onChange={set('dateOfJoining')}
            wrapperClassName="sm:col-span-2" />

        </div>
      </div>

      {/* ── Section 3: Personal Details ── */}
      <div className="space-y-4">
        <SectionHeader title="Personal Details" step={3} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <SelectField label="Gender" value={form.gender} onChange={set('gender')} placeholder="Select gender…">
            {GENDERS.map((g: string) => <option key={g} value={g}>{g}</option>)}
          </SelectField>

          <TextInput label="Date of Birth" icon={<Calendar size={12} />}
            type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="text-[#0B0E92]"><MapPin size={12} /></span>Address
            </label>
            <textarea value={form.address} onChange={set('address')}
              placeholder="123, Street Name, City, State — 500001" rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800
                         placeholder:text-slate-300 outline-none resize-none transition-all duration-200
                         focus:border-[#0B0E92] focus:ring-2 focus:ring-[#0B0E92]/10" />
          </div>

        </div>
      </div>

      {/* ── Section 4: System Info (edit only) ── */}
      {isEdit && (
        <div className="space-y-4">
          <SectionHeader title="System Info" step={4} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
            {[
              { label: 'First Login', value: initial?.firstLogin ? 'Pending' : 'Completed' },
              { label: 'Created At',  value: initial?.createdAt  ? new Date(initial.createdAt).toLocaleString('en-IN')  : '—' },
              { label: 'Last Updated', value: initial?.updatedAt ? new Date(initial.updatedAt).toLocaleString('en-IN') : '—' },
            ].map((row) => (
              <div key={row.label}>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{row.label}</span>
                <span className="text-xs text-slate-600 font-mono break-all">{row.value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel} disabled={submitting}
          className="h-11 px-6 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600
                     hover:bg-slate-50 transition-all duration-200 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting || (!isEdit && idConflict)}
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                     text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02]
                     active:scale-[0.98] transition-all duration-200 disabled:opacity-60
                     disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : role === 'hr' ? 'Create HR' : 'Create Employee'}
        </button>
      </div>

    </form>
  );
}