import DashboardLayout from "@/components/layout/DashboardLayout";
import EnrollmentsManagement from "@/components/dashboard/EnrollmentsManagement";

export default function EnrollmentsAdminPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Enrollments Management</h1>
          <div className="text-sm text-muted-foreground">
            Manage student enrollment in courses and programs
          </div>
        </div>
        
        <EnrollmentsManagement />
      </div>
    </DashboardLayout>
  );
}