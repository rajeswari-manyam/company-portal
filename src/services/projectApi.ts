import apiClient from "./apiClient";

// ✅ CREATE PROJECT
export const createProject = async (data: any) => {
  const payload = {
    projectName: data.projectName,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    managerId: data.managerId,
    teamMembers: data.teamMembers || [],
  };

  const res = await apiClient.post("/createProject", payload);

  return {
    id: res.data?.id || res.data?._id || Math.random().toString(),
    ...payload,
    status: res.data?.status || "active",
  };
};

// ✅ GET ALL PROJECTS
export const getProjects = async () => {
  const res = await apiClient.get("/getAllProjects");

  const list = Array.isArray(res.data)
    ? res.data
    : res.data.projects || res.data.data || [];

  return list.map((p: any) => ({
    id: p.id || p._id,
    projectName: p.projectName,
    description: p.description,
    startDate: p.startDate,
    endDate: p.endDate,
    managerId: p.managerId,
    teamMembers: p.teamMembers || [],
    status: p.status || "active",
  }));
};

// ✅ GET PROJECT BY ID
export const getProjectById = async (id: string) => {
  const res = await apiClient.get(`/getProject/${id}`);

  const p = res.data.project || res.data;

  return {
    id: p.id || p._id,
    projectName: p.projectName,
    description: p.description,
    startDate: p.startDate,
    endDate: p.endDate,
    managerId: p.managerId,
    teamMembers: p.teamMembers || [],
    status: p.status || "active",
  };
};

// ✅ UPDATE PROJECT
export const updateProject = async (id: string, data: any) => {
  const payload = {
    projectName: data.projectName,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    managerId: data.managerId,
    teamMembers: data.teamMembers,
  };

  await apiClient.put(`/updateProject/${id}`, payload);

  return { id, ...payload };
};

// ✅ DELETE PROJECT
export const deleteProject = async (id: string) => {
  return apiClient.delete(`/deleteProject/${id}`);
};

// ✅ UPDATE STATUS (ACTIVE / COMPLETED)
export const updateProjectStatus = async (id: string, status: string) => {
  return apiClient.put(`/updateProjectStatus/${id}`, { status });
};