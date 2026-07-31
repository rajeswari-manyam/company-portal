import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { getAllDocuments, type ApiDocument } from "../../service/Documents.service";
import { getEmployees } from "../../service/Empolyee.service";
import { Card, EmptyState, SearchInput, Select } from "../../components/ui";
import { PageHeader } from "../../components/common";
import { DocRow, DocRowSkeleton } from "../../modules/documents/DocRow";
import { DeleteModal } from "../../modules/documents/DocumentModals";
import UploadModal from "../../modules/documents/UploadModal";
import { getApiError } from "../../utils/documenthelper";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "upload" }
  | { type: "delete"; doc: ApiDocument }
  | null;

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Image" },
  { value: "word", label: "Word" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [docs, empRes] = await Promise.all([
          getAllDocuments(),
          getEmployees(),   // returns { success: true, users: EmployeeRecord[] }
        ]);

        if (cancelled) return;

        setDocuments(docs);

        // ✅ getEmployees returns { success, users: [...] }
        const list = empRes.users ?? [];
        setEmployees(list.map(u => ({ _id: u._id, name: u.name })));

        // Build _id → name lookup map
        const map: Record<string, string> = {};
        list.forEach(u => { map[u._id] = u.name; });
        setUserMap(map);

      } catch (err: unknown) {
        if (!cancelled) toast.error(getApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ✅ Resolve employee name: userMap lookup → meaningful fallback
  const getUserName = (id: string): string => {
    if (!id) return "—";
    return userMap[id] ?? "Unknown Employee";
  };

  const addDoc = (doc: ApiDocument) => setDocuments(prev => [doc, ...prev]);
  const removeDoc = (id: string) => setDocuments(prev => prev.filter(d => d._id !== id));

  // ── Client-side filter ─────────────────────────────────────────────────────
  const filtered = documents.filter(d => {
    const name = getUserName(d.employeeId).toLowerCase();
    const docName = (d.title ?? d.fileName ?? "").toLowerCase();
    const q = search.toLowerCase();

    const matchSearch =
      !search ||
      name.includes(q) ||
      docName.includes(q);

    // ✅ fileType from backend: "image/png", "application/pdf", "application/msword"
    const mime = (d.mimeType ?? "").toLowerCase();
    const matchType =
      typeFilter === "all" ? true :
        typeFilter === "pdf" ? mime.includes("pdf") :
          typeFilter === "image" ? mime.includes("image") :
            typeFilter === "word" ? mime.includes("word") || mime.includes("msword") || mime.includes("officedocument")
              : true;

    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Documents" subtitle="Manage all employee documents" />
        <button
          onClick={() => setModal({ type: "upload" })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-gradient-to-r from-[#0B0E92] to-[#69A6F0]
            text-white text-sm font-semibold
            shadow-md shadow-[#0B0E92]/25
            hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <Upload size={15} />
          Upload Document
        </button>
      </div>

      {/* ── Table card ── */}
      <Card padding={false}>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by employee or filename…"
            className="flex-1 min-w-[200px]"
          />
          <Select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            options={TYPE_OPTIONS}
            className="w-44"
          />
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <DocRowSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <EmptyState icon="📄" message="No documents found" />
        )}

        {/* Rows */}
        {!loading && filtered.length > 0 && (
          <div className="divide-y divide-slate-50">
            {filtered.map(doc => (
              <DocRow
                key={doc._id}
                doc={doc}
                userName={getUserName(doc.employeeId)}
                onDelete={doc => setModal({ type: "delete", doc })}
              />
            ))}
          </div>
        )}

      </Card>

      {/* ── Modals ── */}
      {modal?.type === "upload" && (
        <UploadModal
          employees={employees}
          onClose={() => setModal(null)}
          onUploaded={doc => { addDoc(doc); setModal(null); }}
        />
      )}

      {modal?.type === "delete" && (
        <DeleteModal
          doc={modal.doc}
          onClose={() => setModal(null)}
          onDeleted={id => { removeDoc(id); setModal(null); }}
        />
      )}

    </div>
  );
}