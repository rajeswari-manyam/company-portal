import { useEffect, useState } from "react";
import {
  getHolidays,
  createHoliday,
  deleteHoliday,
} from "../../services/holidayApi";

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await getHolidays();
      setHolidays(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async (data: any) => {
    const newHoliday = await createHoliday(data);
    setHolidays(prev => [...prev, newHoliday]);
    return true;
  };

  const handleDelete = async (id: string) => {
    await deleteHoliday(id);
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  return {
    holidays,
    loading,
    createHoliday: handleCreate,
    deleteHoliday: handleDelete,
  };
};