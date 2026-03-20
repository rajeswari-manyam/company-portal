


import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDepartments } from '../../modules/departments/useDepartments';
import DepartmentTable from '../../modules/departments/components/DepartmentTable';
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
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  return (
    <div className="space-y-6">
      {/* ✅ Header */}
      <PageHeader
        title="Departments"
        subtitle="Manage organizational departments"
        action={
          <Button
            icon={<Plus size={16} />}
            onClick={() => setShowForm(true)}
          >
            Add Department
          </Button>
        }
      />

      {/* ✅ Table Section */}
      <Card padding={false}>
        <div className="p-4 border-b border-slate-100">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search departments…"
          />
        </div>

        {/* 🔄 Loading */}
        {loading && (
          <div className="p-6 text-center text-slate-500">
            Loading departments...
          </div>
        )}

        {/* 📊 Table */}
        {!loading && (
          <DepartmentTable
            departments={filtered}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        )}
      </Card>

      {/* ✅ Create / Edit Modal */}
      {(showForm || editing) && (
        <Modal
          title={editing ? 'Edit Department' : 'Add Department'}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        >
          <DepartmentForm
            initial={editing ?? undefined}
            onSubmit={async (data) => {
              const ok = editing
                ? await updateDepartment(editing.id, data)
                : await createDepartment(data);

              if (ok) {
                setShowForm(false);
                setEditing(null);
              }

              return ok;
            }}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {/* 🗑 Delete Confirmation */}
      {deleting && (
        <ConfirmDialog
          message={`Delete department "${deleting.name}"? This cannot be undone.`}
          onConfirm={async () => {
            await deleteDepartment(deleting.id);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}