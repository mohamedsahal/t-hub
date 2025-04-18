import DashboardLayout from "@/components/layout/DashboardLayout";
import CoursesManagement from "@/components/dashboard/CoursesManagement";

export default function CoursesAdminPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Courses Management</h1>
          <div className="text-sm text-muted-foreground">
            Manage all educational courses and programs
          </div>
        </div>
        
        <CoursesManagement />
      </div>
    </DashboardLayout>
  );
}