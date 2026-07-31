import apiClient from "./apiClient";

// ✅ GET
export const getHolidays = async () => {
  const res = await apiClient.get("/getHolidays");

  const list = res.data.holidays || [];

  return list.map((h: any) => ({
    id: h.id || h._id || Math.random().toString(),
    name: h.holidayName,
    date: h.date,
  }));
};

// ✅ CREATE
export const createHoliday = async (data: any) => {
  const payload = {
    holidays: [
      {
        holidayName: data.name,
        date: data.date,
      },
    ],
  };

  const res = await apiClient.post("/createholidays", payload);

  return {
    id: res.data?.id || Math.random().toString(),
    name: data.name,
    date: data.date,
  };
};

// ✅ DELETE
export const deleteHoliday = async (id: string) => {
  await apiClient.delete(`/deleteholidays/${id}`);
  return id;
};