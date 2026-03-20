import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import {
  loginApi,
  changePasswordApi,
  getUserByIdApi,
  SESSION_KEYS,
  LOCAL_KEYS,
} from "../services/Auth.service";

const ATT_SS = {
  attendanceId: 'att_attendanceId',
  attendanceStatus: 'att_status',
  runningHours: 'att_runningHours',
} as const;

export interface AuthUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  empId?: string;
  empNumber: string;   // ✅ required — maps from backend emp.empNumber
  department?: string;
  designation?: string;
  firstLogin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    mustChangePassword?: boolean;
    role?: string;
  }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; role?: string }>;
  updateProfile: (updates: Partial<AuthUser>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = 'hrportal_session';

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

function normaliseUser(raw: Omit<AuthUser, 'id'> & { id?: string }): AuthUser {
  const _id = raw._id ?? '';
  return { ...raw, _id, id: _id };
}

function setPendingSession(userId: string, oldPass: string, email: string) {
  sessionStorage.setItem(SESSION_KEYS.userId, userId);
  sessionStorage.setItem(SESSION_KEYS.oldPass, oldPass);
  sessionStorage.setItem(SESSION_KEYS.userEmail, email);
  localStorage.setItem(LOCAL_KEYS.pendingUserId, userId);
  localStorage.setItem(LOCAL_KEYS.pendingOldPass, oldPass);
  localStorage.setItem(LOCAL_KEYS.pendingEmail, email);
}

function clearPendingSession() {
  sessionStorage.removeItem(SESSION_KEYS.userId);
  sessionStorage.removeItem(SESSION_KEYS.oldPass);
  sessionStorage.removeItem(SESSION_KEYS.userEmail);
  localStorage.removeItem(LOCAL_KEYS.pendingUserId);
  localStorage.removeItem(LOCAL_KEYS.pendingOldPass);
  localStorage.removeItem(LOCAL_KEYS.pendingEmail);
}

function getPendingUserId(): string {
  return sessionStorage.getItem(SESSION_KEYS.userId)
    ?? localStorage.getItem(LOCAL_KEYS.pendingUserId)
    ?? '';
}

function getPendingOldPass(): string {
  return sessionStorage.getItem(SESSION_KEYS.oldPass)
    ?? localStorage.getItem(LOCAL_KEYS.pendingOldPass)
    ?? '';
}

function saveAttendanceSession(res: Record<string, unknown>) {
  const id = (res.attendanceId as string) ?? '';
  const status = (res.attendanceStatus as string) ?? '';
  const hours = String((res.runningHours as number) ?? 0);
  if (!id) return;
  sessionStorage.setItem(ATT_SS.attendanceId, id);
  sessionStorage.setItem(ATT_SS.attendanceStatus, status);
  sessionStorage.setItem(ATT_SS.runningHours, hours);
  localStorage.setItem(ATT_SS.attendanceId, id);
  localStorage.setItem(ATT_SS.attendanceStatus, status);
  localStorage.setItem(ATT_SS.runningHours, hours);
}

function clearAttendanceSession() {
  Object.values(ATT_SS).forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

// ✅ empNumber defaults to '' — never undefined so type is always satisfied
function _buildMinimalUser(id: string, email: string, role: string): AuthUser {
  return normaliseUser({
    _id: id,
    name: email.split('@')[0] ?? 'User',
    email,
    role: (role as AuthUser['role']) || 'employee',
    empNumber: '',   // ✅ FIXED
    firstLogin: false,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?._id) setUser(normaliseUser(parsed));
        else localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await loginApi({ email, password });
      if (!result.success) return { success: false };

      if (result.changePassword) {
        setPendingSession(result.userId, password, email);
        return { success: true, mustChangePassword: true };
      }

      const token = (result as any).token ?? '';
      const role = (result as any).role ?? '';
      localStorage.setItem(SESSION_KEYS.authToken, token);
      saveAttendanceSession(result as unknown as Record<string, unknown>);

      const jwt = decodeJwt(token);
      const userId = (jwt.id ?? jwt._id ?? jwt.userId ?? jwt.sub ?? '') as string;
      localStorage.setItem("employeeId", userId);

      let authUser: AuthUser;
      if (userId) {
        try {
          const userRes = await getUserByIdApi(userId);
          const emp = userRes.employee ?? userRes.user;
          if (userRes.success && emp) {
            authUser = normaliseUser({
              _id: emp._id,
              name: emp.name ?? '',
              email: emp.email ?? email,
              role: emp.role ?? role as AuthUser['role'],
              empId: emp.empId,
              // ✅ backend uses empId (e.g. "EMP_01"), not empNumber
              empNumber: emp.empNumber ?? emp.empId ?? '',
              department: emp.department,
              designation: emp.designation,
              firstLogin: emp.firstLogin ?? false,
            });
          } else {
            authUser = _buildMinimalUser(userId, email, role);
          }
        } catch {
          authUser = _buildMinimalUser(userId, email, role);
        }
      } else {
        authUser = _buildMinimalUser('', email, role);
      }

      setUser(authUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      // save empNumber for LeaveService fallback
      if (authUser.empNumber) localStorage.setItem("empNumber", authUser.empNumber);
      return { success: true, mustChangePassword: false, role: authUser.role };

    } catch (err) {
      console.error('[AuthContext] login error:', err);
      return { success: false };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; role?: string }> => {
    const userId = getPendingUserId();
    const oldPass = getPendingOldPass();
    if (!userId) return { success: false };

    try {
      const res = await changePasswordApi({ userId, oldPassword: oldPass, newPassword, confirmPassword: newPassword });
      if (!res.success) return { success: false };

      let role: string | undefined;
      try {
        const userRes = await getUserByIdApi(userId);
        const emp = userRes.employee ?? userRes.user;
        if (userRes.success && emp) {
          const freshUser = normaliseUser({
            _id: emp._id,
            name: emp.name ?? '',
            email: emp.email ?? '',
            role: emp.role,
            empId: emp.empId,
            // ✅ backend uses empId (e.g. "EMP_01"), not empNumber
            empNumber: emp.empNumber ?? emp.empId ?? '',
            department: emp.department,
            designation: emp.designation,
            firstLogin: false,
          });
          setUser(freshUser);
          localStorage.setItem(SESSION_KEY, JSON.stringify(freshUser));
          role = freshUser.role;
        }
      } catch (err) {
        console.warn('[AuthContext] Could not fetch user after password change:', err);
      }

      clearPendingSession();
      return { success: true, role };
    } catch (err) {
      console.error('[AuthContext] updatePassword error:', err);
      return { success: false };
    }
  };

  const updateProfile = (updates: Partial<AuthUser>) => {
    if (!user) return;
    const updated = normaliseUser({ ...user, ...updates });
    setUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEYS.authToken);
    clearPendingSession();
    clearAttendanceSession();
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, updatePassword, updateProfile, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}