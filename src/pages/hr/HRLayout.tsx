import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '../../components/common';
import { HR_NAV } from '../../constants';

export default function HRLayout() {
  return (
    <Layout navItems={[...HR_NAV]}>
      <Outlet />
    </Layout>
  );
}
