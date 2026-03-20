import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '../../components/common';
import { ADMIN_NAV } from '../../constants';

export default function AdminLayout() {
  return (
    <Layout navItems={[...ADMIN_NAV]}>
      <Outlet />
    </Layout>
  );
}
