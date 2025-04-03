import DashboardLayout from "@/components/layout/DashboardLayout";
import PaymentsManagement from "@/components/dashboard/PaymentsManagement";

export default function PaymentsAdminPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Payments Management</h1>
          <div className="text-sm text-muted-foreground">
            Manage all payment transactions and installment plans
          </div>
        </div>
        
        <PaymentsManagement />
      </div>
    </DashboardLayout>
  );
}