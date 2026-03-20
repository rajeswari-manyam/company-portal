export const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave'] as const;

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'] as const;

export const DEPARTMENTS_DEFAULT = ['Engineering', 'HR', 'Marketing', 'Finance', 'Design', 'Management', 'Operations'] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;

export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  'half-day': 'bg-blue-100 text-blue-700',
  generated: 'bg-violet-100 text-violet-700',
  paid: 'bg-emerald-100 text-emerald-700',
  open: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
  draft: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-emerald-100 text-emerald-700',
  submitted: 'bg-blue-100 text-blue-700',
};

export const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/admin/employees', label: 'Employees', icon: '👥' },
  { to: '/admin/departments', label: 'Departments', icon: '🏢' },
  { to: '/admin/attendance', label: 'Attendance', icon: '📅' },
  { to: '/admin/leaves', label: 'Leave Requests', icon: '🌴' },
  { to: '/admin/payslips', label: 'Payroll', icon: '💰' },
  { to: '/admin/performance', label: 'Performance', icon: '📈' },
  { to: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { to: '/admin/holidays', label: 'Holidays', icon: '🎉' },
  { to: '/admin/documents', label: 'Documents', icon: '📄' },
  { to: '/admin/reports', label: 'Reports', icon: '📊' },
];

export const HR_NAV = [
  { to: '/hr/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/hr/employees', label: 'Employees', icon: '👥' },
  { to: '/hr/departments', label: 'Departments', icon: '🏢' },
  { to: '/hr/attendance', label: 'Attendance', icon: '📅' },
  { to: '/hr/leaves', label: 'Leave Requests', icon: '🌴' },
  { to: '/hr/payroll', label: 'Payroll', icon: '💰' },
  { to: '/hr/performance', label: 'Performance', icon: '📈' },
  { to: '/hr/announcements', label: 'Announcements', icon: '📢' },
  { to: '/hr/holidays', label: 'Holidays', icon: '🎉' },
  { to: '/hr/documents', label: 'Documents', icon: '📄' },
  { to: '/hr/profile', label: 'My Profile', icon: '👤' },
];

export const EMPLOYEE_NAV = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/employee/attendance', label: 'My Attendance', icon: '📅' },
  { to: '/employee/leaves', label: 'My Leave', icon: '🌴' },
  { to: '/employee/payslips', label: 'My Payslips', icon: '💰' },
  { to: '/employee/performance', label: 'My Performance', icon: '📈' },
  { to: '/employee/documents', label: 'My Documents', icon: '📄' },
  { to: '/employee/announcements', label: 'Announcements', icon: '📢' },
  { to: '/employee/holidays', label: 'Holidays', icon: '🎉' },
  { to: '/employee/profile', label: 'My Profile', icon: '👤' },
];

export const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-pink-500',
];
