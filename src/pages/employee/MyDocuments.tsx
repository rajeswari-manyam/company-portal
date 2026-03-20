import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDocumentsForUser, type Document } from '../../data/store';
import { FileText } from 'lucide-react';
import { Card, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/common';
import { formatDate } from '../../utils/helpers';

const DOC_TYPE_COLOR: Record<string, string> = {
  'offer-letter': 'bg-indigo-100 text-indigo-700',
  'resume': 'bg-blue-100 text-blue-700',
  'id-proof': 'bg-amber-100 text-amber-700',
  'certificate': 'bg-emerald-100 text-emerald-700',
  'other': 'bg-slate-100 text-slate-600',
};

const DOC_LABEL: Record<string, string> = {
  'offer-letter': 'Offer Letter', 'resume': 'Resume',
  'id-proof': 'ID Proof', 'certificate': 'Certificate', 'other': 'Other',
};

export default function MyDocuments() {
  const { user } = useAuth();
  const [docs] = useState<Document[]>(() => getDocumentsForUser(user?.id ?? ''));

  return (
    <div className="space-y-6">
      <PageHeader title="My Documents" subtitle="View your uploaded documents" />
      <Card padding={false}>
        {docs.length === 0 ? (
          <EmptyState icon="📄" message="No documents found" description="Your HR team will upload your documents here." />
        ) : (
          <div className="divide-y divide-slate-50">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-[#0B0E92]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.size} · Uploaded {formatDate(doc.uploadedOn)}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${DOC_TYPE_COLOR[doc.type] ?? DOC_TYPE_COLOR.other}`}>
                  {DOC_LABEL[doc.type] ?? doc.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
