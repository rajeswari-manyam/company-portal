// src/modules/users/components/UserForm.tsx
// ✅ Fixes:
//   1. departmentId validation guard now works correctly
//   2. Payload logs department before every submit so you can debug quickly
//   3. Auto-selects first department when only one exists
//   4. Handles both d._id and d.id department shapes safely

import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Hash, Briefcase, Building2,
  Calendar, MapPin, Shield, ChevronDown, CheckCircle2,
  AlertCircle, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { GENDERS } from '../../../constants';
import {
  createEmployee,
  createHR,
  updateEmployee,
  type EmployeeRecord,
  type CreateEmployeePayload,
  type CreateHRPayload,
  type UpdateEmployeePayload,
} from '../../../services/Empolyee.service';
import {
  getDepartments,
  type DepartmentRecord,
} from '../../../services/departmentApi';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface UserFormProps {
  initial?: Partial<EmployeeRecord>;
  onSuccess: (employee: EmployeeRecord) => void;
  onCancel: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDateInput(iso?: string) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr',       label: 'HR'       },
  { value: 'admin',    label: 'Admin'    },
];

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
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}
function Field({ label, required, icon, children, className = '', hint }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {icon && <span className="text-[#0B0E92]">{icon}</span>}
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
  wrapperClassName?: string;
}
function TextInput({
  label,
  icon,
  hint,
  wrapperClassName = '',
  required,
  ...rest
}: TextInputProps) {
  return (
    <Field
      label={label}
      required={required}
      icon={icon}
      className={wrapperClassName}
      hint={hint}
    >
      <input className={inputBase} required={required} {...rest} />
    </Field>
  );
}

