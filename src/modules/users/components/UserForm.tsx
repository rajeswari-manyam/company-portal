// src/modules/users/components/UserForm.tsx

import React, { useState, useEffect } from 'react';
import { Input, Select, Button } from '../../../components/ui';
import { GENDERS } from '../../../constants';
import {
  createEmployee,
  createHR,
  updateEmployee,
  type EmployeeRecord,
  type CreateEmployeePayload,
  type CreateHRPayload,
  type UpdateEmployeePayload,
} from "../../../service/Empolyee.service";
import {
  getDepartments,
  type DepartmentRecord,
} from "../../../service/Department.service";

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

// ─── Component ─────────────────────────────────────────────────────────────────

export default function UserForm({ initial, onSuccess, onCancel }: UserFormProps) {
  const isEdit = Boolean(initial?._id);

  // ── Form state ───────────────────────────────────────────────────────────────
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

  // ── Department dropdown ───────────────────────────────────────────────────
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError,   setDeptError]   = useState<string | null>(null);

  // ── Submit state ─────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);
  const [tempPass,   setTempPass]   = useState<string | null>(null);

  // ── Fetch departments on mount ────────────────────────────────────────────
  useEffect(() => {
    setDeptLoading(true);
    setDeptError(null);
    getDepartments()
      .then(res => {
        if (res.success && res.departments.length > 0) {
          setDepartments(res.departments);
          console.log('%c[Departments Loaded]', 'color: #6366f1; font-weight: bold;', res.departments);
        } else {
          setDeptError('No departments found. Please create one first.');
        }
      })
      .catch(() => setDeptError('Failed to load departments. Check your connection.'))
      .finally(() => setDeptLoading(false));
  }, []);

  // ── Generic field setter ──────────────────────────────────────────────────
  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }));

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setTempPass(null);

    if (!form.departmentId) {
      setApiError('Please select a department.');
      return;
    }

    setSubmitting(true);

    try {
      if (isEdit && initial?._id) {
        // ── UPDATE ──────────────────────────────────────────────────────────
        const payload: UpdateEmployeePayload = {
          name:          form.name,
          email:         form.email,
          phone:         form.phone,
          empId:         form.empId,
          departmentId:  form.departmentId,
          designation:   form.designation,
          gender:        form.gender,
          dateOfBirth:   form.dateOfBirth,
          dateOfJoining: form.dateOfJoining,
          address:       form.address,
        };

        console.group('%c[UPDATE EMPLOYEE] Sending payload', 'color: #f59e0b; font-weight: bold;');
        console.log('Employee ID (_id):', initial._id);
        console.table(payload);
        console.groupEnd();

        const res = await updateEmployee(initial._id, payload);

        if (!res.success) {
          console.error('%c[UPDATE FAILED]', 'color: red;', res.message);
          setApiError(res.message);
          return;
        }

        console.group('%c[UPDATE SUCCESS] Employee updated', 'color: #10b981; font-weight: bold;');
        console.log('Updated employee:', res.employee);
        console.groupEnd();

        onSuccess(res.employee);

      } else {
        // ── CREATE ──────────────────────────────────────────────────────────

        if (form.role === 'hr') {
          // ── CREATE HR — uses /create-hr endpoint, field is "hrId" ─────────
          const payload: CreateHRPayload = {
            name:          form.name,
            email:         form.email,
            phone:         form.phone,
            hrId:          form.empId,        // ← empId field maps to hrId for HR
            departmentId:  form.departmentId,
            designation:   form.designation,
            gender:        form.gender,
            dateOfBirth:   form.dateOfBirth,
            dateOfJoining: form.dateOfJoining,
            address:       form.address,
          };

          console.group('%c[CREATE HR] Sending payload', 'color: #8b5cf6; font-weight: bold;');
          console.table(payload);
          console.groupEnd();

          const res = await createHR(payload);

          if (!res.success) {
            console.error('%c[CREATE HR FAILED]', 'color: red;', res.message);
            setApiError(res.message);
            return;
          }

          console.group('%c[CREATE HR SUCCESS]', 'color: #10b981; font-weight: bold;');
          console.log('New HR:', res.hr);
          console.log('Temporary password:', res.temporaryPassword);
          console.groupEnd();

          setTempPass(res.temporaryPassword);
          onSuccess(res.hr);                  // ← response key is "hr"

        } else {
          // ── CREATE EMPLOYEE / ADMIN — uses /create-employee endpoint ──────
          const payload: CreateEmployeePayload = {
            name:          form.name,
            email:         form.email,
            phone:         form.phone,
            empId:         form.empId,
            departmentId:  form.departmentId,
            designation:   form.designation,
            gender:        form.gender,
            dateOfBirth:   form.dateOfBirth,
            dateOfJoining: form.dateOfJoining,
            address:       form.address,
          };

          console.group('%c[CREATE EMPLOYEE] Sending payload', 'color: #3b82f6; font-weight: bold;');
          console.table(payload);
          console.groupEnd();

          const res = await createEmployee(payload);

          if (!res.success) {
            console.error('%c[CREATE FAILED]', 'color: red;', res.message);
            setApiError(res.message);
            return;
          }

          console.group('%c[CREATE SUCCESS] Employee created', 'color: #10b981; font-weight: bold;');
          console.log('New employee:', res.employee);
          console.log('Temporary password:', res.temporaryPassword);
          console.groupEnd();

          setTempPass(res.temporaryPassword);
          onSuccess(res.employee);            // ← response key is "employee"
        }
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('%c[FORM ERROR]', 'color: red; font-weight: bold;', msg);
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {apiError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* ── Temp Password Banner ──────────────────────────────────────────── */}
      {tempPass && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          ✅ {form.role === 'hr' ? 'HR' : 'Employee'} created! Temporary password:{' '}
          <span className="font-mono font-semibold">{tempPass}</span>
        </div>
      )}

      {/* ══ Basic Information ════════════════════════════════════════════════ */}
      <Section title="Basic Information">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={set('name')}
            required
            wrapperClassName="col-span-2"
          />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
          <Input label="Phone" value={form.phone} onChange={set('phone')} />
        </div>
      </Section>

      {/* ══ Role & Employment ════════════════════════════════════════════════ */}
      <Section title="Role & Employment">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={form.role === 'hr' ? 'HR ID' : 'Employee ID'}
            value={form.empId}
            onChange={set('empId')}
            required
          />
          <Select label="Role" value={form.role} onChange={set('role')} options={ROLE_OPTIONS} />

          {/* Department Dropdown — auto-loaded from GET /getAllDepartments */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Department <span className="text-red-500">*</span>
            </label>
            {deptLoading ? (
              <div className="h-10 w-full rounded-lg bg-slate-100 animate-pulse" />
            ) : deptError ? (
              <div className="h-10 flex items-center px-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
                {deptError}
              </div>
            ) : (
              <select
                value={form.departmentId}
                onChange={set('departmentId')}
                required
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select department…</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.departmentName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input label="Designation" value={form.designation} onChange={set('designation')} required />
          <Input label="Date of Joining" type="date" value={form.dateOfJoining} onChange={set('dateOfJoining')} />
        </div>
      </Section>

      {/* ══ Personal Details ═════════════════════════════════════════════════ */}
      <Section title="Personal Details">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Gender"
            value={form.gender}
            onChange={set('gender')}
            options={GENDERS.map((g: string) => ({ value: g, label: g }))}
            placeholder="Select…"
          />
          <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          <Input label="Address" value={form.address} onChange={set('address')} wrapperClassName="col-span-2" />
        </div>
      </Section>

      {/* ══ System Info (edit only) ══════════════════════════════════════════ */}
      {isEdit && (
        <Section title="System Info (read-only)">
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            <div>
              <span className="font-medium text-slate-500">MongoDB ID: </span>
              <span className="font-mono text-xs break-all">{initial?._id}</span>
            </div>
            <div>
              <span className="font-medium text-slate-500">First Login: </span>
              {initial?.firstLogin ? 'Pending' : 'Completed'}
            </div>
            <div>
              <span className="font-medium text-slate-500">Created: </span>
              {initial?.createdAt ? new Date(initial.createdAt).toLocaleString() : '—'}
            </div>
            <div>
              <span className="font-medium text-slate-500">Updated: </span>
              {initial?.updatedAt ? new Date(initial.updatedAt).toLocaleString() : '—'}
            </div>
          </div>
        </Section>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {isEdit ? 'Save Changes' : form.role === 'hr' ? 'Create HR' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}