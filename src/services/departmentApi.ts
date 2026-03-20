import apiClient from "./apiClient";

// 🔁 Response parser (safe)
const extractList = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.departments)) return data.departments;
  return [];
};

// 🔄 Mapping
const mapToFrontend = (d: any) => ({
  id: d.id || d._id,
  name: d.departmentName || "",
  head: d.managerName || "",
  description: d.description || "",

  // ✅ FIX HERE
  employeeCount: d.employeeCount ?? 0,

  // 🔥 HANDLE BOTH CASES
  weekOffDays: d.weekOffDays ,
});

// 📥 GET
export const getDepartments = async () => {
  const res = await apiClient.get("/getAllDepartments");
  const list = extractList(res.data);
  return list.map(mapToFrontend);
};

// ➕ CREATE
export const createDepartment = async (data: any) => {
  const payload = {
    departmentName: data.name,
    managerName: data.head,
    description: data.description,
  };

  const res = await apiClient.post("/createDepartment", payload);
  return mapToFrontend(res.data);
};

// ✏️ UPDATE
export const updateDepartment = async (id: string, data: any) => {
  const payload = {
    departmentName: data.name,
    managerName: data.head,
    description: data.description,
  };

  await apiClient.put(`/updateDepartment/${id}`, payload);

  return { id, ...data };
};

// 🗑 DELETE
export const deleteDepartment = async (id: string) => {
  await apiClient.delete(`/deleteDepartment/${id}`);
  return id;
};