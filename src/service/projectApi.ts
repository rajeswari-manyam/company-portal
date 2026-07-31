import apiClient from "./apiClient";

// ✅ CREATE PROJECT  →  POST /addProject
export const createProject = async (data: any) => {
  const payload = { name: data.projectName ?? data.name };

  const res = await apiClient.post("/addProject", payload);

  return {
    id: res.data?.project?._id || res.data?._id,
    projectName: payload.name,
    createdAt: res.data?.project?.createdAt,
    updatedAt: res.data?.project?.updatedAt,
  };
};

// ✅ GET ALL PROJECTS  →  GET /getAllProjects
export const getProjects = async () => {
  const res = await apiClient.get("/getAllProjects");

  const list = Array.isArray(res.data)
    ? res.data
    : res.data.projects || res.data.data || [];

  return list.map((p: any) => normaliseProject(p));
};

// ✅ GET PROJECT BY ID  →  GET /getProjectById/:id
export const getProjectById = async (id: string) => {
  const res = await apiClient.get(`/getProjectById/${id}`);
  const p = res.data.project || res.data;
  return normaliseProject(p);
};

// ✅ UPDATE PROJECT  →  PUT /updateProjectById/:id
export const updateProject = async (id: string, data: any) => {
  const payload = { name: data.projectName ?? data.name };
  await apiClient.put(`/updateProjectById/${id}`, payload);
  return { id, projectName: payload.name };
};

// ✅ DELETE PROJECT  →  DELETE /deleteProject/:id
export const deleteProject = async (id: string) => {
  return apiClient.delete(`/deleteProject/${id}`);
};

// ✅ GET PROJECTS FOR A SPECIFIC EMPLOYEE  (client-side filter)
export const getProjectsByEmployee = async (employeeId: string) => {
  const all = await getProjects();
  return all.filter(
    (p: any) =>
      p.managerId === employeeId ||
      (Array.isArray(p.teamMembers) && p.teamMembers.includes(employeeId)),
  );
};

// ─── Normaliser ───────────────────────────────────────────────────────────────
function normaliseProject(p: any) {
  return {
    id: p.id || p._id,
    projectName: p.projectName || p.name,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    description: p.description,
    startDate: p.startDate,
    endDate: p.endDate,
    managerId: p.managerId,
    teamMembers: p.teamMembers || [],
    status: p.status || 'active',
  };
}