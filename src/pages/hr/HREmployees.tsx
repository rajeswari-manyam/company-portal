import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useUsers } from '../../modules/users/useUsers';
import UserTable from '../../modules/users/components/UserTable';
import UserForm from '../../modules/users/components/UserForm';
import { Modal, SearchInput, Select, ConfirmDialog, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import type { UserRecord } from '../../types';

export default function HREmployees() {
  const { filtered, search, setSearch, roleFilter, setRoleFilter, loading, createUser, updateUser } = useUsers();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);

  // HR can create & edit but not delete
  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'employee', label: 'Employee' },
    { value: 'hr', label: 'HR' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        subtitle="View and manage employee records"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Add Employee</Button>}
      />
      <Card padding={false}>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search employees…" className="flex-1 min-w-[200px]" />
          <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} options={roleOptions} className="w-36" />
        </div>
        <UserTable users={filtered} onEdit={setEditing} canEdit canDelete={false} />
      </Card>

      {(showForm || editing) && (
        <Modal title={editing ? 'Edit Employee' : 'Add Employee'} onClose={() => { setShowForm(false); setEditing(null); }} size="lg">
          <UserForm
            initial={editing ?? undefined}
            onSubmit={async (data) => {
              const ok = editing ? await updateUser(editing.id, data) : await createUser(data);
              if (ok) { setShowForm(false); setEditing(null); }
              return ok;
            }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            loading={loading}
          />
        </Modal>
      )}
    </div>
  );
}
