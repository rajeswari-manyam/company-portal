import { useEffect, useState } from "react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../services/departmentApi";

export const useDepartments = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (data: any) => {
    const newDept = await createDepartment(data);
    setDepartments(prev => [...prev, newDept]);
    return true;
  };

  const handleUpdate = async (id: string, data: any) => {
    await updateDepartment(id, data);
    setDepartments(prev =>
      prev.map(d => (d.id === id ? { ...d, ...data } : d))
    );
    return true;
  };

  const handleDelete = async (id: string) => {
    await deleteDepartment(id);
    setDepartments(prev => prev.filter(d => d.id !== id));
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return {
    filtered,
    loading,
    search,
    setSearch,
    createDepartment: handleCreate,
    updateDepartment: handleUpdate,
    deleteDepartment: handleDelete,
  };
};