// src/pages/employee/EmployeeLayout.tsx
// Mobile-first layout: sidebar on desktop, hamburger + overlay on mobile

import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { EMPLOYEE_NAV, EMPLOYEE_NAV_CONSULTANCY } from '../../constants';
import { useIsConsultancy } from '../../hooks/useIsConsultancy';

export default function EmployeeLayout() {
  const isConsultancy = useIsConsultancy();
  const nav = isConsultancy ? EMPLOYEE_NAV_CONSULTANCY : EMPLOYEE_NAV;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar handles its own mobile hamburger + overlay */}
      <Sidebar nav={nav as any} role="employee" />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile top spacing so content clears the hamburger button */}
        <div className="pt-14 md:pt-0 px-4 py-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}