// src/pages/auth/Login.tsx
// Production-grade Login — React + TypeScript + Tailwind CSS
// Fully wired to AuthContext (useAuth) + Auth.service.ts

import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import manyamLogo from '../../assets/images/ManyamLogo.png';
import {
  forgotPasswordApi,
  resetPasswordApi,
  getDashboardPath,
} from '../../service/Auth.service';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type ForgotStep = 'idle' | 'email' | 'otp' | 'reset';

/* ─────────────────────────────────────────────
   Brand Panel — exported for ChangePassword page
───────────────────────────────────────────── */
export function BrandPanel() {
  return (
    <>
      {/* ── Mobile top banner ── */}
      <div
        className="md:hidden flex-shrink-0 flex items-center gap-3 px-5 py-3"
        style={{ background: 'linear-gradient(135deg, #0a1450 0%, #08103c 100%)' }}
      >
        
        <div className="min-w-0">
          <p className="text-white text-[11px] font-bold uppercase tracking-wide leading-tight truncate">
            Manyam Consultancy
          </p>
          <p className="text-[#C9A84C] text-[10px] uppercase tracking-widest opacity-90 leading-tight truncate">
            &amp; Technology Services Pvt. Ltd.
          </p>
        </div>
      </div>

      {/* ── Desktop: full left panel (city bg + overlay) ── */}
      <div
        className="hidden md:flex flex-col items-center justify-center relative overflow-hidden"
        style={{ width: '60%', minHeight: '100vh', flexShrink: 0 }}
      >
        {/* City photo background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&auto=format&fit=crop&q=80')",
          }}
        />
        {/* Deep navy overlay — same as screenshot */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(10, 20, 80, 0.82)' }}
        />
        {/* Subtle decorative ring (top-right, like screenshot) */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10 border border-[#C9A84C]" />

        {/* Centered content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          {/* Logo on white pill — floating */}
          <div
            className="mb-6 bg-white rounded-2xl shadow-2xl px-8 py-4 flex items-center justify-center"
            style={{ animation: 'floatLogo 4s ease-in-out infinite' }}
          >
            <img
              src={manyamLogo}
              alt="Manyam Logo"
              className="h-20 w-auto object-contain"
            />
          </div>

          {/* Company name — matches screenshot typography */}
          <p className="text-white text-[11px] uppercase tracking-[0.3em] mb-1 opacity-70">
            Manyam Consultancy
          </p>
          <h1 className="text-[#C9A84C] text-3xl font-extrabold uppercase tracking-wide leading-tight mb-1">
            &amp; Technology Services
          </h1>
          <p className="text-[#C9A84C] text-xs mb-6 opacity-70 uppercase tracking-[0.25em]">
            Private Limited
          </p>

          <div
            className="w-16 h-px mx-auto mb-5"
            style={{ background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }}
          />

          <p className="text-white text-[11px] uppercase opacity-40 tracking-[0.25em]">
            Software &amp; Consultancy Solutions
          </p>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-4 w-full text-center text-white text-[10px] opacity-30 px-6">
          © {new Date().getFullYear()} Manyam Consultancy &amp; Technology Services Pvt. Ltd. All Rights Reserved.
        </footer>
      </div>

      <style>{`
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
}

/* ─────────────────────────────────────────────
   Shared: Input Field
───────────────────────────────────────────── */
interface FieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  hint?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

function Field({
  label, type, value, onChange,
  placeholder, autoFocus, autoComplete, hint, rightSlot,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          required
          className="w-full bg-transparent border-b-2 border-slate-200 focus:border-[#1a2a5e]
            outline-none py-2.5 pr-14 text-sm text-[#1a2a5e] placeholder-slate-300
            transition-colors duration-200 caret-[#1a2a5e]"
        />
        {rightSlot && <div className="absolute right-0 bottom-2.5">{rightSlot}</div>}
      </div>
      {hint}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared: Primary Submit Button
───────────────────────────────────────────── */
function PrimaryBtn({ children, loading, disabled }: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="w-full py-3.5 rounded-full text-white text-sm font-bold tracking-[0.15em] shadow-lg
        hover:opacity-90 active:scale-95 transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      style={{ background: 'linear-gradient(90deg, #1a2a5e 0%, #1e3a8a 100%)' }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Shared: Back Button
───────────────────────────────────────────── */
function BackBtn({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-[#1a2a5e] opacity-60 hover:opacity-100 mb-7 group transition-all"
    >
      <span className="w-8 h-8 rounded-full border border-[#1a2a5e]/30
        group-hover:border-[#1a2a5e] group-hover:bg-[#1a2a5e] group-hover:text-white
        flex items-center justify-center transition-all duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="w-3.5 h-3.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </span>
      <span className="text-[11px] font-bold tracking-[0.15em] uppercase">{label}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Shared: Step Icon Header
───────────────────────────────────────────── */
function StepHeader({ icon, iconBg, iconColor, title, subtitle }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-8">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: iconBg }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <h2 className="text-base font-extrabold text-[#1a2a5e] tracking-[0.15em] uppercase">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Login Form  ←  uses useAuth().login + getDashboardPath
───────────────────────────────────────────── */
function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email.trim(), password);

      if (!result.success) {
        toast.error('Invalid email or password');
        return;
      }

      if (result.mustChangePassword) {
        toast('Please set your new password to continue.', { icon: '🔐' });
        // Hard redirect preserves pending session keys set inside AuthContext.login()
        window.location.href = '/change-password';
        return;
      }

      toast.success('Welcome back!');
      navigate(getDashboardPath(result.role), { replace: true });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-9">
        <h2 className="text-xl font-extrabold text-[#1a2a5e] tracking-[0.2em] uppercase">
          Staff Log In
        </h2>
        <p className="text-xs text-slate-400 mt-1.5">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
          autoComplete="username"
          autoFocus
        />
        <Field
          label="Password"
          type={showPass ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
          rightSlot={
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="text-xs text-slate-400 hover:text-[#1a2a5e] font-semibold transition-colors">
              {showPass ? 'Hide' : 'Show'}
            </button>
          }
        />

        <PrimaryBtn loading={loading} disabled={!email || !password}>
          {loading ? 'Signing in…' : 'LOGIN »'}
        </PrimaryBtn>

        <button
          type="button"
          onClick={onForgot}
          className="text-center text-xs text-slate-400 underline underline-offset-2
            hover:text-[#1a2a5e] transition-colors font-medium"
        >
          Forgot Password?
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Forgot Step 1 — Email  ←  forgotPasswordApi
───────────────────────────────────────────── */
function ForgotEmailStep({
  onNext, onBack,
}: { onNext: (email: string) => void; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await forgotPasswordApi({ email: email.trim() });
      if (data.success) {
        toast.success('OTP sent to your email!');
        onNext(email.trim());
      } else {
        toast.error(data.message ?? 'Failed to send OTP');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <BackBtn onClick={onBack} label="Back to Login" />
      <StepHeader
        iconBg="#EFF6FF" iconColor="#1a2a5e"
        title="Forgot Password"
        subtitle="Enter your email and we'll send you an OTP"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field
          label="Email Address" type="email"
          value={email} onChange={setEmail}
          placeholder="Enter your registered email"
          autoComplete="email" autoFocus
        />
        <PrimaryBtn loading={loading} disabled={!email}>
          {loading ? 'Sending OTP…' : 'SEND OTP »'}
        </PrimaryBtn>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Forgot Step 2 — OTP  ←  forgotPasswordApi (resend)
───────────────────────────────────────────── */
function ForgotOtpStep({
  email, onNext, onBack,
}: { email: string; onNext: (otp: string) => void; onBack: () => void }) {
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
      if (data.success) toast.success('OTP resent!');
      else toast.error(data.message ?? 'Failed to resend');
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full">
      <BackBtn onClick={onBack} />
      <StepHeader
        iconBg="#FFFBEB" iconColor="#D97706"
        title="Enter OTP"
        subtitle={`We sent a code to ${email}`}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field
          label="One-Time Password" type="text"
          value={otp}
          onChange={v => setOtp(v.replace(/\D/g, '').slice(0, 8))}
          placeholder="Enter OTP" autoFocus autoComplete="one-time-code"
        />
        <PrimaryBtn disabled={otp.length < 4}>VERIFY OTP »</PrimaryBtn>
      </form>
      <p className="mt-5 text-center text-xs text-slate-400">
        Didn't receive it?{' '}
        <button type="button" onClick={resend} disabled={resending}
          className="text-[#1a2a5e] font-bold hover:underline disabled:opacity-50 transition-all">
          {resending ? 'Resending…' : 'Resend OTP'}
        </button>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Forgot Step 3 — Reset  ←  resetPasswordApi
───────────────────────────────────────────── */
function ForgotResetStep({
  email, otp, onBack, onDone,
}: { email: string; otp: string; onBack: () => void; onDone: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Minimum 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const data = await resetPasswordApi({ email, token: otp, newPassword, confirmPassword });
      if (data.success) {
        toast.success('Password reset! Please login.');
        onDone();
      } else {
        toast.error(data.message ?? 'Reset failed');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <BackBtn onClick={onBack} />
      <StepHeader
        iconBg="#ECFDF5" iconColor="#059669"
        title="Reset Password"
        subtitle="Set your new password below"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        }
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field
          label="New Password"
          type={showNew ? 'text' : 'password'}
          value={newPassword} onChange={setNewPassword}
          placeholder="Min. 6 characters" autoFocus autoComplete="new-password"
          rightSlot={
            <button type="button" onClick={() => setShowNew(s => !s)}
              className="text-xs text-slate-400 hover:text-[#1a2a5e] font-semibold transition-colors">
              {showNew ? 'Hide' : 'Show'}
            </button>
          }
          hint={newPassword.length > 0 && newPassword.length < 6
            ? <p className="text-[11px] text-amber-600 mt-1">Must be at least 6 characters</p>
            : null}
        />
        <Field
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword} onChange={setConfirmPassword}
          placeholder="Repeat new password" autoComplete="new-password"
          rightSlot={
            <button type="button" onClick={() => setShowConfirm(s => !s)}
              className="text-xs text-slate-400 hover:text-[#1a2a5e] font-semibold transition-colors">
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          }
          hint={
            confirmPassword.length > 0
              ? newPassword !== confirmPassword
                ? <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
                : newPassword.length >= 6
                  ? <p className="text-[11px] text-emerald-600 mt-1">✓ Passwords match</p>
                  : null
              : null
          }
        />
        <PrimaryBtn
          loading={loading}
          disabled={newPassword.length < 6 || newPassword !== confirmPassword}
        >
          {loading ? 'Resetting…' : 'RESET PASSWORD »'}
        </PrimaryBtn>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page Root
───────────────────────────────────────────── */
export default function Login() {
  const [forgotStep, setForgotStep] = useState<ForgotStep>('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');

  const renderForm = () => {
    switch (forgotStep) {
      case 'email':
        return (
          <ForgotEmailStep
            onNext={e => { setForgotEmail(e); setForgotStep('otp'); }}
            onBack={() => setForgotStep('idle')}
          />
        );
      case 'otp':
        return (
          <ForgotOtpStep
            email={forgotEmail}
            onNext={o => { setForgotOtp(o); setForgotStep('reset'); }}
            onBack={() => setForgotStep('email')}
          />
        );
      case 'reset':
        return (
          <ForgotResetStep
            email={forgotEmail} otp={forgotOtp}
            onBack={() => setForgotStep('otp')}
            onDone={() => { setForgotStep('idle'); setForgotEmail(''); setForgotOtp(''); }}
          />
        );
      default:
        return <LoginForm onForgot={() => setForgotStep('email')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      {/* Brand panel — LEFT ~60% on desktop, top banner on mobile */}
      <BrandPanel />

      {/* Form panel — RIGHT ~40% on desktop, white background */}
      <div
        className="flex-1 flex items-center justify-center px-8 py-10 md:py-0 overflow-y-auto bg-[#f0f2f7]"
      >
        <div className="w-full max-w-xs">{renderForm()}</div>
      </div>
    </div>
  );
}