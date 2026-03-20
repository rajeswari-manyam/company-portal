// src/context/AuthContext.tsx

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

// ─── Attendance session keys (must match Attendance.service.ts ATT_KEYS) ──────
const ATT_SS = {
  attendanceId:     'att_attendanceId',
  attendanceStatus: 'att_status',
  runningHours:     'att_runningHours',
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  empId?: string;
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

// ─── JWT decode helper ────────────────────────────────────────────────────────
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

// ─── Pending session helpers ──────────────────────────────────────────────────
function setPendingSession(userId: string, oldPass: string, email: string) {
  sessionStorage.setItem(SESSION_KEYS.userId,    userId);
  sessionStorage.setItem(SESSION_KEYS.oldPass,   oldPass);
  sessionStorage.setItem(SESSION_KEYS.userEmail, email);
  localStorage.setItem(LOCAL_KEYS.pendingUserId,  userId);
  localStorage.setItem(LOCAL_KEYS.pendingOldPass, oldPass);
  localStorage.setItem(LOCAL_KEYS.pendingEmail,   email);
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

// ─── Attendance session helpers ───────────────────────────────────────────────

function saveAttendanceSession(res: Record<string, unknown>) {
  const id      = (res.attendanceId     as string) ?? '';
  const status  = (res.attendanceStatus as string) ?? '';
  const hours   = String((res.runningHours as number) ?? 0);

  if (!id) return; // no attendance data in this response — skip

  // sessionStorage: cleared when tab closes
  sessionStorage.setItem(ATT_SS.attendanceId,     id);
  sessionStorage.setItem(ATT_SS.attendanceStatus, status);
  sessionStorage.setItem(ATT_SS.runningHours,     hours);
  // localStorage: survives HMR / hard refresh
  localStorage.setItem(ATT_SS.attendanceId,     id);
  localStorage.setItem(ATT_SS.attendanceStatus, status);
  localStorage.setItem(ATT_SS.runningHours,     hours);
}

function clearAttendanceSession() {
  Object.values(ATT_SS).forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed?._id) setUser(parsed);
        else localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    try {
      const result = await loginApi({ email, password });

      if (!result.success) return { success: false };

      // ── First login → must change password ─────────────────────────────
      if (result.changePassword) {
        setPendingSession(result.userId, password, email);
        return { success: true, mustChangePassword: true };
      }

      // ── Normal login ────────────────────────────────────────────────────
      const token = (result as { token?: string }).token ?? '';
      const role  = (result as { role?:  string }).role  ?? '';

      localStorage.setItem(SESSION_KEYS.authToken, token);

      // ✅ Persist attendanceId, attendanceStatus, runningHours from login response
      // These power LiveAttendanceWidget without an extra API call on mount.
      saveAttendanceSession(result as unknown as Record<string, unknown>);

      console.log('[AuthContext] Attendance session saved:',
        sessionStorage.getItem(ATT_SS.attendanceId));

      // Decode userId from JWT
      const jwt    = decodeJwt(token);
      const userId = (jwt.id ?? jwt._id ?? jwt.userId ?? jwt.sub ?? '') as string;
      localStorage.setItem("employeeId", userId); // ✅ ADD THIS
      let authUser: AuthUser;

      if (userId) {
        try {
          const userRes = await getUserByIdApi(userId);
          if (userRes.success && (userRes.employee ?? userRes.user)) {
            const emp = userRes.employee ?? userRes.user;
            authUser = {
              _id:         emp._id,
              name:        emp.name        ?? '',
              email:       emp.email       ?? email,
              role:        emp.role        ?? role as AuthUser['role'],
              empId:       emp.empId,
              department:  emp.department,
              designation: emp.designation,
              firstLogin:  emp.firstLogin  ?? false,
            };
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

      return { success: true, mustChangePassword: false, role: authUser.role };

    } catch (err) {
      console.error('[AuthContext] login error:', err);
      return { success: false };
    }
  };

  // ── updatePassword ────────────────────────────────────────────────────────
  const updatePassword = async (newPassword: string): Promise<{ success: boolean; role?: string }> => {
    const userId  = getPendingUserId();
    const oldPass = getPendingOldPass();

    if (!userId) return { success: false };

    try {
      const res = await changePasswordApi({
        userId,
        oldPassword:     oldPass,
        newPassword,
        confirmPassword: newPassword,
      });

      if (!res.success) return { success: false };

      let role: string | undefined;

      try {
        const userRes = await getUserByIdApi(userId);
        const emp = userRes.employee ?? userRes.user;
        if (userRes.success && emp) {
          const freshUser: AuthUser = {
            _id:         emp._id,
            name:        emp.name        ?? '',
            email:       emp.email       ?? '',
            role:        emp.role,
            empId:       emp.empId,
            department:  emp.department,
            designation: emp.designation,
            firstLogin:  false,
          };
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

  // ── updateProfile ─────────────────────────────────────────────────────────
  const updateProfile = (updates: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  };

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEYS.authToken);
    clearPendingSession();
    clearAttendanceSession(); // ✅ wipe attendance keys on logout
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

// ─── Minimal user fallback ────────────────────────────────────────────────────
function _buildMinimalUser(id: string, email: string, role: string): AuthUser {
  return {
    _id:        id,
    name:       email.split('@')[0] ?? 'User',
    email,
    role:       (role as AuthUser['role']) || 'employee',
    firstLogin: false,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}