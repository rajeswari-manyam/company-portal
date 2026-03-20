import { useState } from 'react';
import { FileText, File, Trash2, Download } from 'lucide-react';
import { getAllDocuments, deleteDocument, type Document } from '../../data/store';
import { getUsers } from '../../data/store';
import { SearchInput, Select, Badge, ConfirmDialog, EmptyState, Card } from '../../components/ui';
import { PageHeader } from '../../components/common';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DOC_TYPE_COLOR: Record<string, string> = {
  'offer-letter': 'bg-indigo-100 text-indigo-700',
  'resume': 'bg-blue-100 text-blue-700',
  'id-proof': 'bg-amber-100 text-amber-700',
  'certificate': 'bg-emerald-100 text-emerald-700',
  'other': 'bg-slate-100 text-slate-600',
};

const DOC_TYPE_LABEL: Record<string, string> = {
  'offer-letter': 'Offer Letter',
  'resume': 'Resume',
  'id-proof': 'ID Proof',
  'certificate': 'Certificate',
  'other': 'Other',
};

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<Document[]>(() => getAllDocuments());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleting, setDeleting] = useState<Document | null>(null);

  const users = getUsers();
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name ?? userId;

  const refresh = () => setDocuments(getAllDocuments());

  const filtered = documents.filter(d => {
    const name = getUserName(d.userId).toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || d.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleDelete = () => {
    if (!deleting) return;
    deleteDocument(deleting.id);
    toast.success('Document deleted');
    refresh();
    setDeleting(null);
  };

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'offer-letter', label: 'Offer Letter' },
    { value: 'resume', label: 'Resume' },
    { value: 'id-proof', label: 'ID Proof' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" subtitle="Manage all employee documents" />

      <Card padding={false}>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by employee or filename…" className="flex-1 min-w-[200px]" />
          <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} options={typeOptions} className="w-44" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📄" message="No documents found" />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-[#0B0E92]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400">{getUserName(doc.userId)}</p>
                    <span className="text-slate-300">·</span>
                    <p className="text-xs text-slate-400">{doc.size}</p>
                    <span className="text-slate-300">·</span>
                    <p className="text-xs text-slate-400">{formatDate(doc.uploadedOn)}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${DOC_TYPE_COLOR[doc.type] ?? DOC_TYPE_COLOR.other}`}>
                  {DOC_TYPE_LABEL[doc.type] ?? doc.type}
                </span>
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    download={doc.name}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <Download size={15} />
                  </a>
                )}
                <button onClick={() => setDeleting(doc)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {deleting && (
        <ConfirmDialog
          message={`Delete "${deleting.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
