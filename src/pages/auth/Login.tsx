import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email.trim(), password);

    if (!result.success) {
      toast.error('Invalid email or password');
      setLoading(false);
      return;
    }

    // Navigate immediately after successful login
    // mustChangePassword=true  → go to /change-password (first-time HR/Employee login)
    // mustChangePassword=false → go to "/" which ProtectedRoute redirects to correct dashboard
    if (result.mustChangePassword) {
      navigate('/change-password', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div
        className="md:w-2/3 flex flex-col justify-center items-center relative bg-cover bg-center min-h-[320px]"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&auto=format&fit=crop&q=60')",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1450d6] to-[#08103cf0]" />

        {/* Radial glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 55%, rgba(11,14,146,0.18) 0%, transparent 70%)'
        }} />

        {/* Content */}
        <div className="relative z-10 text-center px-8 py-16 flex flex-col items-center">

          {/* Animated logo */}
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
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const fallback = document.getElementById('logo-fallback');
                if (fallback) fallback.style.display = 'block';
              }}
            />
            {/* SVG fallback */}
            <div id="logo-fallback" style={{ display: 'none' }}>
              <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width={80} height={80}>
                <circle cx="30" cy="30" r="28" stroke="#C9A84C" strokeWidth="1.5" fill="none" opacity="0.4"/>
                <path d="M30 8 L30 52" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M30 8 C30 8, 18 22, 18 32 C18 38, 23 43, 30 44 C37 43, 42 38, 42 32 C42 22, 30 8, 30 8Z"
                  stroke="#C9A84C" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
                <circle cx="30" cy="8" r="2.5" fill="#C9A84C"/>
              </svg>
            </div>
          </div>

          <p className="text-white text-xs uppercase tracking-widest mb-1 opacity-80">
            Manyam Consultancy
          </p>
          <h1 className="text-[#C9A84C] text-2xl font-bold uppercase mb-1 tracking-wide">
            &amp; Technology Services
          </h1>
          <p className="text-[#C9A84C] text-xs mb-5 opacity-75 uppercase tracking-widest">
            Private Limited
          </p>

          <div className="w-16 h-px mx-auto mb-4"
            style={{ background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }}
          />

          <p className="text-white text-xs uppercase opacity-55 tracking-widest">
            Software &amp; Consultancy Solutions
          </p>
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

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="md:w-1/3 flex items-center justify-center bg-[#f0f2f7] px-8 py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-center text-lg font-bold text-[#1a2a5e] tracking-widest mb-8">
            STAFF LOG IN
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-7">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-transparent border-b border-[#b0b8cc] focus:border-[#1a2a5e] outline-none py-1.5 text-sm text-[#1a2a5e] transition-colors duration-200"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-sm text-gray-500">Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-transparent border-b border-[#b0b8cc] focus:border-[#1a2a5e] outline-none py-1.5 pr-12 text-sm text-[#1a2a5e] transition-colors duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-0 bottom-2 text-xs text-gray-400 hover:text-[#1a2a5e]"
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 py-3 rounded-full text-white text-sm font-bold tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #1a2a5e 0%, #1e3a8a 100%)' }}
            >
              {loading ? 'Signing in…' : 'LOGIN IN »'}
            </button>

            <p className="text-center text-xs text-gray-400 underline underline-offset-2 cursor-pointer hover:text-[#1a2a5e] transition-colors">
              Forgot Password?
            </p>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl text-xs"
            style={{ background: 'rgba(26,42,94,0.06)', border: '1px solid rgba(26,42,94,0.1)' }}
          >
            <p className="font-bold text-gray-500 uppercase tracking-wider mb-2">Demo Credentials</p>
            <p className="text-gray-800 mb-1"><b>Admin:</b> admin@company.com / Admin@123</p>
            <p className="text-gray-400 text-[11px]">Admin adds HR → HR adds Employees</p>
          </div>
        </div>
      </div>
    </div>
  );
}
