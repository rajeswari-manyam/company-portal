import { Download, Trash2, FileText } from "lucide-react";
import { type ApiDocument } from "../../service/Documents.service";
import { extColor, getExtLabel, formatBytes, fmtDate } from "../../utils/documenthelper";

// ─── Doc Row ──────────────────────────────────────────────────────────────────

interface DocRowProps {
  doc:      ApiDocument;
  userName: string;
  onDelete: (doc: ApiDocument) => void;
}

export function DocRow({ doc, userName, onDelete }: DocRowProps) {
  const fileName = doc.fileName ?? doc.title ?? "";
  const colors   = extColor(fileName);
  const ext      = getExtLabel(fileName);

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] flex items-center justify-center flex-shrink-0">
        <FileText size={18} className="text-[#0B0E92]" />
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {doc.title ?? doc.fileName}
          </p>
          <span className={`hidden sm:inline-block text-[10px] font-black px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
            {ext}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-xs text-slate-400">{userName}</p>
          <span className="text-slate-300">·</span>
          <p className="text-xs text-slate-400">
            {doc.fileSize ? formatBytes(doc.fileSize) : "—"}
          </p>
          <span className="text-slate-300">·</span>
          <p className="text-xs text-slate-400">{fmtDate(doc.createdAt)}</p>
        </div>
      </div>

      {/* Download */}
      {doc.fileUrl && (
        <a
          href={doc.fileUrl}
          download={doc.fileName}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
          title="Download"
        >
          <Download size={15} />
        </a>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(doc)}
        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
        title="Delete"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function DocRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-2/5" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
      <div className="w-7 h-7 bg-slate-100 rounded-lg" />
      <div className="w-7 h-7 bg-slate-100 rounded-lg" />
    </div>
  );
}
