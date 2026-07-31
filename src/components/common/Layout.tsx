import React, { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import {
  LogOut, Bell, Menu, ChevronLeft, ChevronRight,
  LayoutDashboard, Users, Building2, CalendarCheck, CalendarOff,
  Wallet, Megaphone, Gift, FileText, UserCircle, FolderKanban,
  CheckSquare, BarChart2,
} from 'lucide-react';
import type { NavItem } from '../../types';
import Avatar from '../ui/Avatar';

// ── Route → Lucide icon map ───────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  '/hr/dashboard': <LayoutDashboard size={17} />,
  '/hr/employees': <Users size={17} />,
  '/hr/departments': <Building2 size={17} />,
  '/hr/attendance': <CalendarCheck size={17} />,
  '/hr/leaves': <CalendarOff size={17} />,
  '/hr/payroll': <Wallet size={17} />,
  '/hr/announcements': <Megaphone size={17} />,
  '/hr/holidays': <Gift size={17} />,
  '/hr/documents': <FileText size={17} />,
  '/hr/profile': <UserCircle size={17} />,
  '/hr/projects': <FolderKanban size={17} />,
  '/hr/reports': <BarChart2 size={17} />,
  '/admin/dashboard': <LayoutDashboard size={17} />,
  '/admin/employees': <Users size={17} />,
  '/admin/departments': <Building2 size={17} />,
  '/admin/attendance': <CalendarCheck size={17} />,
  '/admin/leaves': <CalendarOff size={17} />,
  '/admin/payslips': <Wallet size={17} />,
  '/admin/announcements': <Megaphone size={17} />,
  '/admin/holidays': <Gift size={17} />,
  '/admin/documents': <FileText size={17} />,
  '/admin/projects': <FolderKanban size={17} />,
  '/admin/reports': <BarChart2 size={17} />,
  '/employee/dashboard': <LayoutDashboard size={17} />,
  '/employee/attendance': <CalendarCheck size={17} />,
  '/employee/leaves': <CalendarOff size={17} />,
  '/employee/payslips': <Wallet size={17} />,
  '/employee/documents': <FileText size={17} />,
  '/employee/announcements': <Megaphone size={17} />,
  '/employee/holidays': <Gift size={17} />,
  '/employee/projects': <FolderKanban size={17} />,
  '/employee/tasks': <CheckSquare size={17} />,
  '/employee/profile': <UserCircle size={17} />,
 
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

interface LayoutProps { navItems: NavItem[]; children: ReactNode }
interface SidebarProps {
  navItems: NavItem[];
  user: { name: string; role: string } | null;
  sidebarOpen: boolean;
  onNavClick?: () => void;
  onLogout: () => void;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ navItems, user, sidebarOpen, onNavClick, onLogout }: SidebarProps) {

  // Split profile to bottom, rest in main nav
  const mainNav = navItems.filter(i => !i.to.endsWith('/profile'));
  const bottomNav = navItems.filter(i => i.to.endsWith('/profile'));

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'group relative flex items-center rounded-xl transition-all duration-200 select-none',
      sidebarOpen
        ? 'gap-3.5 px-4 py-2.5 mx-3'
        : 'justify-center w-11 h-11 mx-auto',
      isActive
        ? 'bg-gradient-to-r from-[#0B0E92] to-[#4F7FE8] text-white shadow-lg shadow-blue-900/25'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
    ].join(' ');

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Logo ── */}
      <div className={`flex items-center border-b border-slate-100 flex-shrink-0 min-h-[72px]
        ${sidebarOpen ? 'gap-3 px-5 py-5' : 'justify-center px-3 py-5'}`}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
          style={{ background: 'linear-gradient(135deg,#0B0E92,#4F7FE8)' }}>
          <span className="text-white font-black text-sm leading-none">W</span>
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="font-extrabold text-slate-900 text-[15px] leading-none tracking-tight">WorkForce</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wide uppercase">HR Portal</p>
          </div>
        )}
      </div>

   

      {/* ── Section label ── */}
      {sidebarOpen && (
        <p className="px-6 pt-4 pb-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Menu
        </p>
      )}

      {/* ── Main Nav ── */}
      <nav className="flex-1 overflow-y-auto py-1 space-y-0.5">
        {mainNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.endsWith('dashboard')}
            className={navLinkClass}
            onClick={onNavClick}
            title={!sidebarOpen ? item.label : undefined}
          >
            {/* Icon */}
            <span className="shrink-0 leading-none flex items-center justify-center w-[18px]">
              {ICON_MAP[item.to] ?? <LayoutDashboard size={17} />}
            </span>

            {/* Label */}
            {sidebarOpen && (
              <span className="text-[13.5px] font-medium truncate">{item.label}</span>
            )}

            {/* Collapsed tooltip */}
            {!sidebarOpen && (
              <span className="pointer-events-none absolute left-full ml-3 z-[100]
                px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
                bg-slate-900 text-white shadow-lg
                opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom: Profile + Logout ── */}
      <div className={`border-t border-slate-100 flex-shrink-0 py-3 space-y-0.5`}>
        {sidebarOpen && (
          <p className="px-6 pb-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Account
          </p>
        )}

        {/* Profile link */}
        {bottomNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={navLinkClass}
            onClick={onNavClick}
            title={!sidebarOpen ? item.label : undefined}
          >
            <span className="shrink-0 leading-none flex items-center justify-center w-[18px]">
              {ICON_MAP[item.to] ?? <UserCircle size={17} />}
            </span>
            {sidebarOpen && (
              <span className="text-[13.5px] font-medium truncate">{item.label}</span>
            )}
            {!sidebarOpen && (
              <span className="pointer-events-none absolute left-full ml-3 z-[100]
                px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
                bg-slate-900 text-white shadow-lg
                opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}

        {/* Logout */}
        <button
          onClick={onLogout}
          title={!sidebarOpen ? 'Log Out' : undefined}
          className={[
            'group relative w-full flex items-center rounded-xl transition-all duration-200',
            'text-red-400 hover:bg-red-50 hover:text-red-600',
            sidebarOpen
              ? 'gap-3.5 px-4 py-2.5 mx-3 w-[calc(100%-24px)]'
              : 'justify-center w-11 h-11 mx-auto',
          ].join(' ')}
        >
          <span className="shrink-0 flex items-center justify-center w-[18px]">
            <LogOut size={17} />
          </span>
          {sidebarOpen && <span className="text-[13.5px] font-medium">Log Out</span>}
          {!sidebarOpen && (
            <span className="pointer-events-none absolute left-full ml-3 z-[100]
              px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
              bg-slate-900 text-white shadow-lg
              opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Log Out
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
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
  const isTracked = user?.role !== 'admin';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">

      {/* ── Desktop Sidebar ── */}
      {/* Width: 272px open (was 256px) → gives labels more breathing room */}
      <aside className={`
        hidden md:flex flex-col relative flex-shrink-0 overflow-visible
        h-screen bg-white border-r border-slate-100 shadow-sm
        transition-[width] duration-300 ease-in-out
        ${sidebarOpen ? 'w-[272px]' : 'w-[72px]'}
      `}>
        <Sidebar
          navItems={navItems}
          user={user}
          sidebarOpen={sidebarOpen}
          onLogout={handleLogout}
        />

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(p => !p)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white border border-slate-200
            flex items-center justify-center shadow-sm z-20
            hover:border-[#0B0E92] hover:text-[#0B0E92] transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[272px] bg-white flex flex-col shadow-2xl">
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

      {/* ── Right column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Topbar ── */}
        <header className="flex-shrink-0 h-[60px] bg-white border-b border-slate-100
          px-4 md:px-6 flex items-center justify-between gap-3 shadow-sm">

          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0B0E92] to-[#4F7FE8] flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-xs">W</span>
              </div>
              <span className="font-extrabold text-slate-800 text-sm tracking-tight">WorkForce</span>
            </div>
          </div>

          {/* Date — desktop only */}
          <div className="flex-1 hidden md:block">
            <p className="text-sm text-slate-500 font-medium">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>

          {/* Time tracking chips */}
          {isTracked && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
                status === 'working'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'working' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider mr-0.5 opacity-60">Work</span>
                <span>{fmt(workSeconds)}</span>
              </div>
              <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
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

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}