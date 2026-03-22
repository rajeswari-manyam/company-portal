// src/pages/employee/EmployeeLayout.tsx

import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { EMPLOYEE_NAV, EMPLOYEE_NAV_CONSULTANCY } from '../../constants';
import { useIsConsultancy } from '../../hooks/useIsConsultancy';

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