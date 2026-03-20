import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type UserRecord, authenticate, getUserById, updateUser, initStore } from '../data/store';

interface AuthContextType {
  user: UserRecord | null;
  login: (email: string, password: string) => Promise<{ success: boolean; mustChangePassword?: boolean }>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
  updateProfile: (updates: Partial<UserRecord>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = 'hrportal_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // initStore writes admin to localStorage if not already there
    initStore();
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        const freshUser = getUserById(session.id);
        if (freshUser) setUser(freshUser);
        else localStorage.removeItem(SESSION_KEY); // stale session
      } catch { localStorage.removeItem(SESSION_KEY); }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 500));
    const found = authenticate(email, password);
    if (found) {
      setUser(found);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: found.id }));
      return { success: true, mustChangePassword: found.mustChangePassword };
    }
    return { success: false };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return false;
    const success = updateUser(user.id, { password: newPassword, mustChangePassword: false });
    if (success) {
      const updated = getUserById(user.id);
      if (updated) { setUser(updated); localStorage.setItem(SESSION_KEY, JSON.stringify({ id: updated.id })); }
    }
    return success;
  };

  const updateProfile = (updates: Partial<UserRecord>) => {
    if (!user) return;
    updateUser(user.id, updates);
    const updated = getUserById(user.id);
    if (updated) setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updatePassword, updateProfile, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
