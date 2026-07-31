import { FileText, FileImage, FileVideo, FileArchive } from "lucide-react";

export function getExtIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return FileImage;
  if (["mp4", "mov", "avi", "mkv"].includes(ext))                  return FileVideo;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext))             return FileArchive;
  return FileText;
}

export function getExtLabel(fileName: string) {
  return fileName.split(".").pop()?.toUpperCase().slice(0, 4) || "DOC";
}

export function formatBytes(bytes: number) {
  if (!bytes)              return "—";
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

export function getApiError(err: unknown): string {
  if (err && typeof err === "object") {
    const e   = err as Record<string, unknown>;
    const msg = (e?.response as Record<string, unknown>)?.data as Record<string, unknown>;
    if (typeof msg?.message === "string") return msg.message;
    if (typeof e?.message   === "string") return e.message;
  }
  return "Something went wrong. Please try again.";
}

const EXT_COLORS: Record<string, { bg: string; text: string }> = {
  PDF:     { bg: "bg-red-50",     text: "text-red-600"     },
  DOC:     { bg: "bg-blue-50",    text: "text-blue-600"    },
  DOCX:    { bg: "bg-blue-50",    text: "text-blue-600"    },
  XLS:     { bg: "bg-emerald-50", text: "text-emerald-600" },
  XLSX:    { bg: "bg-emerald-50", text: "text-emerald-600" },
  PNG:     { bg: "bg-pink-50",    text: "text-pink-600"    },
  JPG:     { bg: "bg-pink-50",    text: "text-pink-600"    },
  JPEG:    { bg: "bg-pink-50",    text: "text-pink-600"    },
  ZIP:     { bg: "bg-amber-50",   text: "text-amber-600"   },
  DEFAULT: { bg: "bg-slate-100",  text: "text-slate-500"   },
};

export function extColor(fileName: string) {
  const ext = getExtLabel(fileName);
  return EXT_COLORS[ext] ?? EXT_COLORS.DEFAULT;
}
