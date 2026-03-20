import React, { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import {
  LogOut, Bell, Menu, ChevronLeft, ChevronRight,
  LayoutDashboard, Users, Building2, CalendarCheck, CalendarOff,
  Wallet, Megaphone, Gift, FileText, UserCircle, FolderKanban,
  CheckSquare,
} from 'lucide-react';
import type { NavItem } from '../../types';
import Avatar from '../ui/Avatar';

// ── Route → Lucide icon map ───────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  '/hr/dashboard':            <LayoutDashboard size={16} />,
  '/hr/employees':            <Users           size={16} />,
  '/hr/departments':          <Building2       size={16} />,
  '/hr/attendance':           <CalendarCheck   size={16} />,
  '/hr/leaves':               <CalendarOff     size={16} />,
  '/hr/payroll':              <Wallet          size={16} />,
  '/hr/announcements':        <Megaphone       size={16} />,
  '/hr/holidays':             <Gift            size={16} />,
  '/hr/documents':            <FileText        size={16} />,
  '/hr/profile':              <UserCircle      size={16} />,
  '/admin/dashboard':         <LayoutDashboard size={16} />,
  '/admin/employees':         <Users           size={16} />,
  '/admin/departments':       <Building2       size={16} />,
  '/admin/attendance':        <CalendarCheck   size={16} />,
  '/admin/leaves':            <CalendarOff     size={16} />,
  '/admin/payslips':          <Wallet          size={16} />,
  '/admin/announcements':     <Megaphone       size={16} />,
  '/admin/holidays':          <Gift            size={16} />,
  '/admin/documents':         <FileText        size={16} />,
  '/employee/dashboard':      <LayoutDashboard size={16} />,
  '/employee/attendance':     <CalendarCheck   size={16} />,
  '/employee/leaves':         <CalendarOff     size={16} />,
  '/employee/payslips':       <Wallet          size={16} />,
  '/employee/documents':      <FileText        size={16} />,
  '/employee/announcements':  <Megaphone       size={16} />,
  '/employee/holidays':       <Gift            size={16} />,
  '/employee/projects':       <FolderKanban    size={16} />,
  '/employee/tasks':          <CheckSquare     size={16} />,
  '/employee/profile':        <UserCircle      size={16} />,
};

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

interface LayoutProps  { navItems: NavItem[]; children: ReactNode; }
interface SidebarProps {
  navItems: NavItem[];
  user: { name: string; role: string } | null;
  sidebarOpen: boolean;
  onNavClick?: () => void;
  onLogout: () => void;
}

// ── Sidebar (outside Layout so React never remounts it) ───────────────────────
function Sidebar({ navItems, user, sidebarOpen, onNavClick, onLogout }: SidebarProps) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'group relative flex items-center rounded-xl transition-all duration-150 select-none',
      sidebarOpen ? 'gap-3 px-3 py-2.5 mx-2' : 'justify-center w-10 h-10 mx-auto',
      isActive
        ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-md shadow-blue-900/20'
        : 'text-slate-500 hover:bg-gradient-to-r hover:from-[#0B0E92] hover:to-[#69A6F0] hover:text-white',
    ].join(' ');

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 min-h-[72px] flex-shrink-0 ${!sidebarOpen ? 'justify-center' : ''}`}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: 'linear-gradient(135deg,#0B0E92,#69A6F0)' }}
        >
          <span className="text-white font-black text-sm leading-none">W</span>
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="font-extrabold text-slate-900 text-[15px] leading-none">WorkForce</p>
            <p className="text-[10px] text-slate-400 mt-0.5">HR Portal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.endsWith('dashboard')}
            className={navLinkClass}
            onClick={onNavClick}
            title={!sidebarOpen ? item.label : undefined}
          >
            {/* Lucide icon via ICON_MAP — never renders the icon string */}
            <span className="shrink-0 leading-none w-4 flex items-center justify-center">
              {ICON_MAP[item.to] ?? <LayoutDashboard size={16} />}
            </span>

            {/* Label */}
            {sidebarOpen && (
              <span className="text-sm font-medium truncate">{item.label}</span>
            )}

            {/* Collapsed tooltip */}
            {!sidebarOpen && (
              <span className="
                pointer-events-none absolute left-full ml-3 z-[100]
                px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
                bg-slate-900 text-white shadow-lg
                opacity-0 group-hover:opacity-100 transition-opacity duration-150
              ">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div className={`border-t border-slate-100 flex-shrink-0 ${sidebarOpen ? 'p-4' : 'py-4 px-2'}`}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={user.name} size="sm" />
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 font-medium transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center justify-center w-full p-2 rounded-xl text-red-400 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function Layout({ navItems, children }: LayoutProps) {
  const { user, logout }                     = useAuth();
  const { workSeconds, idleSeconds, status } = useTimeTracking();
  const navigate                             = useNavigate();
  const [currentTime, setCurrentTime]        = useState(new Date());
  const [sidebarOpen, setSidebarOpen]        = useState(true);
  const [mobileOpen, setMobileOpen]          = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isTracked    = user?.role !== 'admin';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">

      {/* Desktop Sidebar */}
      <aside className={`
        hidden md:flex flex-col relative flex-shrink-0 overflow-visible
        h-screen bg-white border-r border-slate-100
        transition-[width] duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-[68px]'}
      `}>
        <Sidebar
          navItems={navItems}
          user={user}
          sidebarOpen={sidebarOpen}
          onLogout={handleLogout}
        />
        <button
          onClick={() => setSidebarOpen(p => !p)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:border-[#0B0E92] hover:text-[#0B0E92] z-20 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            <Sidebar
              navItems={navItems}
              user={user}
              sidebarOpen={true}
              onNavClick={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      {/* Right column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex-shrink-0 h-[60px] bg-white border-b border-slate-100 px-4 md:px-6 flex items-center justify-between gap-3">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} className="text-slate-600" />
          </button>

          <div className="flex-1 hidden md:block">
            <p className="text-sm text-slate-500 font-medium">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>

          {/* Time tracking */}
          {isTracked && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
                status === 'working'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'working' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider mr-0.5 opacity-60">Work</span>
                <span>{fmt(workSeconds)}</span>
              </div>
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

          {/* Bell + Avatar */}
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
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