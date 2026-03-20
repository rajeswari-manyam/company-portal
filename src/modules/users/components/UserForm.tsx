import React, { useState } from 'react';
import { Input, Select, Button } from '../../../components/ui';
import type { UserRecord, Role } from '../../../types';
import { DEPARTMENTS_DEFAULT, BLOOD_GROUPS, GENDERS } from '../../../constants';
import { UserService } from '../UserService';

interface UserFormProps {
  initial?: Partial<UserRecord>;
  role?: Role;
  onSubmit: (data: Omit<UserRecord, 'id'>) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

export default function UserForm({ initial, role = 'employee', onSubmit, onCancel, loading }: UserFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    password: initial?.password ?? 'Welcome@123',
    role: initial?.role ?? role,
    department: initial?.department ?? '',
    departmentId: initial?.departmentId ?? '',
    designation: initial?.designation ?? '',
    joinDate: initial?.joinDate ?? new Date().toISOString().slice(0, 10),
    status: initial?.status ?? 'active' as 'active' | 'inactive',
    salary: initial?.salary ?? 50000,
    gender: initial?.gender ?? '',
    dateOfBirth: initial?.dateOfBirth ?? '',
    address: initial?.address ?? '',
    bloodGroup: initial?.bloodGroup ?? '',
    emergencyContact: initial?.emergencyContact ?? '',
    manager: initial?.manager ?? '',
    mustChangePassword: initial?.mustChangePassword ?? true,
    createdBy: initial?.createdBy ?? 'admin',
    employeeId: initial?.employeeId ?? UserService.generateId(role === 'admin' ? 'employee' : role),
    avatar: initial?.avatar,
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...form, salary: Number(form.salary) });
  };

  const deptOptions = DEPARTMENTS_DEFAULT.map(d => ({ value: d, label: d }));
  const roleOptions = [
    { value: 'employee', label: 'Employee' },
    { value: 'hr', label: 'HR' },
    { value: 'admin', label: 'Admin' },
  ];
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" value={form.name} onChange={set('name')} required wrapperClassName="col-span-2" />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
        <Input label="Phone" value={form.phone} onChange={set('phone')} />
        <Select label="Role" value={form.role} onChange={set('role')} options={roleOptions} />
        <Select label="Department" value={form.department} onChange={set('department')} options={deptOptions} placeholder="Select…" required />
        <Input label="Designation" value={form.designation} onChange={set('designation')} required />
        <Input label="Join Date" type="date" value={form.joinDate} onChange={set('joinDate')} />
        <Input label="Salary (₹)" type="number" value={form.salary} onChange={set('salary')} />
        <Select label="Gender" value={form.gender} onChange={set('gender')} options={GENDERS.map(g => ({ value: g, label: g }))} placeholder="Select…" />
        <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
        <Select label="Blood Group" value={form.bloodGroup} onChange={set('bloodGroup')} options={BLOOD_GROUPS.map(b => ({ value: b, label: b }))} placeholder="Select…" />
        <Input label="Emergency Contact" value={form.emergencyContact} onChange={set('emergencyContact')} />
        <Input label="Password" type="password" value={form.password} onChange={set('password')} />
        <Select label="Status" value={form.status} onChange={set('status')} options={statusOptions} />
        <Input label="Address" value={form.address} onChange={set('address')} wrapperClassName="col-span-2" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? 'Save Changes' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
