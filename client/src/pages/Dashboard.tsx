import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

const Dashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {user?.role === "admin" && <AdminDashboard />}
      {user?.role === "teacher" && <TeacherDashboard />}
      {user?.role === "student" && <StudentDashboard />}
    </div>
  );
};

const DashboardSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-8 w-64 mb-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
};

export default Dashboard;
