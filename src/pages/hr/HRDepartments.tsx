import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDepartments } from '../../modules/departments/useDepartments';
import DepartmentTable from '../../modules/departments/components/DepartmentTable';
import DepartmentForm from '../../modules/departments/components/DepartmentForm';
import { Modal, SearchInput, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import type { Department } from '../../data/store';

export default function HRDepartments() {
  const { filtered, search, setSearch, createDepartment, updateDepartment } = useDepartments();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        subtitle="View and manage department information"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Add Department</Button>}
      />
      <Card padding={false}>
        <div className="p-4 border-b border-slate-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Search departments…" />
        </div>
        {/* HR can edit but not delete */}
        <DepartmentTable departments={filtered} onEdit={setEditing} canEdit canDelete={false} />
      </Card>

      {(showForm || editing) && (
        <Modal title={editing ? 'Edit Department' : 'Add Department'} onClose={() => { setShowForm(false); setEditing(null); }}>
          <DepartmentForm
            initial={editing ?? undefined}
            onSubmit={async (data) => {
              const ok = editing ? await updateDepartment(editing.id, data) : await createDepartment(data);
              if (ok) { setShowForm(false); setEditing(null); }
              return ok;
            }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
