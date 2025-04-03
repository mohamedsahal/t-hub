import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

import HomePage from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import CourseDetail from "@/pages/CourseDetail";
import Courses from "@/pages/Courses";
import Payment from "@/pages/Payment";
import VerifyCertificate from "@/pages/VerifyCertificate";

// Admin Pages
import AdminPage from "@/pages/admin";
import UsersAdminPage from "@/pages/admin/Users";
import CoursesAdminPage from "@/pages/admin/Courses";
import ProfilePage from "@/pages/admin/Profile";

import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/verify-certificate" component={VerifyCertificate} />
      
      {/* Protected User Routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/payment/:courseId" component={Payment} />
      
      {/* Admin Routes */}
      <AdminProtectedRoute path="/admin" component={AdminPage} />
      <AdminProtectedRoute path="/admin/users" component={UsersAdminPage} />
      <AdminProtectedRoute path="/admin/courses" component={CoursesAdminPage} />
      <AdminProtectedRoute path="/admin/payments" component={() => <div>Payments Admin Page</div>} />
      <AdminProtectedRoute path="/admin/enrollments" component={() => <div>Enrollments Admin Page</div>} />
      <AdminProtectedRoute path="/admin/certificates" component={() => <div>Certificates Admin Page</div>} />
      <AdminProtectedRoute path="/admin/testimonials" component={() => <div>Testimonials Admin Page</div>} />
      <AdminProtectedRoute path="/admin/products" component={() => <div>Products Admin Page</div>} />
      <AdminProtectedRoute path="/admin/partners" component={() => <div>Partners Admin Page</div>} />
      <AdminProtectedRoute path="/admin/content" component={() => <div>Content Admin Page</div>} />
      <AdminProtectedRoute path="/admin/events" component={() => <div>Events Admin Page</div>} />
      <AdminProtectedRoute path="/admin/settings" component={() => <div>Settings Admin Page</div>} />
      <AdminProtectedRoute path="/admin/profile" component={ProfilePage} />

      {/* 404 Route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Get the current location to determine if we're on an admin page
  const [location] = useLocation();
  const isAdminPage = location.startsWith('/admin');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          {/* Render header and footer only for non-admin pages */}
          {!isAdminPage && <Header />}
          <main className={`flex-grow ${!isAdminPage ? "" : "h-screen"}`}>
            <Router />
          </main>
          {!isAdminPage && <Footer />}
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
