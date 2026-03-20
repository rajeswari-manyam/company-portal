import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HRLayout from './HRLayout';
import HRDashboard from './HRDashboard';
import HREmployees from './HREmployees';
import HRDepartments from './HRDepartments';
import HRAttendance from './HRAttendance';
import HRLeaves from './HRLeaves';
import HRPayroll from './HRPayroll';
import HRAnnouncements from './HRAnnouncements';
import HRHolidays from './HRHolidays';
import HRDocuments from './HRDocuments';
import HRProfile from './HRProfile';
import HRProjects from "./HRProject";

export default function HRRouter() {
  return (
    <Routes>
      <Route element={<HRLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"          element={<HRDashboard />} />
        <Route path="employees"          element={<HREmployees />} />
        <Route path="departments"        element={<HRDepartments />} />
        <Route path="attendance"         element={<HRAttendance />} />
        <Route path="leaves"             element={<HRLeaves />} />
        <Route path="payroll"            element={<HRPayroll />} />
        <Route path="projects"           element={<HRProjects role="hr" />} />   {/* ← new */}
        <Route path="announcements"      element={<HRAnnouncements />} />
        <Route path="holidays"           element={<HRHolidays />} />
        <Route path="documents"          element={<HRDocuments />} />
        <Route path="profile"            element={<HRProfile />} />
        <Route path="*"                  element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}