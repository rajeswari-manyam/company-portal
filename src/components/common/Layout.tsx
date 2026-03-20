import React, { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { LogOut, Bell, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import type { NavItem } from '../../types';
import Avatar from '../ui/Avatar';

interface LayoutProps {
  navItems: NavItem[];
  children: ReactNode;
}

const fmt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

export default function Layout({ navItems, children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { workSeconds, idleSeconds, status } = useTimeTracking();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-[#EEF0FF] text-[#0B0E92] font-semibold'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
    }`;

  const isTracked = user?.role !== 'admin';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100 min-h-[72px]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0B0E92, #69A6F0)' }}>
          <span className="text-white font-black text-sm">W</span>
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="font-black text-slate-900 text-sm leading-tight">WorkForce</p>
            <p className="text-xs text-slate-400">HR Portal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      {sidebarOpen && user && (
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={user.name} size="sm" />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 font-medium transition-colors"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex relative flex-col h-screen bg-white border-r border-slate-100 transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <SidebarContent />
        <button
          onClick={() => setSidebarOpen(p => !p)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:shadow-md z-10"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(true)}>
            <Menu size={20} className="text-slate-600" />
          </button>

          <div className="flex-1 hidden md:block">
            <p className="text-sm text-slate-500">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* ── TIME TRACKING DISPLAY (HR + Employee only) ── */}
          {isTracked && (
            <div className="flex items-center gap-2">
              {/* Work Time */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
                status === 'working'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'working' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider mr-0.5 opacity-60">Work</span>
                <span>{fmt(workSeconds)}</span>
              </div>

              {/* Idle Time */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
                status === 'idle'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'idle' ? 'bg-amber-400 animate-pulse' : 'bg-slate-200'}`} />
                <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider mr-0.5 opacity-60">Idle</span>
                <span>{fmt(idleSeconds)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center">
              <Bell size={18} className="text-slate-500" />
            </button>
            {user && <Avatar name={user.name} size="sm" />}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
