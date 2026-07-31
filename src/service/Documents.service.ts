import apiClient from "./apiClient";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface ApiDocument {
  _id: string;
  title: string;
  description: string;
  employeeId: string;
  employeeName?: string;  // resolved from userMap in the page
  fileUrl: string;        // built from filePath
  fileName: string;       // originalName from backend
  fileSize?: number;
  mimeType?: string;      // fileType from backend
  createdAt: string;      // uploadedAt from backend
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL DOCUMENTS
// GET /getdocumentsAll
// Backend returns: { success: true, data: [...] }
// Doc shape: { _id, title, description, employeeId, filePath, fileType, originalName, uploadedAt }
// ─────────────────────────────────────────────────────────────────────────────
export const getAllDocuments = async (): Promise<ApiDocument[]> => {
  const res = await apiClient.get("/getdocumentsAll");
  const raw: any[] = res.data?.data ?? [];
  return raw.map(normalizeDoc);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET DOCUMENT BY ID
// GET /documentsById/:documentId
// Backend returns: { success: true, data: { ...doc, employee: { name, email, department } | null } }
// ─────────────────────────────────────────────────────────────────────────────
export const getDocumentById = async (documentId: string): Promise<ApiDocument> => {
  const res = await apiClient.get(`/documentsById/${documentId}`);
  return normalizeDoc(res.data?.data ?? res.data);
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD DOCUMENT
// POST /upload  (multipart/form-data)
// Fields: title, description, employeeId, files (File)
// Backend returns: { success: true, message, documents: [...] }
// ─────────────────────────────────────────────────────────────────────────────
export const uploadDocument = async (data: {
  title: string;
  description: string;
  employeeId: string;
  file: File;
}): Promise<ApiDocument> => {
  const form = new FormData();
  form.append("title", data.title);
  form.append("description", data.description);
  form.append("employeeId", data.employeeId);
  form.append("files", data.file, data.file.name);

  const res = await apiClient.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // backend returns { success, documents: [...] } — grab first doc
  const doc = res.data?.documents?.[0] ?? res.data?.data ?? res.data;
  return normalizeDoc(doc);
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE DOCUMENT
// PUT /updateDocumentById/:documentId
// Backend returns: { success: true, data: updatedDoc }
// ─────────────────────────────────────────────────────────────────────────────
export const updateDocument = async (
  documentId: string,
  data: { title: string; description: string }
): Promise<ApiDocument> => {
  const res = await apiClient.put(`/updateDocumentById/${documentId}`, data);
  return normalizeDoc(res.data?.data ?? res.data);
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE DOCUMENT
// DELETE /deleteDocumentById/:documentId
// Backend returns: { success: true, message: "Document deleted successfully" }
// ─────────────────────────────────────────────────────────────────────────────
export const deleteDocument = async (documentId: string): Promise<void> => {
  await apiClient.delete(`/deleteDocumentById/${documentId}`);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET DOCUMENTS BY EMPLOYEE ID
// GET /employee/:employeeId
// Backend returns: { success: true, count, data: [...] }
// ─────────────────────────────────────────────────────────────────────────────
export const getDocumentsByEmployeeId = async (
  employeeId: string
): Promise<ApiDocument[]> => {
  const res = await apiClient.get(`/employee/${employeeId}`);
  const raw: any[] = res.data?.data ?? [];
  return raw.map(normalizeDoc);
};

// ─────────────────────────────────────────────────────────────────────────────
// Normalizer — maps exact backend shape to ApiDocument
//
// Exact backend fields from Postman:
//   _id, title, description, employeeId (ObjectId string),
//   filePath    → "uploads\\filename.png"
//   fileType    → "image/png"
//   originalName→ "bike.png"
//   uploadedAt  → "2026-03-27T04:23:37.452Z"   ← NOT createdAt!
//   __v
//
// getDocumentById also returns:
//   employee: { name, email, department } | null
// ─────────────────────────────────────────────────────────────────────────────
function normalizeDoc(p: any): ApiDocument {
  return {
    _id:         p._id ?? "",
    title:       p.title ?? p.originalName ?? "Untitled",
    description: p.description ?? "",
    employeeId:  p.employeeId ?? "",

    // only present in getDocumentById (backend populates employee)
    employeeName: p.employee?.name ?? p.employeeName ?? "",

    // filePath comes as "uploads\\filename.png" — convert to full URL
    fileUrl:
      p.fileUrl ??
      (p.filePath
        ? `http://192.168.1.18:3000/${p.filePath.replace(/\\/g, "/")}`
        : ""),

    // backend stores original filename as "originalName"
    fileName: p.originalName ?? p.fileName ?? p.title ?? "",

    fileSize: p.fileSize ?? p.size ?? 0,

    // backend stores mime type as "fileType"
    mimeType: p.fileType ?? p.mimeType ?? "",

    // backend stores date as "uploadedAt", NOT "createdAt"
    createdAt: p.uploadedAt ?? p.createdAt ?? new Date().toISOString(),
    updatedAt: p.updatedAt ?? undefined,
  };
}