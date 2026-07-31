import React from "react";
import { Download, Trash2, Pencil, Eye } from "lucide-react";
import { Button, Card } from "../../components/ui";
import { type ApiDocument } from "../../service/Documents.service";
import { extColor, getExtLabel, getExtIcon, formatBytes, fmtDate } from "../../utils/documenthelper";

// ─── DocCard ──────────────────────────────────────────────────────────────────

interface DocCardProps {
  doc:      ApiDocument;
  index:    number;
  userName: string;                  // ✅ employee name
  onView:   (doc: ApiDocument) => void;
  onEdit:   (doc: ApiDocument) => void;
  onDelete: (doc: ApiDocument) => void;
}

export function DocCard({ doc, index, userName, onView, onEdit, onDelete }: DocCardProps) {
  const fileName = doc.fileName || doc.title;
  const colors   = extColor(fileName);
  const ext      = getExtLabel(fileName);
  const IconComp = getExtIcon(fileName);

  return (
    <div style={{ animation: `fadeUp 0.35s ease ${index * 50}ms both` } as React.CSSProperties}>
      <Card
        padding={false}
        className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      >
        <div className="p-4 sm:p-5">

          {/* Title row */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center`}>
              <span className={`text-[10px] font-black ${colors.text}`}>{ext}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800 text-sm leading-snug truncate group-hover:text-[#0B0E92] transition-colors">
                {doc.title}
              </p>
              {/* ✅ Show fileName under title (not description) */}
              {doc.fileName && doc.fileName !== doc.title && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.fileName}</p>
              )}
            </div>
          </div>

          {/* ✅ Employee name row */}
          {userName && userName !== "—" && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] text-slate-400">👤</span>
              <span className="text-xs font-semibold text-slate-600">{userName}</span>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-4">
            <IconComp size={11} />
            <span>{formatBytes(doc.fileSize ?? 0)}</span>
            <span className="text-slate-200">·</span>
            <span>{fmtDate(doc.createdAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" variant="ghost"   icon={<Eye    size={12} />} onClick={() => onView(doc)}>View</Button>
            <Button size="sm" variant="outline" icon={<Pencil size={12} />} onClick={() => onEdit(doc)}>Edit</Button>

            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                download={doc.fileName || doc.title}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                           text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <Download size={12} /> Download
              </a>
            )}

            <Button
              size="sm" variant="danger"
              icon={<Trash2 size={12} />}
              onClick={() => onDelete(doc)}
              className="ml-auto"
            />
          </div>

        </div>
      </Card>
    </div>
  );
}

// ─── DocCardSkeleton ──────────────────────────────────────────────────────────

export function DocCardSkeleton() {
  return (
    <Card padding={false} className="p-5 space-y-3 animate-pulse">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded w-1/4" />
      <div className="h-3 bg-slate-100 rounded w-1/3" />
      <div className="flex gap-2">
        <div className="h-7 bg-slate-100 rounded-xl w-16" />
        <div className="h-7 bg-slate-100 rounded-xl w-14" />
        <div className="h-7 bg-slate-100 rounded-xl w-20" />
      </div>
    </Card>
  );
}