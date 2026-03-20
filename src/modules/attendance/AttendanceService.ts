import {
  getAllAttendance, getAttendanceForUser, saveAttendance,
  type AttendanceSummary
} from '../../data/store';

export const AttendanceService = {
  getAll: () => getAllAttendance(),
  getForUser: (userId: string) => getAttendanceForUser(userId),

  getForDate: (date: string) => getAllAttendance().filter(a => a.date === date),

  getStats: (records: AttendanceSummary[]) => ({
    present: records.filter(a => a.status === 'present').length,
    absent: records.filter(a => a.status === 'absent').length,
    late: records.filter(a => a.status === 'late').length,
    halfDay: records.filter(a => a.status === 'half-day').length,
  }),

  formatSeconds: (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  },

  getCompletionPercent: (workSeconds: number) =>
    Math.min(100, Math.round((workSeconds / 28800) * 100)), // 8h = 100%

  search: (records: AttendanceSummary[], users: Record<string, string>, query: string) => {
    const q = query.toLowerCase();
    return records.filter(a => {
      const name = users[a.userId] ?? '';
      return name.toLowerCase().includes(q) || a.userId.toLowerCase().includes(q);
    });
  },
};
