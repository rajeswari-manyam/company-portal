import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '../../components/common';
import { EMPLOYEE_NAV } from '../../constants';

export default function EmployeeLayout() {
  return (
    <Layout navItems={[...EMPLOYEE_NAV]}>
      <Outlet />
    </Layout>
  );
}