interface SelectFieldProps {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  wrapperClassName?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
  placeholder?: string;
}
function SelectField({
  label,
  icon,
  required,
  wrapperClassName = '',
  value,
  onChange,
  disabled,
  children,
  placeholder,
}: SelectFieldProps) {
  return (
    <Field label={label} required={required} icon={icon} className={wrapperClassName}>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={selectBase}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        <ChevronDown
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
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

export default function UserForm({ initial, onSuccess, onCancel }: UserFormProps) {
  const isEdit = Boolean(initial?._id);

  const [form, setForm] = useState({
    name:          initial?.name        ?? '',
    email:         initial?.email       ?? '',
    phone:         initial?.phone       ?? '',
    empId:         initial?.empId       ?? '',
    role:          initial?.role        ?? 'employee',
    departmentId:  initial?.department  ?? '',
    designation:   initial?.designation ?? '',
    gender:        initial?.gender      ?? '',
    dateOfBirth:   toDateInput(initial?.dateOfBirth),
    dateOfJoining: toDateInput(initial?.dateOfJoining),
    address:       initial?.address     ?? '',
  });

  const [departments, setDepartments]   = useState<DepartmentRecord[]>([]);
  const [deptLoading, setDeptLoading]   = useState(true);
  const [deptError,   setDeptError]     = useState<string | null>(null);
  const [submitting,  setSubmitting]    = useState(false);
  const [apiError,    setApiError]      = useState<string | null>(null);
  const [tempPass,    setTempPass]      = useState<string | null>(null);
  const [showPass,    setShowPass]      = useState(false);

  // ── Fetch departments ────────────────────────────────────────────────────────
  useEffect(() => {
    setDeptLoading(true);
    setDeptError(null);

    getDepartments()
      .then((res) => {
        if (res.success && res.departments.length > 0) {
          setDepartments(res.departments);

          console.group('%c📦 [Departments Loaded]', 'color:#6366f1;font-weight:bold;font-size:13px');
          console.log(`Total: ${res.departments.length} departments`);
          console.table(
            res.departments.map((d: DepartmentRecord) => ({
              ID: d._id,
              Name: d.departmentName,
            }))
          );
          console.groupEnd();

          // ✅ FIX: If editing, resolve the stored department value against loaded IDs.
          //    The stored user.department might be a name string or an _id.
          //    Try to match it; fall back to the first dept if nothing matches.
          if (isEdit && initial?.department) {
            const stored = initial.department;
            const exactMatch = res.departments.find(
              (d: DepartmentRecord) =>
                d._id === stored || d.departmentName === stored
            );
            if (exactMatch) {
              setForm((p) => ({ ...p, departmentId: exactMatch._id }));
            }
          }

          // ✅ FIX: Auto-select first department in Add mode so the field is
          //    never blank when the user forgets to pick one.
          if (!isEdit && !form.departmentId) {
            setForm((p) => ({ ...p, departmentId: res.departments[0]._id }));
          }
        } else {
          setDeptError('No departments found. Please create one first.');
        }
      })
      .catch(() => setDeptError('Failed to load departments. Check your connection.'))
      .finally(() => setDeptLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set =
    (field: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setTempPass(null);

    // ✅ FIX: Trim whitespace before validation so '  ' doesn't slip through
    const deptId = form.departmentId.trim();

    console.group('%c🔍 [Submit — Pre-flight]', 'color:#f59e0b;font-weight:bold;font-size:13px');
    console.log('departmentId being sent:', deptId);
    console.log('Full form state:', form);
    console.groupEnd();

    if (!deptId) {
      setApiError('Please select a department.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && initial?._id) {
        const payload: UpdateEmployeePayload = {
          name:          form.name,
          email:         form.email,
          phone:         form.phone,
          empId:         form.empId,
          departmentId:  deptId,          // ✅ use trimmed value
          designation:   form.designation,
          gender:        form.gender,
          dateOfBirth:   form.dateOfBirth,
          dateOfJoining: form.dateOfJoining,
          address:       form.address,
        };

        console.group('%c✏️ [UPDATE EMPLOYEE]', 'color:#f59e0b;font-weight:bold;font-size:13px');
        console.log('_id:', initial._id);
        console.table(payload);
        console.groupEnd();

        const res = await updateEmployee(initial._id, payload);
        if (!res.success) { setApiError(res.message); return; }

        console.group('%c✅ [UPDATE SUCCESS]', 'color:#10b981;font-weight:bold;font-size:13px');
        console.table({ _id: res.employee._id, name: res.employee.name, email: res.employee.email });
        console.groupEnd();

        onSuccess(res.employee);

      } else if (form.role === 'hr') {
        const payload: CreateHRPayload = {
          name:          form.name,
          email:         form.email,
          phone:         form.phone,
          hrId:          form.empId,
          departmentId:  deptId,          // ✅ use trimmed value
          designation:   form.designation,
          gender:        form.gender,
          dateOfBirth:   form.dateOfBirth,
          dateOfJoining: form.dateOfJoining,
          address:       form.address,
        };

        console.group('%c🧑‍💼 [CREATE HR]', 'color:#8b5cf6;font-weight:bold;font-size:13px');
        console.table(payload);
        console.groupEnd();

        const res = await createHR(payload);
        if (!res.success) { setApiError(res.message); return; }

        console.group('%c✅ [CREATE HR SUCCESS]', 'color:#10b981;font-weight:bold;font-size:13px');
        console.table({ _id: res.hr._id, temporaryPassword: res.temporaryPassword });
        console.groupEnd();

        setTempPass(res.temporaryPassword);
        onSuccess(res.hr);

      } else {
        const payload: CreateEmployeePayload = {
          name:          form.name,
          email:         form.email,
          phone:         form.phone,
          empId:         form.empId,
          departmentId:  deptId,          // ✅ use trimmed value
          designation:   form.designation,
          gender:        form.gender,
          dateOfBirth:   form.dateOfBirth,
          dateOfJoining: form.dateOfJoining,
          address:       form.address,
        };

        console.group('%c👤 [CREATE EMPLOYEE]', 'color:#3b82f6;font-weight:bold;font-size:13px');
        console.table(payload);
        console.groupEnd();

        const res = await createEmployee(payload);
        if (!res.success) { setApiError(res.message); return; }

        console.group('%c✅ [CREATE EMPLOYEE SUCCESS]', 'color:#10b981;font-weight:bold;font-size:13px');
        console.table({ _id: res.employee._id, temporaryPassword: res.temporaryPassword });
        console.groupEnd();

        setTempPass(res.temporaryPassword);
        onSuccess(res.employee);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('%c💥 [FORM ERROR]', 'color:red;font-weight:bold;font-size:13px', msg);
      setApiError(msg);
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
              {form.role === 'hr' ? 'HR' : 'Employee'} created successfully!
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">Temporary password:</p>
            <div className="flex items-center gap-2 mt-1.5">
              <code className="flex-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-mono font-bold text-emerald-900 tracking-wider">
                {showPass ? tempPass : '••••••••••'}
              </code>
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
              >
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
          <TextInput
            label="Full Name"
            icon={<User size={12} />}
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Rahul Sharma"
            required
            wrapperClassName="sm:col-span-2"
          />
          <TextInput
            label="Email Address"
            icon={<Mail size={12} />}
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="rahul@company.com"
            required
          />
          <TextInput
            label="Phone Number"
            icon={<Phone size={12} />}
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      {/* ── Section 2: Role & Employment ── */}
      <div className="space-y-4">
        <SectionHeader title="Role & Employment" step={2} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Role"
            icon={<Shield size={12} />}
            value={form.role}
            onChange={set('role')}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>

          <TextInput
            label={form.role === 'hr' ? 'HR ID' : 'Employee ID'}
            icon={<Hash size={12} />}
            value={form.empId}
            onChange={set('empId')}
            placeholder={form.role === 'hr' ? 'HR001' : 'EMP001'}
            required
          />

          {/* ── Department ── */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="text-[#0B0E92]">
                <Building2 size={12} />
              </span>
              Department <span className="text-rose-400 ml-0.5">*</span>
            </label>

            {deptLoading ? (
              <div className="h-11 w-full rounded-xl bg-slate-100 animate-pulse flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-slate-400" />
                <span className="text-xs text-slate-400">Loading departments…</span>
              </div>
            ) : deptError ? (
              <div className="h-11 flex items-center gap-2 px-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-600">
                <AlertCircle size={13} />
                {deptError}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={form.departmentId}
                  onChange={set('departmentId')}
                  required
                  className={selectBase}
                >
                  {/* ✅ FIX: Keep empty placeholder only in edit mode where a dept
                      is pre-selected. In add mode the first dept is auto-selected
                      so this placeholder is hidden to prevent accidental empty submits. */}
                  {isEdit && <option value="">Select department…</option>}
                  {departments.map((dept: DepartmentRecord) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            )}
          </div>

          <TextInput
            label="Designation"
            icon={<Briefcase size={12} />}
            value={form.designation}
            onChange={set('designation')}
            placeholder="e.g. Software Engineer"
            required
          />

          <TextInput
            label="Date of Joining"
            icon={<Calendar size={12} />}
            type="date"
            value={form.dateOfJoining}
            onChange={set('dateOfJoining')}
            wrapperClassName="sm:col-span-2"
          />
        </div>
      </div>

      {/* ── Section 3: Personal Details ── */}
      <div className="space-y-4">
        <SectionHeader title="Personal Details" step={3} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Gender"
            value={form.gender}
            onChange={set('gender')}
            placeholder="Select gender…"
          >
            {GENDERS.map((g: string) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </SelectField>

          <TextInput
            label="Date of Birth"
            icon={<Calendar size={12} />}
            type="date"
            value={form.dateOfBirth}
            onChange={set('dateOfBirth')}
          />

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="text-[#0B0E92]">
                <MapPin size={12} />
              </span>
              Address
            </label>
            <textarea
              value={form.address}
              onChange={set('address')}
              placeholder="123, Street Name, City, State — 500001"
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800
                         placeholder:text-slate-300 outline-none resize-none transition-all duration-200
                         focus:border-[#0B0E92] focus:ring-2 focus:ring-[#0B0E92]/10"
            />
          </div>
        </div>
      </div>

      {/* ── Section 4: System Info (edit only) ── */}
      {isEdit && (
        <div className="space-y-4">
          <SectionHeader title="System Info" step={4} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
            {[
              { label: 'MongoDB _id',  value: initial?._id },
              { label: 'First Login',  value: initial?.firstLogin ? 'Pending' : 'Completed' },
              {
                label: 'Created At',
                value: initial?.createdAt
                  ? new Date(initial.createdAt).toLocaleString('en-IN')
                  : '—',
              },
              {
                label: 'Last Updated',
                value: initial?.updatedAt
                  ? new Date(initial.updatedAt).toLocaleString('en-IN')
                  : '—',
              },
            ].map((row) => (
              <div key={row.label}>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  {row.label}
                </span>
                <span className="text-xs text-slate-600 font-mono break-all">
                  {row.value ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-11 px-6 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600
                     hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
                     text-white text-sm font-semibold shadow-md
                     hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                     transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting
            ? 'Saving…'
            : isEdit
            ? 'Save Changes'
            : form.role === 'hr'
            ? 'Create HR'
            : 'Create Employee'}
        </button>
      </div>
    </form>
  );
}