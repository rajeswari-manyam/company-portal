import apiClient from "./apiClient";

// ✅ GET ALL
export const getAnnouncements = async () => {
  const res = await apiClient.get("/getAnnouncementAll");

  const list = Array.isArray(res.data)
    ? res.data
    : res.data.announcements || res.data.data || [];

  return list.map((a: any) => ({
    id: a.id || a._id,
    title: a.title,
    message: a.message,
    departments: a.departments,
    isForAll: a.isForAll,
    priority: a.priority || "medium",
    createdAt: a.createdAt,
  }));
};

// ✅ CREATE
export const createAnnouncement = async (data: any) => {
  const payload = {
    title: data.title,
    message: data.message,
    departments: data.departments || "consultancy",
    isForAll: data.isForAll ?? false,
  };

  const res = await apiClient.post("/addAnnouncement", payload);

  return {
    id: res.data?.id || res.data?._id || Math.random().toString(),
    ...payload,
    priority: data.priority || "medium",
  };
};

// ✅ DELETE
export const deleteAnnouncement = async (id: string) => {
  return apiClient.delete(`/deleteAnnouncement/${id}`);
};