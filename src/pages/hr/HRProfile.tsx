import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Lock, User, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployeeById, type EmployeeRecord } from '../../services/Empolyee.service';
import { formatDate } from '../../utils/helpers';

type Tab = 'personal' | 'job' | 'password';

// ── Avatar circle ─────────────────────────────────────────────────────────────
function AvatarCircle({ name, size = 72 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }}
      className="bg-[#EEF0FF] flex items-center justify-center"
    >
      <span style={{ fontSize: size * 0.32 }} className="font-bold text-[#0B0E92]">
        {initials}
      </span>
    </div>
  );
}

// ── Field card ────────────────────────────────────────────────────────────────
function FieldCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm">
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HRProfile() {
  const { user, updatePassword } = useAuth();
  const [tab, setTab] = useState<Tab>('personal');
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [pwForm, setPwForm] = useState({ newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!(user as any)?._id) return;
      try {
        setLoading(true);
        const res = await getEmployeeById((user as any)._id);
        setEmployee(res.user ?? res.employee ?? null);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [(user as any)?._id]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw.length < 8) { toast.error('Minimum 8 characters'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    const ok = await updatePassword(pwForm.newPw);
    if (ok) { toast.success('Password updated!'); setPwForm({ newPw: '', confirm: '' }); }
    else toast.error('Failed to update password');
    setPwLoading(false);
  };

  if (!user) return null;

  const emp = employee;
  const displayName = emp?.name ?? user?.name ?? 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  // Dept — hide if it looks like a MongoDB ObjectId
  const dept = emp?.department && !/^[a-f0-9]{24}$/i.test(emp.department)
    ? emp.department : null;

  const TAB_PILLS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'personal', label: 'personal', icon: <User size={13} /> },
    { key: 'job', label: 'job', icon: <Briefcase size={13} /> },
    { key: 'password', label: 'password', icon: <Lock size={13} /> },
  ];

  return (
    <div className="space-y-0 pb-10" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Page title ── */}
      <h1 className="text-xl font-bold text-slate-900 mb-6">My Profile</h1>

      {/* ── Profile card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

        {/* Header row: avatar + name + tabs */}
        <div className="flex items-start gap-5 mb-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#EEF0FF] flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-[#0B0E92]">{initials}</span>
          </div>

          {/* Name / role / badges */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{displayName}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {emp?.designation ?? '—'}
              {dept ? ` · ${dept}` : ''}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                Active
              </span>
              {(emp?.empId ?? (user as any)?.empId) && (
                <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {emp?.empId ?? (user as any)?.empId}
                </span>
              )}
              <span className="px-3 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold capitalize">
                {emp?.role ?? user?.role ?? 'employee'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab pills — matches screenshot "personal | job" style */}
        <div className="flex items-center gap-2 mb-6">
          {TAB_PILLS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all capitalize ${tab === t.key
                  ? 'bg-[#0B0E92] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Loading spinner ── */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#0B0E92] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Personal tab ── */}
        {!loading && tab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldCard label="Full Name" value={emp?.name} />
            <FieldCard label="Email" value={emp?.email} />
            <FieldCard label="Phone" value={emp?.phone} />
            <FieldCard label="Gender" value={emp?.gender} />
            <FieldCard label="Date of Birth" value={emp?.dateOfBirth ? formatDate(emp.dateOfBirth) : undefined} />
            <FieldCard label="Blood Group" value={(emp as any)?.bloodGroup} />
            <FieldCard label="Address" value={emp?.address} />
            <FieldCard label="Emergency Contact" value={(emp as any)?.emergencyContact} />
          </div>
        )}

        {/* ── Job tab ── */}
        {!loading && tab === 'job' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldCard label="Employee ID" value={emp?.empId} />
            <FieldCard label="Designation" value={emp?.designation} />
            <FieldCard label="Department" value={dept ?? '—'} />
            <FieldCard label="Role" value={emp?.role} />
            <FieldCard label="Join Date" value={emp?.dateOfJoining ? formatDate(emp.dateOfJoining) : undefined} />
            <FieldCard label="Work Email" value={emp?.email} />
            <FieldCard label="Manager" value={(emp as any)?.manager} />
            <FieldCard label="Work Location" value={(emp as any)?.workLocation ?? 'Office'} />
          </div>
        )}

        {/* ── Password tab ── */}
        {!loading && tab === 'password' && (
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] flex items-center justify-center shrink-0">
                <Lock size={18} className="text-[#0B0E92]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Change Password</h3>
                <p className="text-xs text-slate-400">At least 8 characters required</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={pwForm.newPw}
                onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))}
                required
                placeholder="Min. 8 characters"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                required
                placeholder="Repeat new password"
              />
              {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
              )}
              {pwForm.newPw && pwForm.newPw.length > 0 && pwForm.newPw.length < 8 && (
                <p className="text-xs text-amber-600 font-medium">Minimum 8 characters</p>
              )}
              <Button type="submit" loading={pwLoading} icon={<Lock size={14} />}>
                Update Password
              </Button>
            </form>
          </div>
        )}

        {/* No data fallback */}
        {!loading && !emp && tab !== 'password' && (
          <p className="text-slate-400 text-sm text-center py-10">No profile data found.</p>
        )}
      </div>
    </div>
  );
}