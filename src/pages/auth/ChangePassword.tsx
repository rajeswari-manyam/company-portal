// src/pages/auth/ChangePassword.tsx

import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath } from "../../service/Auth.service";
import toast from 'react-hot-toast';

const PENDING_USER_ID_KEY  = 'pending_userId';
const PENDING_OLD_PASS_KEY = 'pending_oldPass';
const PENDING_EMAIL_KEY    = 'pending_email';

export default function ChangePassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const handleBack = () => {
    sessionStorage.removeItem(PENDING_USER_ID_KEY);
    sessionStorage.removeItem(PENDING_OLD_PASS_KEY);
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
    localStorage.removeItem('fl_pending_userId');
    localStorage.removeItem('fl_pending_oldPass');
    localStorage.removeItem('fl_pending_email');
    window.location.href = '/login';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Minimum 8 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const result = await updatePassword(password);
      if (!result.success) { toast.error('Failed to update password. Please try again.'); return; }

      toast.success('Password updated! Redirecting…');
      const role = result.role ?? 'employee';
      const path = getDashboardPath(role);
      setTimeout(() => { window.location.href = path; }, 1000);
    } catch (err) {
      console.error('[ChangePassword]', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /*
     * ✅ Same no-scroll fix as Login.tsx:
     *   h-screen + overflow-hidden  → locked to viewport
     *   flex-col / md:flex-row      → mobile stacks, desktop splits
     *   BrandPanel h-20             → compact 80px strip on mobile
     *   form panel flex-1           → fills remaining height
     */
    <div className="h-screen overflow-hidden flex flex-col md:flex-row font-sans">

      {/* ── BRAND PANEL ─────────────────────────────────────────── */}
      <div
        className="
          relative bg-cover bg-center flex-shrink-0
          flex flex-row items-center justify-start gap-3 px-6
          h-20
          md:h-auto md:flex-col md:justify-center md:items-center md:px-8 md:w-2/3
        "
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&auto=format&fit=crop&q=60')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1450d6] to-[#08103cf0]" />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 55%, rgba(11,14,146,0.18) 0%, transparent 70%)'
        }} />

        {/* Mobile: logo + text in a single compact row */}
        <div className="relative z-10 flex flex-row items-center gap-3 md:hidden">
          <img
            src="/manyam-logo.png"
            alt="Manyam Logo"
            className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.92)', padding: '4px' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <p className="text-[#C9A84C] text-xs font-bold uppercase tracking-wide leading-tight">
              Manyam Consultancy
            </p>
            <p className="text-[#C9A84C] text-[10px] uppercase tracking-widest opacity-80 leading-tight">
              &amp; Technology Services Pvt. Ltd.
            </p>
          </div>
        </div>

        {/* Desktop: full centered column */}
        <div className="relative z-10 hidden md:flex flex-col items-center text-center px-8 py-16">
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
                const fb = document.getElementById('cp-logo-fallback');
                if (fb) fb.style.display = 'block';
              }}
            />
            <div id="cp-logo-fallback" style={{ display: 'none' }}>
              <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width={80} height={80}>
                <circle cx="30" cy="30" r="28" stroke="#C9A84C" strokeWidth="1.5" fill="none" opacity="0.4"/>
                <path d="M30 8 L30 52" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M30 8 C30 8, 18 22, 18 32 C18 38, 23 43, 30 44 C37 43, 42 38, 42 32 C42 22, 30 8, 30 8Z"
                  stroke="#C9A84C" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
                <circle cx="30" cy="8" r="2.5" fill="#C9A84C"/>
              </svg>
            </div>
          </div>
          <p className="text-white text-xs uppercase tracking-widest mb-1 opacity-80">Manyam Consultancy</p>
          <h1 className="text-[#C9A84C] text-2xl font-bold uppercase mb-1 tracking-wide">&amp; Technology Services</h1>
          <p className="text-[#C9A84C] text-xs mb-5 opacity-75 uppercase tracking-widest">Private Limited</p>
          <div className="w-16 h-px mx-auto mb-4"
            style={{ background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }}
          />
          <p className="text-white text-xs uppercase opacity-55 tracking-widest">Software &amp; Consultancy Solutions</p>
        </div>

        <footer className="absolute bottom-2 w-full text-center text-white text-[10px] opacity-35 px-4 hidden md:block">
          © {new Date().getFullYear()}, Manyam Consultancy &amp; Technology Services Pvt. Ltd. All Rights Reserved.
        </footer>

        <style>{`
          @keyframes floatLogo {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-8px); }
          }
        `}</style>
      </div>

      {/* ── FORM PANEL ──────────────────────────────────────────── */}
      <div className="flex-1 md:w-1/3 flex items-center justify-center bg-[#f0f2f7] px-8 py-6 overflow-y-auto relative">

        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 text-[#1a2a5e] opacity-60 hover:opacity-100 transition-all duration-200 group"
          title="Back to Login"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full border border-[#1a2a5e] border-opacity-30 group-hover:border-opacity-100 group-hover:bg-[#1a2a5e] group-hover:text-white transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase">Back</span>
        </button>

        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold text-[#1a2a5e] tracking-widest">SET NEW PASSWORD</h2>
            <p className="text-xs text-gray-400 mt-2">Please set your own password to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">

            {/* New password */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-sm text-gray-500">New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className="bg-transparent border-b border-[#b0b8cc] focus:border-[#1a2a5e] outline-none py-1.5 pr-16 text-sm text-[#1a2a5e] transition-colors duration-200"
                required
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-0 bottom-2 text-xs text-gray-400 hover:text-[#1a2a5e]">
                {showPw ? 'Hide' : 'Show'}
              </button>
              {password.length > 0 && password.length < 8 && (
                <p className="text-[11px] text-amber-600 mt-0.5">Must be at least 8 characters</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-sm text-gray-500">Confirm Password</label>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
                className="bg-transparent border-b border-[#b0b8cc] focus:border-[#1a2a5e] outline-none py-1.5 pr-16 text-sm text-[#1a2a5e] transition-colors duration-200"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-0 bottom-2 text-xs text-gray-400 hover:text-[#1a2a5e]">
                {showConfirm ? 'Hide' : 'Show'}
              </button>
              {confirm.length > 0 && password !== confirm && (
                <p className="text-[11px] text-red-500 mt-0.5">Passwords do not match</p>
              )}
              {confirm.length > 0 && password === confirm && password.length >= 8 && (
                <p className="text-[11px] text-emerald-600 mt-0.5">✓ Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirm}
              className="mt-2 py-3 rounded-full text-white text-sm font-bold tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(90deg, #1a2a5e 0%, #1e3a8a 100%)' }}
            >
              {loading ? 'Updating…' : 'UPDATE PASSWORD »'}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-gray-400">
            This is a one-time setup. You can change your password anytime from{' '}
            <span className="font-semibold">My Profile → Update Password</span>.
          </p>
        </div>
      </div>
    </div>
  );
}