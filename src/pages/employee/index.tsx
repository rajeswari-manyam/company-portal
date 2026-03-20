import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EmployeeLayout from './EmployeeLayout';
import EmployeeDashboard from './EmployeeDashboard';
import MyAttendance from './MyAttendance';
import MyLeaves from './MyLeaves';
import MyPayslips from './MyPayslips';
import MyAnnouncements from './MyAnnouncements';
import MyHolidays from './MyHolidays';
import MyDocuments from './MyDocuments';
import MyProfile from './MyProfile';
// import MyPerformance from './MyPerformance';

export default function EmployeeRouter() {
  return (
    <Routes>
      <Route element={<EmployeeLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="leaves" element={<MyLeaves />} />
        <Route path="payslips" element={<MyPayslips />} />
        {/* <Route path="performance" element={<MyPerformance />} /> */}
        <Route path="documents" element={<MyDocuments />} />
        <Route path="announcements" element={<MyAnnouncements />} />
        <Route path="holidays" element={<MyHolidays />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
