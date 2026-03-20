// src/pages/admin/AdminDepartments.tsx

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDepartments } from '../../modules/departments/useDepartments';
import DepartmentCards from "../../modules/departments/components/DocumentCard";
import DepartmentForm from '../../modules/departments/components/DepartmentForm';
import { Modal, SearchInput, ConfirmDialog, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import Button from '../../components/ui/Button';
import type { Department } from '../../data/store';

export default function AdminDepartments() {
  const {
    filtered,
    search,
    setSearch,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    loading,
  } = useDepartments();

  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Departments"
        subtitle={`${filtered.length} department${filtered.length !== 1 ? 's' : ''}`}
        action={
          <Button
            icon={<Plus size={16} />}
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white
                       hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            Add Department
          </Button>
        }
      />

      {/* Search bar */}
      <Card padding={false}>
        <div className="p-4 border-b border-slate-100">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search departments…"
          />
        </div>

        {/* Card grid */}
        <DepartmentCards
          departments={filtered}
          onEdit={setEditing}
          onDelete={setDeleting}
          loading={loading}
        />
      </Card>

      {/* Create / Edit Modal */}
      {(showForm || editing) && (
        <Modal
          title={editing ? 'Edit Department' : 'Add Department'}
          onClose={() => { setShowForm(false); setEditing(null); }}
        >
          <DepartmentForm
            initial={editing ?? undefined}
            onSubmit={async (data) => {
              const ok = editing
                ? await updateDepartment(editing.id, data)
                : await createDepartment(data);
              if (ok) { setShowForm(false); setEditing(null); }
              return ok;
            }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <ConfirmDialog
          message={`Delete department "${deleting.name}"? This cannot be undone.`}
          onConfirm={async () => { await deleteDepartment(deleting.id); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}