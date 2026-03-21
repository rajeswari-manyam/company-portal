// src/constants/index.ts  — full replacement
// KEY CHANGE: added *_CONSULTANCY nav arrays and kept all existing exports intact.

export const LEAVE_TYPES = [
  { label: 'Annual Leave',    value: 'annual'    },
  { label: 'Sick Leave',      value: 'sick'      },
  { label: 'Casual Leave',    value: 'casual'    },
  { label: 'Maternity Leave', value: 'maternity' },
  { label: 'Paternity Leave', value: 'paternity' },
  { label: 'Unpaid Leave',    value: 'unpaid'    },
] as const;

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
] as const;

// No longer used as a <select> source — kept for any legacy references only.
export const DEPARTMENTS_DEFAULT = [
  'Engineering','HR','Marketing','Finance','Design','Management','Operations','Consultancy',
] as const;

export const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'] as const;
export const GENDERS      = ['Male','Female','Other','Prefer not to say'] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  low:      'bg-slate-100 text-slate-600',
  medium:   'bg-amber-100 text-amber-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700',
  approved:    'bg-emerald-100 text-emerald-700',
  rejected:    'bg-red-100 text-red-700',
  present:     'bg-emerald-100 text-emerald-700',
  absent:      'bg-red-100 text-red-700',
  late:        'bg-amber-100 text-amber-700',
  active:      'bg-emerald-100 text-emerald-700',
  inactive:    'bg-slate-100 text-slate-600',
  'half-day':  'bg-blue-100 text-blue-700',
  generated:   'bg-violet-100 text-violet-700',
  paid:        'bg-emerald-100 text-emerald-700',
  open:        'bg-emerald-100 text-emerald-700',
  closed:      'bg-slate-100 text-slate-600',
  draft:       'bg-amber-100 text-amber-700',
  reviewed:    'bg-emerald-100 text-emerald-700',
  submitted:   'bg-blue-100 text-blue-700',
};

// ── Nav arrays — shape must match NavEntry in Sidebar: { to, label, icon? } ──

// ── ADMIN ─────────────────────────────────────────────────────────────────────
export const ADMIN_NAV = [
  { to: '/admin/dashboard',     label: 'Dashboard',      icon: 'LayoutDashboard' },
  { to: '/admin/employees',     label: 'Employees',      icon: 'Users'           },
  { to: '/admin/departments',   label: 'Departments',    icon: 'Building2'       },
  { to: '/admin/attendance',    label: 'Attendance',     icon: 'CalendarCheck'   },
  { to: '/admin/leaves',        label: 'Leave Requests', icon: 'CalendarOff'     },
  { to: '/admin/projects',      label: 'Projects',       icon: 'FolderKanban'    },
  { to: '/admin/payslips',      label: 'Payroll',        icon: 'Wallet'          },
  { to: '/admin/announcements', label: 'Announcements',  icon: 'Megaphone'       },
  { to: '/admin/holidays',      label: 'Holidays',       icon: 'Gift'            },
  { to: '/admin/documents',     label: 'Documents',      icon: 'FileText'        },
  { to: '/admin/excelSheets',   label: 'Excel Sheets',   icon: 'FileText'        },
] as const;

export const ADMIN_NAV_CONSULTANCY = [
  { to: '/admin/dashboard',     label: 'Dashboard',      icon: 'LayoutDashboard' },
  { to: '/admin/employees',     label: 'Employees',      icon: 'Users'           },
  { to: '/admin/departments',   label: 'Departments',    icon: 'Building2'       },
  { to: '/admin/attendance',    label: 'Attendance',     icon: 'CalendarCheck'   },
  { to: '/admin/leaves',        label: 'Leave Requests', icon: 'CalendarOff'     },
  { to: '/admin/payslips',      label: 'Payroll',        icon: 'Wallet'          },
  { to: '/admin/announcements', label: 'Announcements',  icon: 'Megaphone'       },
  { to: '/admin/holidays',      label: 'Holidays',       icon: 'Gift'            },
  { to: '/admin/excelSheets',   label: 'Excel Sheets',   icon: 'FileText'        },
  { to: '/admin/reports',       label: 'Reports',        icon: 'BarChart2'       },
  { to: '/admin/documents',     label: 'Documents',      icon: 'FileText'        },
] as const;

