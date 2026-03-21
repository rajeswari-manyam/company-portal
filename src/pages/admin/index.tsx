
// ══════════════════════════════════════════════════════════════════════════════
// src/pages/admin/AdminRouter.tsx  (UPDATED)
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout       from './AdminLayout';
import AdminDashboard    from './AdminDashboard';
import AdminEmployees    from './AdminEmployees';
import AdminDepartments  from './AdminDepartments';
import AdminAttendance   from './AdminAttendance';
import AdminLeaves       from './AdminLeaves';
import AdminPayroll      from './AdminPayroll';
import AdminAnnouncements from './AdminAnnouncements';
import AdminHolidays     from './AdminHolidays';
import AdminDocuments    from './AdminDocuments';
import HRProjects        from '../hr/HRProject';
import AdminExcelSheets  from  "../admin/AdminExcelSheet" ; // ← NEW
import AdminReports      from  "../admin/AdminReports" ;       // ← NEW
 
export default function AdminRouter() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"     element={<AdminDashboard />} />
        <Route path="employees"     element={<AdminEmployees />} />
        <Route path="departments"   element={<AdminDepartments />} />
        <Route path="attendance"    element={<AdminAttendance />} />
        <Route path="leaves"        element={<AdminLeaves />} />
        <Route path="payslips"      element={<AdminPayroll />} />
        <Route path="projects"      element={<HRProjects role="admin" />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="holidays"      element={<AdminHolidays />} />
        <Route path="documents"     element={<AdminDocuments />} />
        {/* Consultancy-only routes */}
        <Route path="excelSheets"   element={<AdminExcelSheets />} />
        <Route path="reports"       element={<AdminReports />} />
        <Route path="*"             element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
 