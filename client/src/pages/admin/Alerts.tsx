import { useState } from 'react';
import { Helmet } from 'react-helmet';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AlertManagement from '@/components/admin/AlertManagement';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

const AlertsAdminPage = () => {
  return (
    <>
      <Helmet>
        <title>Alert Management | Admin Dashboard</title>
      </Helmet>
      
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Alert Management</h1>
          </div>
          
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Manage Alerts</CardTitle>
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
        </div>
      </DashboardLayout>
    </>
  );
};

export default AlertsAdminPage;