import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/helpers';
import { Lock, User, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'password';

export default function HRProfile() {
  const { user, updateProfile, updatePassword } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: user?.phone ?? '', address: user?.address ?? '' });

  // Password state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handleSaveProfile = () => {
    updateProfile(form);
    toast.success('Profile updated');
    setEditing(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw.length < 8) { toast.error('Minimum 8 characters'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    const ok = await updatePassword(pwForm.newPw);
    if (ok) {
      toast.success('Password updated successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } else {
      toast.error('Failed to update password');
    }
    setPwLoading(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="My Profile" subtitle="Manage your account information and security" />

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            tab === 'profile' ? 'border-[#0B0E92] text-[#0B0E92]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User size={15} /> Profile Info
        </button>
        <button
          onClick={() => setTab('password')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            tab === 'password' ? 'border-[#0B0E92] text-[#0B0E92]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Lock size={15} /> Update Password
        </button>
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <Card>
          <div className="flex items-center gap-5 mb-6">
            <Avatar name={user.name} size="lg" />
            <div>
              <h2 className="text-xl font-black text-slate-900">{user.name}</h2>
              <p className="text-slate-500 text-sm">{user.designation} · {user.department}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700 capitalize">{user.role}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            {[
              { label: 'Employee ID', value: user.employeeId },
              { label: 'Email', value: user.email },
              { label: 'Department', value: user.department },
              { label: 'Join Date', value: formatDate(user.joinDate) },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
                <p className="text-slate-800 font-medium">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-6">
            {editing ? (
              <div className="space-y-4">
                <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                <Input label="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                <div className="flex gap-3">
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-slate-800 font-medium">{user.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                  <p className="text-slate-800 font-medium">{user.address || '—'}</p>
                </div>
                <Button variant="outline" icon={<Edit2 size={14} />} onClick={() => setEditing(true)}>Edit Profile</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#EEF0FF] flex items-center justify-center">
              <Lock size={20} className="text-[#0B0E92]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Change Password</h3>
              <p className="text-sm text-slate-500">Choose a strong password of at least 8 characters</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
            <Input
              label="New Password"
              type="password"
              value={pwForm.newPw}
              onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
              required
              placeholder="Min. 8 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              required
              placeholder="Repeat new password"
            />
            {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
              <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
            )}
            {pwForm.newPw && pwForm.newPw.length > 0 && pwForm.newPw.length < 8 && (
              <p className="text-xs text-amber-600 font-medium">Password must be at least 8 characters</p>
            )}
            <Button type="submit" loading={pwLoading} icon={<Lock size={14} />}>
              Update Password
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
