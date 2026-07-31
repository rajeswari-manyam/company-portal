import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, Modal, Textarea } from "../../components/ui";
import { uploadDocument, type ApiDocument } from "../../service/Documents.service";
import { extColor, getExtLabel, formatBytes, getApiError } from "../../utils/documenthelper";

interface Props {
  employees: { _id: string; name: string }[];
  onClose: () => void;
  onUploaded: (doc: ApiDocument) => void;
  /** When true, hides the employee dropdown and auto-uses employees[0]._id */
  hideEmployeeSelect?: boolean;
}

// ✅ Only types the backend multer fileFilter allows:
//    PDF, Images (jpg/jpeg/png), Word (doc/docx)
const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg";
const ACCEPTED_LABEL = "PDF, DOC, DOCX, PNG, JPG · Max 50 MB";

export default function UploadModal({
  employees,
  onClose,
  onUploaded,
  hideEmployeeSelect = false,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [employeeId, setEmployeeId] = useState(
    hideEmployeeSelect ? (employees[0]?._id ?? "") : ""
  );
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<{
    employeeId?: string; file?: string; title?: string;
  }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => {
    // ✅ Client-side mime check matching backend fileFilter
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",                                                  // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    ];

    if (!allowed.includes(f.type)) {
      setErrors(p => ({ ...p, file: "Only PDF, Image (JPG/PNG), and Word documents are allowed." }));
      return;
    }

    if (f.size > 50 * 1024 * 1024) {
      setErrors(p => ({ ...p, file: "File must be under 50 MB." }));
      return;
    }

    setFile(f);
    setErrors(p => ({ ...p, file: undefined }));
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!hideEmployeeSelect && !employeeId) e.employeeId = "Employee is required.";
    if (!file) e.file = "Please select a file.";
    if (!title.trim()) e.title = "Title is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const doc = await uploadDocument({
        title: title.trim(),
        description: desc.trim(),
        employeeId,
        file: file!,
      });
      toast.success("Document uploaded!");
      onUploaded(doc);
      onClose();
    } catch (err: unknown) {
      toast.error(getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Upload Document"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            variant="primary"
            icon={<Upload size={14} />}
            onClick={handleSubmit}
            loading={busy}
          >
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">

        {/* ── Employee selector (admin only) ── */}
        {!hideEmployeeSelect && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={employeeId}
              onChange={e => {
                setEmployeeId(e.target.value);
                if (errors.employeeId) setErrors(p => ({ ...p, employeeId: undefined }));
              }}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50
                focus:outline-none focus:ring-2 focus:ring-[#0B0E92]/20 focus:border-[#0B0E92]
                ${errors.employeeId ? "border-red-300" : "border-slate-200"}`}
            >
              <option value="">Select employee…</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
            {errors.employeeId && (
              <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>
            )}
          </div>
        )}

        {/* ── Drop zone ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            File <span className="text-red-500">*</span>
          </label>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) pickFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
              ${errors.file
                ? "border-red-300 bg-red-50"
                : dragOver
                  ? "border-[#69A6F0] bg-blue-50"
                  : file
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 hover:border-[#69A6F0] hover:bg-slate-50"}`}
          >
            {/* ✅ accept only backend-allowed types */}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_TYPES}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) pickFile(f);
                // reset input so same file can be re-selected after removal
                e.target.value = "";
              }}
            />

            {file ? (
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${extColor(file.name).bg} ${extColor(file.name).text}`}
                >
                  {getExtLabel(file.name)}
                </span>
                <p className="text-sm font-semibold text-slate-700 mt-1 truncate max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setFile(null);
                    setTitle("");
                  }}
                  className="text-xs text-red-400 hover:text-red-600 mt-1 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={28} className="text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">
                  Drop a file or <span className="text-[#0B0E92]">browse</span>
                </p>
                <p className="text-xs text-slate-400">{ACCEPTED_LABEL}</p>
              </div>
            )}
          </div>
          {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
        </div>

        {/* ── Title ── */}
        <Input
          label="Title"
          required
          value={title}
          error={errors.title}
          onChange={e => {
            setTitle(e.target.value);
            if (errors.title) setErrors(p => ({ ...p, title: undefined }));
          }}
          placeholder="e.g. Offer Letter 2025"
        />

        {/* ── Description ── */}
        <Textarea
          label="Description"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={2}
          placeholder="Optional notes…"
        />

      </div>
    </Modal>
  );
}