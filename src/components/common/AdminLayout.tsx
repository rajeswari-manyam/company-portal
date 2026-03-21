// src/pages/admin/AdminLayout.tsx  — UPDATED
// Only change: picks ADMIN_NAV_CONSULTANCY when user.department === 'consultancy'.

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ADMIN_NAV, ADMIN_NAV_CONSULTANCY } from '../../constants';
import { useIsConsultancy } from "../..//hooks/Useconsultancynav";

export default function AdminLayout() {
  const isConsultancy = useIsConsultancy();
  const nav = isConsultancy ? ADMIN_NAV_CONSULTANCY : ADMIN_NAV;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar nav={nav as any} role="admin" />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}