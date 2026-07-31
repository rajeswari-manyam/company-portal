import { useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import { AlertCircle } from "lucide-react";
import { Button, Input, Modal, Textarea, ConfirmDialog } from "../../components/ui";
import { updateDocument, deleteDocument, type ApiDocument } from "../../service/Documents.service";
import { getApiError } from "../../utils/documenthelper";

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditProps {
  doc: ApiDocument;
  onClose: () => void;
  onUpdated: (doc: ApiDocument) => void;
}

export function EditModal({ doc, onClose, onUpdated }: EditProps) {
  const [title, setTitle] = useState(doc.title);
  const [desc, setDesc] = useState(doc.description ?? "");
  const [busy, setBusy] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [serverError, setServerError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) { setTitleError("Title is required."); return; }
    setBusy(true);
    setServerError("");
    try {
      const updated = await updateDocument(doc._id, { title: title.trim(), description: desc.trim() });
      toast.success("Document updated!");
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      setServerError(getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Edit Document"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" icon={<Check size={14} />} onClick={handleSave} loading={busy}>
            {busy ? "Saving…" : "Save Changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {serverError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}
        <Input
          label="Title" required
          value={title} error={titleError}
          onChange={(e: any) => { setTitle(e.target.value); if (titleError) setTitleError(""); }}
        />
        <Textarea label="Description" value={desc} rows={3} onChange={(e: any) => setDesc(e.target.value)} />
      </div>
    </Modal>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

interface DeleteProps {
  doc: ApiDocument;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export function DeleteModal({ doc, onClose, onDeleted }: DeleteProps) {
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteDocument(doc._id);
      toast.success("Document deleted.");
      onDeleted(doc._id);
      onClose();
    } catch (err: unknown) {
      toast.error(getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDialog
      title="Delete Document?"
      message={`"${doc.title}" will be permanently removed. This cannot be undone.`}
      confirmLabel="Delete"
      variant="danger"
      loading={busy}
      onConfirm={handleDelete}
      onCancel={onClose}
    />
  );
}
