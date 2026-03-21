// src/pages/hr/HRLayout.tsx  — UPDATED
// Only change: picks HR_NAV_CONSULTANCY when user.department === 'consultancy'.

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { HR_NAV, HR_NAV_CONSULTANCY } from '../../constants';
import { useIsConsultancy } from "../..//hooks/Useconsultancynav";

export default function HRLayout() {
  const isConsultancy = useIsConsultancy();
  const nav = isConsultancy ? HR_NAV_CONSULTANCY : HR_NAV;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar nav={nav as any} role="hr" />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}