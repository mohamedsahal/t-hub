import DashboardLayout from "@/components/layout/DashboardLayout";
import ProductsManagement from "@/components/dashboard/ProductsManagement";

export default function AdminProducts() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">SaaS Products Management</h1>
          <div className="text-sm text-muted-foreground">
            Manage all SaaS product offerings
          </div>
        </div>
        
        <ProductsManagement />
      </div>
    </DashboardLayout>
  );
}