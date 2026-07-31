import { useState, useEffect } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getDocumentsByEmployeeId,
  type ApiDocument,
} from "../../service/Documents.service";
import { Button, EmptyState, SearchInput } from "../../components/ui";
import { getApiError } from "../../utils/documenthelper";
import { DocCard, DocCardSkeleton } from "../../modules/documents/DocCard";
import { EditModal, DeleteModal } from "../../modules/documents/DocumentModals";
import UploadModal from "../../modules/documents/UploadModal";
import ViewDrawer from "../../modules/documents/ViewDrawer";

type ModalState =
  | { type: "upload" }
  | { type: "edit";   doc: ApiDocument }
  | { type: "delete"; doc: ApiDocument }
  | { type: "view";   doc: ApiDocument }
  | null;

export default function MyDocuments() {
  const { user } = useAuth();

  const employeeId: string =
    (user as any)?._id ?? (user as any)?.id ?? "";

  // ✅ Get logged-in user's name to pass into cards and drawer
  const userName: string =
    (user as any)?.name ?? "Me";

  const [docs,    setDocs]    = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState<ModalState>(null);

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getDocumentsByEmployeeId(employeeId);
        if (!cancelled) setDocs(result);
      } catch (err: unknown) {
        if (!cancelled) setError(getApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [employeeId]);

  const filtered = docs.filter(d => {
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.fileName?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { transform:translateX(100%); }           to { transform:translateX(0); }            }
      `}</style>

      <div className="space-y-6 pb-10 px-4 sm:px-6 lg:px-0">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[1.75rem] font-black text-slate-900 tracking-tight">
              My Documents
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {loading
                ? "Loading…"
                : docs.length > 0
                ? `${docs.length} document${docs.length !== 1 ? "s" : ""} stored`
                : "Upload and manage your documents"}
            </p>
          </div>

          <Button
            variant="primary"
            icon={<Upload size={15} />}
            onClick={() => setModal({ type: "upload" })}
          >
            Upload Document
          </Button>
        </div>

        {/* ── Search bar ── */}
        {docs.length > 0 && (
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search documents…"
            className="max-w-sm"
          />
        )}

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto text-xs text-red-500 underline hover:text-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <DocCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── Document grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc, i) => (
              <DocCard
                key={doc._id}
                doc={doc}
                index={i}
                userName={userName}                            // ✅ pass name to card
                onView={doc   => setModal({ type: "view",   doc })}
                onEdit={doc   => setModal({ type: "edit",   doc })}
                onDelete={doc => setModal({ type: "delete", doc })}
              />
            ))}
          </div>
        )}

        {/* ── Search returned nothing ── */}
        {!loading && !error && docs.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon="🔍"
            message={`No results for "${search}"`}
            description="Try a different keyword."
            action={
              <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
                Clear search
              </Button>
            }
          />
        )}

        {/* ── No docs at all ── */}
        {!loading && !error && docs.length === 0 && (
          <EmptyState
            icon="📄"
            message="No documents yet"
            description="Upload your first document to get started."
            action={
              <Button
                variant="outline"
                icon={<Upload size={14} />}
                onClick={() => setModal({ type: "upload" })}
              >
                Upload Document
              </Button>
            }
          />
        )}

      </div>

      {/* ── Modals ── */}

      {modal?.type === "upload" && (
        <UploadModal
          employees={[{ _id: employeeId, name: userName }]}
          hideEmployeeSelect
          onClose={() => setModal(null)}
          onUploaded={doc => {
            setDocs(p => [doc, ...p]);
            setModal(null);
          }}
        />
      )}

      {modal?.type === "edit" && (
        <EditModal
          doc={modal.doc}
          onClose={() => setModal(null)}
          onUpdated={doc => {
            setDocs(p => p.map(d => (d._id === doc._id ? doc : d)));
            setModal(null);
          }}
        />
      )}

      {modal?.type === "delete" && (
        <DeleteModal
          doc={modal.doc}
          onClose={() => setModal(null)}
          onDeleted={id => {
            setDocs(p => p.filter(d => d._id !== id));
            setModal(null);
          }}
        />
      )}

      {modal?.type === "view" && (
        <ViewDrawer
          doc={modal.doc}
          userName={userName}                                  // ✅ pass name to drawer
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}