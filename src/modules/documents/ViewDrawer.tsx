import { useEffect } from "react";
import { X, Download, AlertCircle } from "lucide-react";
import { Card } from "../../components/ui";
import { type ApiDocument } from "../../service/Documents.service";
import { extColor, getExtIcon, getExtLabel, formatBytes, fmtDate } from "../../utils/documenthelper";

interface Props {
  doc:      ApiDocument;
  userName: string;       // ✅ employee name passed from parent
  onClose:  () => void;
}

export default function ViewDrawer({ doc, userName, onClose }: Props) {
  const fileName = doc.fileName || doc.title;
  const colors   = extColor(fileName);
  const IconComp = getExtIcon(fileName);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ✅ Employee name row added; description moved to bottom
  const rows = [
    { label: "Employee",     value: userName || "—"                               },
    { label: "File name",    value: doc.fileName || doc.title                     },
    { label: "File size",    value: formatBytes(doc.fileSize ?? 0)                },
    { label: "Type",         value: getExtLabel(fileName)                         },
    { label: "Uploaded",     value: doc.createdAt ? fmtDate(doc.createdAt) : "—" },
    { label: "Last updated", value: doc.updatedAt ? fmtDate(doc.updatedAt) : "—" },
    { label: "Description",  value: doc.description?.trim() || "No description"  },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ animation: "slideIn 0.25s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-900">Document Details</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">

          {/* Icon + title */}
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center`}>
              <IconComp size={28} className={colors.text} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">{doc.title}</p>
              {doc.fileName && doc.fileName !== doc.title && (
                <p className="text-xs text-slate-400 mt-0.5 break-all">{doc.fileName}</p>
              )}
              {/* ✅ Employee name shown prominently under the title */}
              {userName && userName !== "—" && (
                <p className="text-xs font-semibold text-[#0B0E92] mt-1">👤 {userName}</p>
              )}
            </div>
          </div>

          {/* Detail rows */}
          <Card padding={false}>
            {rows.map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between gap-4 px-4 py-3 border-b border-slate-50 last:border-0"
              >
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0 w-28">
                  {label}
                </span>
                <span className="text-sm text-slate-700 font-medium text-right break-all">
                  {value}
                </span>
              </div>
            ))}
          </Card>

          {/* Download */}
          {doc.fileUrl ? (
            <a
              href={doc.fileUrl}
              download={doc.fileName || doc.title}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0B0E92] text-white text-sm font-bold hover:bg-[#0a0d7a] transition-colors"
            >
              <Download size={15} /> Download File
            </a>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700">No download URL available.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}