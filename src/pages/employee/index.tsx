// ══════════════════════════════════════════════════════════════════════════════
// src/pages/employee/EmployeeRouter.tsx  (UPDATED)
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EmployeeLayout    from './EmployeeLayout';
import EmployeeDashboard from './EmployeeDashboard';
import MyAttendance      from './MyAttendance';
import MyLeaves          from './MyLeaves';
import MyPayslips        from './MyPayslips';
import MyAnnouncements   from './MyAnnouncements';
import MyHolidays        from './MyHolidays';
import MyDocuments       from './MyDocuments';
import MyProfile         from './MyProfile';
import MyProjects        from './MyProjects';
import MyTasks           from './MyTasks';
import MyExcelSheets     from "./MyExcelSheet" ;  // ← NEW (Consultancy only)
import MyReports         from "./MyReports";  // ← NEW (Consultancy only)
 
export default function EmployeeRouter() {
  return (
    <Routes>
      <Route element={<EmployeeLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"     element={<EmployeeDashboard />} />
        <Route path="attendance"    element={<MyAttendance />} />
        <Route path="leaves"        element={<MyLeaves />} />
        <Route path="payslips"      element={<MyPayslips />} />
        <Route path="documents"     element={<MyDocuments />} />
        <Route path="announcements" element={<MyAnnouncements />} />
        <Route path="holidays"      element={<MyHolidays />} />
        <Route path="profile"       element={<MyProfile />} />
        {/* Standard routes (hidden for Consultancy via sidebar) */}
        <Route path="projects"      element={<MyProjects />} />
        <Route path="tasks"         element={<MyTasks />} />
        {/* Consultancy-only routes (sidebar shows these instead) */}
        <Route path="excelSheets"   element={<MyExcelSheets />} />
        <Route path="reports"       element={<MyReports />} />
        <Route path="*"             element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}