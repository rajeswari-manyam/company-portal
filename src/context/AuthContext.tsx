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
} from "../service/Auth.service";

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
  empNumber: string;
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

// ─── Safe localStorage wrapper ────────────────────────────────────────────────
// Prevents QuotaExceededError from crashing the app

const KEYS_TO_PRESERVE = [
  SESSION_KEY,
  SESSION_KEYS.authToken,
  'empNumber',
  'employeeId',
  LOCAL_KEYS.pendingUserId,
  LOCAL_KEYS.pendingOldPass,
  LOCAL_KEYS.pendingEmail,
  ATT_SS.attendanceId,
  ATT_SS.attendanceStatus,
  ATT_SS.runningHours,
];

function safeLocalSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      console.warn('[AuthContext] localStorage quota exceeded — clearing stale data');

      // Save critical values before clearing
      const preserved: Record<string, string> = {};
      KEYS_TO_PRESERVE.forEach(k => {
        const v = localStorage.getItem(k);
        if (v) preserved[k] = v;
      });

      // Clear everything
      localStorage.clear();

      // Restore critical values
      Object.entries(preserved).forEach(([k, v]) => {
        try { localStorage.setItem(k, v); } catch { /* ignore */ }
      });

      // Retry the original set
      try { localStorage.setItem(key, value); } catch {
        console.error('[AuthContext] Still cannot write to localStorage after clearing');
      }
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  safeLocalSet(LOCAL_KEYS.pendingUserId, userId);
  safeLocalSet(LOCAL_KEYS.pendingOldPass, oldPass);
  safeLocalSet(LOCAL_KEYS.pendingEmail, email);
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
  // ✅ Use sessionStorage only for attendance — avoids filling localStorage
  sessionStorage.setItem(ATT_SS.attendanceId, id);
  sessionStorage.setItem(ATT_SS.attendanceStatus, status);
  sessionStorage.setItem(ATT_SS.runningHours, hours);
  // Only persist attendanceId to localStorage (needed across tabs)
  safeLocalSet(ATT_SS.attendanceId, id);
}

function clearAttendanceSession() {
  Object.values(ATT_SS).forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

function _buildMinimalUser(id: string, email: string, role: string): AuthUser {
  return normaliseUser({
    _id: id,
    name: email.split('@')[0] ?? 'User',
    email,
    role: (role as AuthUser['role']) || 'employee',
    empNumber: '',
    firstLogin: false,
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

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

      safeLocalSet(SESSION_KEYS.authToken, token);
      saveAttendanceSession(result as unknown as Record<string, unknown>);

      const jwt = decodeJwt(token);
      const userId = (jwt.id ?? jwt._id ?? jwt.userId ?? jwt.sub ?? '') as string;
      safeLocalSet('employeeId', userId);

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
              empNumber: emp.empNumber ?? emp.empId ?? '',
              department: emp.dept ?? emp.departmentName ?? emp.department,
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
      safeLocalSet(SESSION_KEY, JSON.stringify(authUser));
      if (authUser.empNumber) safeLocalSet('empNumber', authUser.empNumber);

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
      const res = await changePasswordApi({
        userId, oldPassword: oldPass, newPassword, confirmPassword: newPassword,
      });
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
            empNumber: emp.empNumber ?? emp.empId ?? '',
            department: emp.dept ?? emp.departmentName ?? emp.department,
            designation: emp.designation,
            firstLogin: false,
          });
          setUser(freshUser);
          safeLocalSet(SESSION_KEY, JSON.stringify(freshUser));
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
    safeLocalSet(SESSION_KEY, JSON.stringify(updated));
  };

  const logout = () => {
    if (user?._id) {
      Object.keys(localStorage)
        .filter(k => k.startsWith(`tt_workSecs_${user._id}_`))
        .forEach(k => localStorage.removeItem(k));
    }
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