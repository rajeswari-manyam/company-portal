import { useState, useCallback } from 'react';
import { UserService } from './UserService';
import type { UserRecord } from '../../types';
import toast from 'react-hot-toast';

export function useUsers() {
  const [users, setUsers] = useState<UserRecord[]>(() => UserService.getAll());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => setUsers(UserService.getAll()), []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.employeeId.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const createUser = async (data: Omit<UserRecord, 'id'>) => {
    setLoading(true);
    try {
      UserService.create(data);
      refresh();
      toast.success('User created successfully');
      return true;
    } catch {
      toast.error('Failed to create user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, data: Partial<UserRecord>) => {
    const ok = UserService.update(id, data);
    if (ok) { refresh(); toast.success('User updated'); }
    else toast.error('Update failed');
    return ok;
  };

  const deleteUser = async (id: string) => {
    const ok = UserService.delete(id);
    if (ok) { refresh(); toast.success('User deleted'); }
    else toast.error('Cannot delete this user');
    return ok;
  };

  return { users, filtered, search, setSearch, roleFilter, setRoleFilter, loading, createUser, updateUser, deleteUser, refresh };
}
