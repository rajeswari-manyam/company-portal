import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Document } from '../../data/store';
import { FileText, Upload, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/common';
import { formatDate } from '../../utils/helpers';

// ✅ Local Storage Helpers
const STORAGE_KEY = "my_documents";

function getDocuments(): Document[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse documents", e);
    return [];
  }
}

function saveDocuments(docs: Document[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
      toast.error('Local storage is full! Please delete some old documents or upload a smaller file.');
    } else {
      toast.error('Failed to save document. It might be too large.');
    }
    console.error("Local storage error:", e);
    return false;
  }
}

// removed old DOC_TYPE_COLOR and DOC_LABEL constants as they're not needed for the new UI

export default function MyDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);

  // ✅ Load from localStorage (and filter by the logged-in user so they don't see everyone's docs!)
  useEffect(() => {
    const storedDocs = getDocuments();
    setDocs(storedDocs.filter(d => d.userId === user?.id));
  }, [user?.id]);

  // ✅ Upload handler
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local Storage limit is 5MB. Base64 adds ~33% overhead. Max safe file size is ~3.5MB.
    // Let's cap it at 3MB to be safe and leave room for the rest of the app's state.
    if (file.size > 3 * 1024 * 1024) {
      toast.error('File is too large! Please upload a file smaller than 3MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const newDoc: Document = {
        id: Date.now().toString(),
        userId: user?.id || "",
        name: file.name,
        type: "other",
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedOn: new Date().toISOString(),
        fileUrl: reader.result as string
      };

      // Try appending inside localStorage logic
      const allStored = getDocuments();
      const nextStored = [newDoc, ...allStored];
      
      const success = saveDocuments(nextStored);
      if (success) {
        // If it successfully saved to DB, update the UI
        setDocs(prev => [newDoc, ...prev]);
        toast.success("Document uploaded successfully!");
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Documents"
        action={
          <label className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:opacity-95">
            <Upload size={16} />
            Upload
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        }
      />

      {docs.length === 0 ? (
        <Card padding={false}>
          <EmptyState
            icon="📄"
            message="No documents found"
            description="Upload your first document."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          {docs.map((doc) => {
            // Extract extension like "PDF", "PNG", "DOC"
            const ext = doc.name.split('.').pop()?.toUpperCase().slice(0, 4) || 'DOC';
            return (
              <div
                key={doc.id}
                className="bg-white rounded-[14px] shadow-sm border border-slate-100 p-4 lg:p-5 flex items-center gap-4 hover:shadow-md transition-all group"
              >
                {/* Square Icon replacing <FileText /> pill */}
                <div className="w-12 h-12 rounded-[10px] bg-[#EEF0FF] text-[#0B0E92] flex items-center justify-center flex-shrink-0 font-bold text-sm tracking-wide">
                  {ext}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-slate-800 truncate group-hover:text-[#0B0E92] transition-colors">
                    {doc.name}
                  </p>
                  <p className="text-[13px] text-slate-400 mt-0.5">
                    {doc.size} · {new Date(doc.uploadedOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Download Circular Button */}
                <a
                  href={doc.fileUrl}
                  download={doc.name}
                  className="w-9 h-9 flex-shrink-0 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-[#0B0E92] hover:to-[#69A6F0] hover:border-transparent transition-all"
                >
                  <Download size={15} />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}