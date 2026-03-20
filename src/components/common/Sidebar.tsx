import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Building2, CalendarCheck, CalendarOff,
  Wallet, Megaphone, Gift, FileText, UserCircle, FolderKanban,
  CheckSquare, LogOut, ChevronLeft, ChevronRight, Settings,
} from 'lucide-react';

// ── Icon map — all nav paths mapped to lucide icons ───────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  // HR / Admin
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

  // Admin
  '/admin/dashboard':      <LayoutDashboard size={17} />,
  '/admin/employees':      <Users size={17} />,
  '/admin/departments':    <Building2 size={17} />,
  '/admin/attendance':     <CalendarCheck size={17} />,
  '/admin/leaves':         <CalendarOff size={17} />,
  '/admin/payslips':       <Wallet size={17} />,
  '/admin/announcements':  <Megaphone size={17} />,
  '/admin/holidays':       <Gift size={17} />,
  '/admin/documents':      <FileText size={17} />,

  // Employee
  '/employee/dashboard':      <LayoutDashboard size={17} />,
  '/employee/attendance':     <CalendarCheck size={17} />,
  '/employee/leaves':         <CalendarOff size={17} />,
  '/employee/payslips':       <Wallet size={17} />,
  '/employee/documents':      <FileText size={17} />,
  '/employee/announcements':  <Megaphone size={17} />,
  '/employee/holidays':       <Gift size={17} />,
  '/employee/projects':       <FolderKanban size={17} />,
  '/employee/tasks':          <CheckSquare size={17} />,
  '/employee/profile':        <UserCircle size={17} />,
};

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({
  to, label, collapsed,
}: { to: string; label: string; collapsed: boolean }) {
  const icon = ICON_MAP[to] ?? <LayoutDashboard size={17} />;

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          'group relative flex items-center gap-3 rounded-xl transition-all duration-150 select-none',
          collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-3 py-2.5 mx-2',
          isActive
            ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white shadow-md shadow-blue-900/20'
            : 'text-slate-500 hover:bg-gradient-to-r hover:from-[#0B0E92] hover:to-[#69A6F0] hover:text-white',
        ].join(' ')
      }
    >
      {/* Icon — always visible */}
      <span className="shrink-0 flex items-center justify-center w-5">{icon}</span>

      {/* Label — hidden when collapsed */}
      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {label}
        </span>
      )}

      {/* Tooltip when collapsed */}
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

// ── Section divider ───────────────────────────────────────────────────────────
function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 border-t border-slate-100" />;
  return (
    <p className="px-5 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      {label}
    </p>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface NavEntry { to: string; label: string; icon?: string }

interface SidebarProps {
  nav: NavEntry[];
  role?: string;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ nav, role }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const initials = (user?.name ?? 'U')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  // Split nav into "main" and "other" sections (last 2 items = profile/settings go to bottom)
  const mainNav  = nav.slice(0, -1);
  const bottomNav = nav.slice(-1);

  return (
    <aside
      style={{ width: collapsed ? 68 : 240, transition: 'width 0.22s ease' }}
      className="relative flex flex-col h-screen bg-white border-r border-slate-100 shadow-sm shrink-0 overflow-hidden z-40"
    >

      {/* ── Logo ── */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white font-black text-sm">W</span>
        </div>
        {!collapsed && (
          <div>
            <p className="font-black text-slate-900 text-sm leading-none">WorkForce</p>
            <p className="text-[10px] text-slate-400 mt-0.5">HR Portal</p>
          </div>
        )}
      </div>

      {/* ── User card ── */}
      <div className={`flex items-center gap-3 mx-3 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B0E92] to-[#69A6F0] flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name ?? 'User'}</p>
            <p className="text-[10px] text-slate-400 capitalize truncate">{role ?? user?.role ?? 'employee'}</p>
          </div>
        )}
      </div>

      {/* ── Main nav ── */}
      {!collapsed && <SectionLabel label="Main Menu" collapsed={collapsed} />}
      <nav className="flex-1 overflow-y-auto py-1 space-y-0.5">
        {mainNav.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} collapsed={collapsed} />
        ))}
      </nav>

      {/* ── Bottom nav (profile etc.) ── */}
      <div className="py-2 border-t border-slate-100 space-y-0.5">
        {bottomNav.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} collapsed={collapsed} />
        ))}

        {/* Settings */}
        <NavLink
          to={`/${(role ?? 'hr')}/settings`}
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            [
              'group relative flex items-center gap-3 rounded-xl mx-2 px-3 py-2.5 transition-all duration-150',
              isActive
                ? 'bg-gradient-to-r from-[#0B0E92] to-[#69A6F0] text-white'
                : 'text-slate-400 hover:bg-gradient-to-r hover:from-[#0B0E92] hover:to-[#69A6F0] hover:text-white',
              collapsed ? 'justify-center px-0 mx-1' : '',
            ].join(' ')
          }
        >
          <span className="shrink-0 flex items-center justify-center w-5">
            <Settings size={17} />
          </span>
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 z-50 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
              Settings
            </span>
          )}
        </NavLink>

        {/* Log Out */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          title={collapsed ? 'Log Out' : undefined}
          className={[
            'group relative w-full flex items-center gap-3 rounded-xl mx-2 px-3 py-2.5 transition-all duration-150',
            'text-red-400 hover:bg-red-50 hover:text-red-600',
            collapsed ? 'justify-center px-0 mx-1' : '',
          ].join(' ')}
        >
          <span className="shrink-0 flex items-center justify-center w-5">
            <LogOut size={17} />
          </span>
          {!collapsed && <span className="text-sm font-medium">Log Out</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 z-50 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
              Log Out
            </span>
          )}
        </button>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-[#0B0E92] hover:border-[#0B0E92] transition-colors z-50"
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

    </aside>
  );
}