import type { Role } from '../types';

export type Permission =
  | 'users:create' | 'users:read' | 'users:update' | 'users:delete'
  | 'departments:create' | 'departments:read' | 'departments:update' | 'departments:delete'
  | 'attendance:read' | 'attendance:readAll'
  | 'leaves:create' | 'leaves:read' | 'leaves:readAll' | 'leaves:approve'
  | 'payroll:read' | 'payroll:readAll' | 'payroll:generate'
  | 'announcements:create' | 'announcements:read' | 'announcements:delete'
  | 'holidays:create' | 'holidays:read' | 'holidays:delete'
  | 'performance:create' | 'performance:read' | 'performance:readAll' | 'performance:review'
  | 'documents:create' | 'documents:read' | 'documents:readAll' | 'documents:delete'
  | 'reports:read';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'departments:create', 'departments:read', 'departments:update', 'departments:delete',
    'attendance:read', 'attendance:readAll',
    'leaves:create', 'leaves:read', 'leaves:readAll', 'leaves:approve',
    'payroll:read', 'payroll:readAll', 'payroll:generate',
    'announcements:create', 'announcements:read', 'announcements:delete',
    'holidays:create', 'holidays:read', 'holidays:delete',
    'performance:create', 'performance:read', 'performance:readAll', 'performance:review',
    'documents:create', 'documents:read', 'documents:readAll', 'documents:delete',
    'reports:read',
  ],
  hr: [
    'users:create', 'users:read', 'users:update',
    'departments:create', 'departments:read', 'departments:update',
    'attendance:read', 'attendance:readAll',
    'leaves:read', 'leaves:readAll', 'leaves:approve',
    'payroll:readAll', 'payroll:generate',
    'announcements:create', 'announcements:read', 'announcements:delete',
    'holidays:create', 'holidays:read', 'holidays:delete',
    'performance:create', 'performance:read', 'performance:readAll', 'performance:review',
    'documents:create', 'documents:read', 'documents:readAll', 'documents:delete',
    'reports:read',
  ],
  employee: [
    'attendance:read',
    'leaves:create', 'leaves:read',
    'payroll:read',
    'announcements:read',
    'holidays:read',
    'performance:read',
    'documents:read', 'documents:create',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canCreate(role: Role, module: string): boolean {
  return hasPermission(role, `${module}:create` as Permission);
}

export function canDelete(role: Role, module: string): boolean {
  return hasPermission(role, `${module}:delete` as Permission);
}

export function canApprove(role: Role): boolean {
  return hasPermission(role, 'leaves:approve');
}

export function isAdmin(role: Role): boolean {
  return role === 'admin';
}

export function isHROrAdmin(role: Role): boolean {
  return role === 'admin' || role === 'hr';
}