// ── HR ────────────────────────────────────────────────────────────────────────
export const HR_NAV = [
  { to: '/hr/dashboard',     label: 'Dashboard',      icon: 'LayoutDashboard' },
  { to: '/hr/employees',     label: 'Employees',      icon: 'Users'           },
  { to: '/hr/departments',   label: 'Departments',    icon: 'Building2'       },
  { to: '/hr/attendance',    label: 'Attendance',     icon: 'CalendarCheck'   },
  { to: '/hr/leaves',        label: 'Leave Requests', icon: 'CalendarOff'     },
  { to: '/hr/payroll',       label: 'Payroll',        icon: 'Wallet'          },
  { to: '/hr/announcements', label: 'Announcements',  icon: 'Megaphone'       },
  { to: '/hr/holidays',      label: 'Holidays',       icon: 'Gift'            },
  { to: '/hr/projects',      label: 'Projects',       icon: 'FolderKanban'    },
  { to: '/hr/documents',     label: 'Documents',      icon: 'FileText'        },
  { to: '/hr/excelSheets',   label: 'Excel Sheets',   icon: 'FileText'        },
  { to: '/hr/profile',       label: 'My Profile',     icon: 'UserCircle'      },
] as const;

export const HR_NAV_CONSULTANCY = [
  { to: '/hr/dashboard',     label: 'Dashboard',      icon: 'LayoutDashboard' },
  { to: '/hr/employees',     label: 'Employees',      icon: 'Users'           },
  { to: '/hr/departments',   label: 'Departments',    icon: 'Building2'       },
  { to: '/hr/attendance',    label: 'Attendance',     icon: 'CalendarCheck'   },
  { to: '/hr/leaves',        label: 'Leave Requests', icon: 'CalendarOff'     },
  { to: '/hr/payroll',       label: 'Payroll',        icon: 'Wallet'          },
  { to: '/hr/announcements', label: 'Announcements',  icon: 'Megaphone'       },
  { to: '/hr/holidays',      label: 'Holidays',       icon: 'Gift'            },
  { to: '/hr/excelSheets',   label: 'Excel Sheets',   icon: 'FileText'        },
  { to: '/hr/reports',       label: 'Reports',        icon: 'BarChart2'       },
  { to: '/hr/documents',     label: 'Documents',      icon: 'FileText'        },
  { to: '/hr/profile',       label: 'My Profile',     icon: 'UserCircle'      },
] as const;

// ── EMPLOYEE ──────────────────────────────────────────────────────────────────
export const EMPLOYEE_NAV = [
  { to: '/employee/dashboard',     label: 'Dashboard',     icon: 'LayoutDashboard' },
  { to: '/employee/attendance',    label: 'My Attendance', icon: 'CalendarCheck'   },
  { to: '/employee/leaves',        label: 'My Leave',      icon: 'CalendarOff'     },
  { to: '/employee/payslips',      label: 'My Payslips',   icon: 'Wallet'          },
  { to: '/employee/documents',     label: 'My Documents',  icon: 'FileText'        },
  { to: '/employee/announcements', label: 'Announcements', icon: 'Megaphone'       },
  { to: '/employee/holidays',      label: 'Holidays',      icon: 'Gift'            },
  { to: '/employee/projects',      label: 'My Projects',   icon: 'FolderKanban'    },
  { to: '/employee/tasks',         label: 'My Tasks',      icon: 'CheckSquare'     },

  { to: '/employee/profile',       label: 'My Profile',    icon: 'UserCircle'      },
] as const;

export const EMPLOYEE_NAV_CONSULTANCY = [
  { to: '/employee/dashboard',     label: 'Dashboard',       icon: 'LayoutDashboard' },
  { to: '/employee/attendance',    label: 'My Attendance',   icon: 'CalendarCheck'   },
  { to: '/employee/leaves',        label: 'My Leave',        icon: 'CalendarOff'     },
  { to: '/employee/payslips',      label: 'My Payslips',     icon: 'Wallet'          },
  { to: '/employee/documents',     label: 'My Documents',    icon: 'FileText'        },
  { to: '/employee/announcements', label: 'Announcements',   icon: 'Megaphone'       },
  { to: '/employee/holidays',      label: 'Holidays',        icon: 'Gift'            },
  { to: '/employee/excelSheets',   label: 'My Excel Sheets', icon: 'FileText'        },
  { to: '/employee/reports',       label: 'My Reports',      icon: 'BarChart2'       },
  { to: '/employee/profile',       label: 'My Profile',      icon: 'UserCircle'      },
] as const;

export const AVATAR_COLORS = [
  'bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500',
  'bg-rose-500','bg-cyan-500','bg-indigo-500','bg-teal-500',
  'bg-orange-500','bg-pink-500',
];