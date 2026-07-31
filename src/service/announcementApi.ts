import apiClient from "./apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Announcement {
  id: string;
  title: string;
  message: string;
  departments: string;
  isForAll: boolean;
  priority: 'high' | 'medium' | 'low';
  createdBy: string;
  createdAt: string;
}

export interface CreateAnnouncementInput {
  title: string;
  message: string;
  departments?: string;
  isForAll: boolean;
  priority?: 'high' | 'medium' | 'low';
  createdBy?: string;
}

export interface UpdateAnnouncementInput {
  title?: string;
  message?: string;
  departments?: string;
  isForAll?: boolean;
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────
// Returns RAW api objects — normalise() in useAnnouncements does the mapping
export const getAnnouncements = async (): Promise<any[]> => {
  const res = await apiClient.get('/getAnnouncementAll');
  const list = Array.isArray(res.data)
    ? res.data
    : res.data.announcements || res.data.data || [];
  return list;
};

// ─── GET BY DEPARTMENT ────────────────────────────────────────────────────────
export const getAnnouncementsByDept = async (
  departmentId: string,
): Promise<any[]> => {
  if (!departmentId) throw new Error('Department ID missing');
  const res = await apiClient.get(
    `/getBydepartment?departmentId=${encodeURIComponent(departmentId)}`
  );
  const list = Array.isArray(res.data)
    ? res.data
    : res.data.announcements || res.data.data || [];
  return list;
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createAnnouncement = async (
  data: CreateAnnouncementInput,
): Promise<Announcement> => {
  const form = new URLSearchParams();
  form.append('title',   data.title);
  form.append('message', data.message);
  form.append('isForAll', String(data.isForAll));

  if (!data.isForAll && data.departments) {
    form.append('departments', data.departments);
  }
  if (data.priority)  form.append('priority',  data.priority);
  if (data.createdBy) form.append('createdBy', data.createdBy);

  const res = await apiClient.post('/addAnnouncement', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const saved = res.data?.announcement || res.data?.data || res.data;

  return {
    id:          saved?._id || saved?.id || String(Date.now()),
    title:       data.title,
    message:     data.message,
    departments: data.departments || '',
    isForAll:    data.isForAll,
    priority:    data.priority || 'medium',
    createdBy:   data.createdBy || '',
    createdAt:   saved?.createdAt || new Date().toISOString(),
  };
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateAnnouncement = async (
  id: string,
  data: UpdateAnnouncementInput,
): Promise<void> => {
  const form = new URLSearchParams();
  if (data.title    !== undefined) form.append('title',    data.title);
  if (data.message  !== undefined) form.append('message',  data.message);
  if (data.isForAll !== undefined) form.append('isForAll', String(data.isForAll));

  if (!data.isForAll && data.departments !== undefined) {
    form.append('departments', data.departments);
  }

  await apiClient.put(`/updateAnnouncementById/${id}`, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteAnnouncement = async (id: string): Promise<void> => {
  await apiClient.delete(`/deleteAnnouncementById/${id}`);
};