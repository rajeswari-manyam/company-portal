// src/pages/auth/Login.tsx

import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { forgotPasswordApi, resetPasswordApi } from "../../services/Auth.service";

/* ── Forgot password steps ── */
type ForgotStep = 'idle' | 'email' | 'otp' | 'reset';

/* ── Left branding panel (shared) ─────────────────────────── */
function BrandPanel() {
  return (
    <div
      className="md:w-2/3 flex flex-col justify-center items-center relative bg-cover bg-center min-h-[320px]"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&auto=format&fit=crop&q=60')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1450d6] to-[#08103cf0]" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 55%, rgba(11,14,146,0.18) 0%, transparent 70%)'
      }} />

      <div className="relative z-10 text-center px-8 py-16 flex flex-col items-center">
        <div className="mb-5" style={{
          animation: 'floatLogo 4s ease-in-out infinite',
          filter: 'drop-shadow(0 4px 24px rgba(11,14,146,0.5))'
        }}>
          <img
            src="/manyam-logo.png"
            alt="Manyam Logo"
            width={140}
            height={140}
            style={{
              objectFit: 'contain',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.92)',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
            }}
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        <p className="text-white text-xs uppercase tracking-widest mb-1 opacity-80">Manyam Consultancy</p>
        <h1 className="text-[#C9A84C] text-2xl font-bold uppercase mb-1 tracking-wide">&amp; Technology Services</h1>
        <p className="text-[#C9A84C] text-xs mb-5 opacity-75 uppercase tracking-widest">Private Limited</p>
        <div className="w-16 h-px mx-auto mb-4"
          style={{ background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }}
        />
        <p className="text-white text-xs uppercase opacity-55 tracking-widest">Software &amp; Consultancy Solutions</p>
      </div>

      <footer className="absolute bottom-4 w-full text-center text-white text-xs opacity-35 px-4">
        © {new Date().getFullYear()}, Manyam Consultancy &amp; Technology Services Pvt. Ltd. All Rights Reserved.
      </footer>

      <style>{`
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

/* ── Step 1: Enter email → POST /forgot-password ─────────── */
function ForgotEmailStep({
  onNext,
  onBack,
}: {
  onNext: (email: string) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await forgotPasswordApi({ email: email.trim() });
      console.log('[ForgotEmail] API response:', data);
      if (data.success) {
        toast.success('OTP sent to your email!');
        onNext(email.trim());
      } else {
        console.warn('[ForgotEmail] API returned failure:', data);
        toast.error(data.message ?? 'Failed to send OTP');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Something went wrong';
      console.error('[ForgotEmail] Error:', err?.response?.data ?? err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <button onClick={onBack} className="flex items-center gap-2 text-[#1a2a5e] opacity-60 hover:opacity-100 mb-8 group transition-all">
        <span className="w-8 h-8 rounded-full border border-[#1a2a5e]/30 group-hover:border-[#1a2a5e] group-hover:bg-[#1a2a5e] group-hover:text-white flex items-center justify-center transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </span>
        <span className="text-xs font-semibold tracking-wider uppercase">Back to Login</span>
      </button>

      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#1a2a5e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#1a2a5e] tracking-widest">FORGOT PASSWORD</h2>
        <p className="text-xs text-gray-400 mt-2">Enter your email and we'll send you an OTP</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            required
            className="bg-transparent border-b border-[#b0b8cc] focus:border-[#1a2a5e] outline-none py-1.5 text-sm text-[#1a2a5e] transition-colors duration-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="py-3 rounded-full text-white text-sm font-bold tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, #1a2a5e 0%, #1e3a8a 100%)' }}
        >
          {loading ? 'Sending OTP…' : 'SEND OTP »'}
        </button>
      </form>
    </div>
  );
}

/* ── Step 2: Enter OTP ───────────────────────────────────── */
function ForgotOtpStep({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: (otp: string) => void;
  onBack: () => void;
}) {
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) { toast.error('Please enter the OTP'); return; }
    onNext(otp.trim());
  };

  const resend = async () => {
    setResending(true);
    try {
      const data = await forgotPasswordApi({ email });
      console.log('[ResendOTP] API response:', data);
      if (data.success) toast.success('OTP resent!');
      else toast.error(data.message ?? 'Failed to resend');
    } catch (err: any) {
      console.error('[ResendOTP] Error:', err?.response?.data ?? err);
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <button onClick={onBack} className="flex items-center gap-2 text-[#1a2a5e] opacity-60 hover:opacity-100 mb-8 group transition-all">
        <span className="w-8 h-8 rounded-full border border-[#1a2a5e]/30 group-hover:border-[#1a2a5e] group-hover:bg-[#1a2a5e] group-hover:text-white flex items-center justify-center transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </span>
        <span className="text-xs font-semibold tracking-wider uppercase">Back</span>
      </button>

      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#1a2a5e] tracking-widest">ENTER OTP</h2>
        <p className="text-xs text-gray-400 mt-2">
          We sent a code to <span className="font-semibold text-[#1a2a5e]">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500">One-Time Password</label>
          <input
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Enter OTP"
            required
            autoFocus
            className="bg-transparent border-b border-[#b0b8cc] focus:border-[#1a2a5e] outline-none py-1.5 text-sm text-[#1a2a5e] tracking-widest transition-colors duration-200"
          />
        </div>

        <button
          type="submit"
          disabled={otp.length < 4}
          className="py-3 rounded-full text-white text-sm font-bold tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, #1a2a5e 0%, #1e3a8a 100%)' }}
        >
          VERIFY OTP »
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-gray-400">
        Didn't receive it?{' '}
        <button
          onClick={resend}
          disabled={resending}
          className="text-[#1a2a5e] font-semibold hover:underline disabled:opacity-50"
        >
          {resending ? 'Resending…' : 'Resend OTP'}
        </button>
      </p>
    </div>
  );
}

/* ── Step 3: Reset password → POST /reset-password ──────── */
function ForgotResetStep({
  email,
  otp,
  onBack,
  onDone,
}: {
  email: string;
  otp: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Minimum 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const data = await resetPasswordApi({ email, token: otp, newPassword, confirmPassword });
      console.log('[ResetPassword] API response:', data);
      if (data.success) {
        toast.success('Password reset successfully! Please login.');
        onDone();
      } else {
        console.warn('[ResetPassword] API returned failure:', data);
        toast.error(data.message ?? 'Reset failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Something went wrong';
      console.error('[ResetPassword] Error:', err?.response?.data ?? err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <button onClick={onBack} className="flex items-center gap-2 text-[#1a2a5e] opacity-60 hover:opacity-100 mb-8 group transition-all">
        <span className="w-8 h-8 rounded-full border border-[#1a2a5e]/30 group-hover:border-[#1a2a5e] group-hover:bg-[#1a2a5e] group-hover:text-white flex items-center justify-center transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </span>
        <span className="text-xs font-semibold tracking-wider uppercase">Back</span>
      </button>

      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#1a2a5e] tracking-widest">RESET PASSWORD</h2>
        <p className="text-xs text-gray-400 mt-2">Set your new password below</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        {/* New password */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-sm text-gray-500">New Password</label>
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
            autoFocus
            autoComplete="new-password"
            className="bg-transparent border-b border-[#b0b8cc] focus:border-[#1a2a5e] outline-none py-1.5 pr-14 text-sm text-[#1a2a5e] transition-colors duration-200"
          />
          <button type="button" onClick={() => setShowNew(s => !s)}
            className="absolute right-0 bottom-2 text-xs text-gray-400 hover:text-[#1a2a5e]">
            {showNew ? 'Hide' : 'Show'}
          </button>
          {newPassword.length > 0 && newPassword.length < 6 && (
            <p className="text-[11px] text-amber-600 mt-0.5">Must be at least 6 characters</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-sm text-gray-500">Confirm Password</label>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            required
            autoComplete="new-password"
            className="bg-transparent border-b border-[#b0b8cc] focus:border-[#1a2a5e] outline-none py-1.5 pr-14 text-sm text-[#1a2a5e] transition-colors duration-200"
          />
          <button type="button" onClick={() => setShowConfirm(s => !s)}
            className="absolute right-0 bottom-2 text-xs text-gray-400 hover:text-[#1a2a5e]">
            {showConfirm ? 'Hide' : 'Show'}
          </button>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-[11px] text-red-500 mt-0.5">Passwords do not match</p>
          )}
          {confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 6 && (
            <p className="text-[11px] text-emerald-600 mt-0.5">✓ Passwords match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
          className="py-3 rounded-full text-white text-sm font-bold tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(90deg, #1a2a5e 0%, #1e3a8a 100%)' }}
        >
          {loading ? 'Resetting…' : 'RESET PASSWORD »'}
        </button>
      </form>
    </div>
  );
}

/* ── Main Login Page ─────────────────────────────────────── */

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Forgot password flow state
  const [forgotStep,  setForgotStep]  = useState<ForgotStep>('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp,   setForgotOtp]   = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) { toast.error('Invalid email or password'); return; }

      if (result.mustChangePassword) {
        toast('Please set your new password to continue.', { icon: '🔐' });
        window.location.href = '/change-password';
        return;
      }

      const dashboardMap: Record<string, string> = {
        admin:    '/admin/dashboard',
        hr:       '/hr/dashboard',
        employee: '/employee/dashboard',
      };
      toast.success('Welcome back!');
      navigate(dashboardMap[result.role ?? ''] ?? '/', { replace: true });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Render forgot-password overlay on top of right panel ── */
  const renderRightPanel = () => {
    if (forgotStep === 'email') {
      return (
        <ForgotEmailStep
          onNext={email => { setForgotEmail(email); setForgotStep('otp'); }}
          onBack={() => setForgotStep('idle')}
        />
      );
    }

    if (forgotStep === 'otp') {
      return (
        <ForgotOtpStep
          email={forgotEmail}
          onNext={otp => { setForgotOtp(otp); setForgotStep('reset'); }}
          onBack={() => setForgotStep('email')}
        />
      );
    }

    if (forgotStep === 'reset') {
      return (
        <ForgotResetStep
          email={forgotEmail}
          otp={forgotOtp}
          onBack={() => setForgotStep('otp')}
          onDone={() => { setForgotStep('idle'); setForgotEmail(''); setForgotOtp(''); }}
        />
      );
    }

    /* Default: login form */
    return (
      <div className="w-full max-w-sm">
        <h2 className="text-center text-lg font-bold text-[#1a2a5e] tracking-widest mb-8">
          STAFF LOG IN
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-7">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-500">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="bg-transparent border-b border-[#b0b8cc] focus:border-[#1a2a5e] outline-none py-1.5 text-sm text-[#1a2a5e] transition-colors duration-200"
              required
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1 relative">
            <label className="text-sm text-gray-500">Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-transparent border-b border-[#b0b8cc] focus:border-[#1a2a5e] outline-none py-1.5 pr-12 text-sm text-[#1a2a5e] transition-colors duration-200"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-0 bottom-2 text-xs text-gray-400 hover:text-[#1a2a5e]"
            >
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 rounded-full text-white text-sm font-bold tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, #1a2a5e 0%, #1e3a8a 100%)' }}
          >
            {loading ? 'Signing in…' : 'LOGIN »'}
          </button>

          {/* Forgot password link */}
          <p
            onClick={() => setForgotStep('email')}
            className="text-center text-xs text-gray-400 underline underline-offset-2 cursor-pointer hover:text-[#1a2a5e] transition-colors"
          >
            Forgot Password?
          </p>
        </form>

        <div className="mt-8 p-4 rounded-xl text-xs"
          style={{ background: 'rgba(26,42,94,0.06)', border: '1px solid rgba(26,42,94,0.1)' }}
        >
          <p className="font-bold text-gray-500 uppercase tracking-wider mb-2">Demo Credentials</p>
          <p className="text-gray-800 mb-1"><b>Admin:</b> admin@test.com / Admin@123</p>
          <p className="text-gray-400 text-[11px]">Admin adds HR → HR adds Employees</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      <BrandPanel />
      <div className="md:w-1/3 flex items-center justify-center bg-[#f0f2f7] px-8 py-16">
        {renderRightPanel()}
      </div>
    </div>
  );
}