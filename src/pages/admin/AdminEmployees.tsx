import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useUsers } from '../../modules/users/useUsers';
import UserTable from '../../modules/users/components/UserTable';
import UserForm from '../../modules/users/components/UserForm';
import { Modal, SearchInput, Select, ConfirmDialog, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import type { UserRecord } from '../../types';

export default function AdminEmployees() {
  const { filtered, search, setSearch, roleFilter, setRoleFilter, loading, createUser, updateUser, deleteUser } = useUsers();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState<UserRecord | null>(null);

  const handleCreate = async (data: Omit<UserRecord, 'id'>) => {
    const ok = await createUser(data);
    if (ok) setShowForm(false);
    return ok;
  };

  const handleUpdate = async (data: Omit<UserRecord, 'id'>) => {
    if (!editing) return false;
    const ok = await updateUser(editing.id, data);
    if (ok) setEditing(null);
    return ok;
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteUser(deleting.id);
    setDeleting(null);
  };

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'hr', label: 'HR' },
    { value: 'employee', label: 'Employee' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        subtitle="Manage all users and their roles"
        action={
          <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Add Employee</Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, ID…" className="flex-1 min-w-[200px]" />
          <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} options={roleOptions} className="w-40" />
        </div>
        <UserTable
          users={filtered}
          onEdit={setEditing}
          onDelete={setDeleting}
          canEdit
          canDelete
        />
      </Card>

      {(showForm || editing) && (
        <Modal title={editing ? 'Edit User' : 'Add Employee'} onClose={() => { setShowForm(false); setEditing(null); }} size="lg">
          <UserForm
            initial={editing ?? undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            loading={loading}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Are you sure you want to delete ${deleting.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
