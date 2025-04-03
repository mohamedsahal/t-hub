import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminProfile from "@/components/dashboard/AdminProfile";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        <AdminProfile />
      </div>
    </DashboardLayout>
  );
}