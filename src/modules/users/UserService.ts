import {
  getUsers, getUserById, createUser, updateUser, deleteUser,
  generateEmployeeId, type UserRecord
} from '../../data/store';
import type { Role } from '../../types';

export const UserService = {
  getAll: () => getUsers(),
  getById: (id: string) => getUserById(id),
  getEmployees: () => getUsers().filter(u => u.role === 'employee'),
  getByRole: (role: Role) => getUsers().filter(u => u.role === role),

  create: (data: Omit<UserRecord, 'id'>) => createUser(data),
  update: (id: string, data: Partial<UserRecord>) => updateUser(id, data),
  delete: (id: string) => deleteUser(id),

  generateId: (role: 'hr' | 'employee') => generateEmployeeId(role),

  search: (users: UserRecord[], query: string) => {
    const q = query.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.employeeId.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  },
};
