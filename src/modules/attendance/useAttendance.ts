import { useState, useCallback } from 'react';
import { AttendanceService } from './AttendanceService';
import { getUsers } from '../../data/store';
import type { AttendanceSummary } from '../../types';

export function useAttendance(userId?: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFilter, setDateFilter] = useState(today);
  const [search, setSearch] = useState('');

  const load = useCallback(() =>
    userId ? AttendanceService.getForUser(userId) : AttendanceService.getAll(),
    [userId]
  );

  const [records, setRecords] = useState<AttendanceSummary[]>(load);

  const refresh = useCallback(() => setRecords(load()), [load]);

  // Build user name lookup
  const users = getUsers();
  const userNames: Record<string, string> = {};
  users.forEach(u => { userNames[u.id] = u.name; });

  const filtered = records.filter(a => {
    const matchDate = !dateFilter || a.date === dateFilter;
    const q = search.toLowerCase();
    const name = userNames[a.userId]?.toLowerCase() ?? '';
    const matchSearch = !q || name.includes(q) || a.userId.toLowerCase().includes(q);
    return matchDate && matchSearch;
  });

  const stats = AttendanceService.getStats(
    dateFilter ? records.filter(a => a.date === dateFilter) : records
  );

  const todayRecords = records.filter(a => a.date === today);
  const totalEmployees = users.filter(u => u.role === 'employee').length;

  return {
    records, filtered, search, setSearch, dateFilter, setDateFilter,
    refresh, stats, userNames, todayRecords, totalEmployees,
  };
}
