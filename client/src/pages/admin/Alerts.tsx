import { useState } from 'react';
import { Helmet } from 'react-helmet';
import AlertManagement from '@/components/admin/AlertManagement';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

const AlertsAdminPage = () => {
  return (
    <>
      <Helmet>
        <title>Alert Management | Admin Dashboard</title>
      </Helmet>
      
      <DashboardShell>
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Alert Management</CardTitle>
            <CardDescription>
              Create and manage site-wide alerts that will be displayed to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Tip</AlertTitle>
              <AlertDescription>
                Alerts will be displayed at the top of the home page. You can set start and end dates to schedule when alerts should appear automatically.
              </AlertDescription>
            </Alert>
            
            <AlertManagement />
          </CardContent>
        </Card>
      </DashboardShell>
    </>
  );
};

export default AlertsAdminPage;