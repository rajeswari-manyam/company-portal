// src/pages/employee/EmployeeLayout.tsx  — UPDATED
// Only change: picks EMPLOYEE_NAV_CONSULTANCY when user.department === 'consultancy',
// otherwise uses the standard EMPLOYEE_NAV. Everything else is unchanged.

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { EMPLOYEE_NAV, EMPLOYEE_NAV_CONSULTANCY } from '../../constants';
import { useIsConsultancy } from "../..//hooks/Useconsultancynav";

export default function EmployeeLayout() {
  const isConsultancy = useIsConsultancy();
  const nav = isConsultancy ? EMPLOYEE_NAV_CONSULTANCY : EMPLOYEE_NAV;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar nav={nav as any} role="employee" />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}