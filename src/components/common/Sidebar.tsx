// src/components/common/Sidebar.tsx
// Mobile-first: hamburger + slide-in overlay on mobile, collapsible on desktop

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Building2, CalendarCheck, CalendarOff,
  Wallet, Megaphone, Gift, FileText, UserCircle, FolderKanban,
  LogOut, ChevronLeft, ChevronRight, Menu, X,
  BarChart2,
} from 'lucide-react';

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  '/hr/dashboard':         <LayoutDashboard size={17} />,
  '/hr/employees':         <Users size={17} />,
  '/hr/departments':       <Building2 size={17} />,
  '/hr/attendance':        <CalendarCheck size={17} />,
  '/hr/leaves':            <CalendarOff size={17} />,
  '/hr/payroll':           <Wallet size={17} />,
  '/hr/announcements':     <Megaphone size={17} />,
  '/hr/holidays':          <Gift size={17} />,
  '/hr/documents':         <FileText size={17} />,
  '/hr/profile':           <UserCircle size={17} />,
  '/hr/projects':          <FolderKanban size={17} />,
  '/hr/reports':           <BarChart2 size={17} />,

  '/admin/dashboard':      <LayoutDashboard size={17} />,
  '/admin/employees':      <Users size={17} />,
  '/admin/departments':    <Building2 size={17} />,
  '/admin/attendance':     <CalendarCheck size={17} />,
  '/admin/leaves':         <CalendarOff size={17} />,
  '/admin/payslips':       <Wallet size={17} />,
  '/admin/announcements':  <Megaphone size={17} />,
  '/admin/holidays':       <Gift size={17} />,
  '/admin/documents':      <FileText size={17} />,
  '/admin/projects':       <FolderKanban size={17} />,

  '/employee/dashboard':      <LayoutDashboard size={17} />,
  '/employee/attendance':     <CalendarCheck size={17} />,
  '/employee/leaves':         <CalendarOff size={17} />,
  '/employee/payslips':       <Wallet size={17} />,
  '/employee/documents':      <FileText size={17} />,
  '/employee/announcements':  <Megaphone size={17} />,
  '/employee/holidays':       <Gift size={17} />,
  '/employee/projects':       <FolderKanban size={17} />,
  '/employee/profile':        <UserCircle size={17} />,
};

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({
  to,
  label,
  collapsed,
  onNavClick,
}: {
  to: string;
  label: string;
  collapsed: boolean;
  onNavClick?: () => void;
}) {
  const icon = ICON_MAP[to] ?? <LayoutDashboard size={17} />;
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      onClick={onNavClick}
      className={({ isActive }) =>
        [
          'group relative flex items-center rounded-xl transition-all duration-150 select-none',
          collapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-3.5 px-4 py-2.5 mx-3',
          isActive
            ? 'bg-gradient-to-r from-[#0B0E92] to-[#4F7FE8] text-white shadow-lg shadow-blue-900/20'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
        ].join(' ')
      }
    >
      <span className="shrink-0 flex items-center justify-center w-[18px]">{icon}</span>
      {!collapsed && (
        <span className="text-[13.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {label}
        </span>
      )}
      {collapsed && (
        <span className="
          pointer-events-none absolute left-full ml-3 z-50
          px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium
          whitespace-nowrap opacity-0 group-hover:opacity-100
          transition-opacity duration-150 shadow-lg
        ">
          {label}
        </span>
      )}
    </NavLink>
  );
}

// ── Inner sidebar panel (shared between desktop + mobile overlay) ──────────────
function SidebarPanel({
  nav,
  collapsed,
  onNavClick,
}: {
  nav: { to: string; label: string }[];
  collapsed: boolean;
  onNavClick?: () => void;
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const filtered  = nav.filter(item => item.to !== '/employee/tasks');
  const mainNav   = filtered.filter(item => !item.to.endsWith('/profile'));
  const bottomNav = filtered.filter(item => item.to.endsWith('/profile'));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className={`flex items-center border-b border-slate-100 min-h-[64px] flex-shrink-0
        ${collapsed ? 'justify-center px-3 py-4' : 'gap-3 px-5 py-4'}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B0E92] to-[#4F7FE8] flex items-center justify-center shrink-0 shadow-md">
          <span className="text-white font-black text-sm">W</span>
        </div>
        {!collapsed && (
          <div>
            <p className="font-extrabold text-slate-900 text-[15px] leading-none tracking-tight">WorkForce</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wide uppercase">HR Portal</p>
          </div>
        )}
      </div>

      {/* Section label */}
      {!collapsed && (
        <p className="px-6 pt-4 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu</p>
      )}

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-1 space-y-0.5">
        {mainNav.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} collapsed={collapsed} onNavClick={onNavClick} />
        ))}
      </nav>

      {/* Bottom: Profile + Logout */}
      <div className="py-3 border-t border-slate-100 space-y-0.5 flex-shrink-0">
        {!collapsed && (
          <p className="px-6 pb-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Account</p>
        )}
        {bottomNav.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} collapsed={collapsed} onNavClick={onNavClick} />
        ))}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          title={collapsed ? 'Log Out' : undefined}
          className={[
            'group relative flex items-center rounded-xl transition-all duration-150',
            'text-red-400 hover:bg-red-50 hover:text-red-600',
            collapsed
              ? 'justify-center w-11 h-11 mx-auto'
              : 'gap-3.5 px-4 py-2.5 mx-3 w-[calc(100%-24px)]',
          ].join(' ')}
        >
          <span className="shrink-0 flex items-center justify-center w-[18px]"><LogOut size={17} /></span>
          {!collapsed && <span className="text-[13.5px] font-medium">Log Out</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 z-50 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
              Log Out
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

interface NavEntry { to: string; label: string; icon?: string }
interface SidebarProps { nav: NavEntry[]; role?: string }

export default function Sidebar({ nav, role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile hamburger button (shown in topbar area) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:text-[#0B0E92] hover:border-[#0B0E92] transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Slide-in panel */}
          <aside className="absolute left-0 top-0 bottom-0 w-[272px] bg-white shadow-2xl flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors z-10"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            <SidebarPanel
              nav={nav as { to: string; label: string }[]}
              collapsed={false}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside
        style={{ width: collapsed ? 72 : 272, transition: 'width 0.22s ease' }}
        className="hidden md:flex relative flex-col h-screen bg-white border-r border-slate-100 shadow-sm shrink-0 overflow-hidden z-40"
      >
        <SidebarPanel
          nav={nav as { to: string; label: string }[]}
          collapsed={collapsed}
        />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[64px] w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-[#0B0E92] hover:border-[#0B0E92] transition-colors z-50"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>
    </>
  );
}