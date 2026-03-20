// src/service/Auth.service.ts

import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as unknown as { env: { VITE_API_BASE_URL: string } }).env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginFirstTimeResponse {
  success: true;
  message: string;
  userId: string;
  changePassword: true;
}

export interface LoginSuccessResponse {
  success: true;
  message: string;
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'hr' | 'employee';
    empId?: string;
    department?: string;
    designation?: string;
    firstLogin: boolean;
  };
  changePassword: false;
}

export interface LoginErrorResponse {
  success: false;
  message: string;
}

export type LoginResponse =
  | LoginFirstTimeResponse
  | LoginSuccessResponse
  | LoginErrorResponse;

export interface ChangePasswordPayload {
  userId: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'hr' | 'employee';
    empId?: string;
    department?: string;
    firstLogin: boolean;
  };
  token?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;       // OTP received in email
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// ─── Session keys ───────────────────────────────────────────────────────────────
export const SESSION_KEYS = {
  userId:    'pending_userId',
  oldPass:   'pending_oldPass',
  userEmail: 'pending_email',
  authToken: 'auth_token',
  authUser:  'auth_user',
} as const;

// ─── localStorage fallback keys (survive HMR reloads) ──────────────────────────
export const LOCAL_KEYS = {
  pendingUserId:  'fl_pending_userId',
  pendingOldPass: 'fl_pending_oldPass',
  pendingEmail:   'fl_pending_email',
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toForm(payload: Record<string, string>): URLSearchParams {
  const form = new URLSearchParams();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') form.append(k, v);
  });
  return form;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(
    '/login',
    payload, // Send standard JSON payload instead of toForm()
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

export async function changePasswordApi(
  payload: ChangePasswordPayload
): Promise<ChangePasswordResponse> {
  const { data } = await api.post<ChangePasswordResponse>(
    '/changepassword',
    toForm(payload as unknown as Record<string, string>)
  );
  return data;
}

export async function getUserByIdApi(id: string) {
  const { data } = await api.get(`/getemployee/${id}`);
  return data;
}

/**
 * POST /forgot-password  (form-encoded)
 * Sends an OTP to the given email address.
 */
export async function forgotPasswordApi(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  const form = new URLSearchParams();
  form.append('email', payload.email);

  console.group('%c[FORGOT PASSWORD] POST /forgot-password', 'color:#f59e0b;font-weight:bold');
  console.log('📧 Email:', payload.email);
  console.log('📤 Request body:', form.toString());

  try {
    const { data } = await api.post<ForgotPasswordResponse>(
      '/forgot-password',
      form,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('✅ Response:', data);
    console.groupEnd();
    return data;
  } catch (err: any) {
    console.error('❌ Error:', err?.response?.data ?? err?.message ?? err);
    console.groupEnd();
    throw err;
  }
}

/**
 * POST /reset-password  (JSON)
 * Resets the password using the OTP token received via email.
 */
export async function resetPasswordApi(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  console.group('%c[RESET PASSWORD] POST /reset-password', 'color:#10b981;font-weight:bold');
  console.log('📧 Email:', payload.email);
  console.log('🔑 Token (OTP):', payload.token);
  console.log('📤 Request body:', JSON.stringify(payload));

  try {
    const { data } = await api.post<ResetPasswordResponse>(
      '/reset-password',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('✅ Response:', data);
    console.groupEnd();
    return data;
  } catch (err: any) {
    console.error('❌ Error:', err?.response?.data ?? err?.message ?? err);
    console.groupEnd();
    throw err;
  }
}

export function getDashboardPath(role?: string): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'hr')    return '/hr/dashboard';
  return '/employee/dashboard';
}