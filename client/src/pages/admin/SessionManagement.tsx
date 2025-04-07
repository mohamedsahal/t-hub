import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SessionManagement from '@/components/admin/SessionManagement';
import { Helmet } from 'react-helmet';

export default function SessionManagementPage() {
  return (
    <DashboardLayout>
      <Helmet>
        <title>Session Management | Thub Innovation Admin</title>
        <meta name="description" content="Monitor and manage user sessions" />
      </Helmet>
      <SessionManagement />
    </DashboardLayout>
  );
}