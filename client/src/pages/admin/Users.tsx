import React from 'react';
import { Helmet } from 'react-helmet';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UsersManagement from '@/components/admin/UsersManagement';

export default function Users() {
  return (
    <DashboardLayout>
      <Helmet>
        <title>User Management - T-Hub Admin</title>
      </Helmet>
      <UsersManagement />
    </DashboardLayout>
  );
}