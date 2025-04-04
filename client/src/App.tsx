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
import ShortCoursesPage from "@/pages/admin/ShortCoursesPage";
import SpecialistProgramsPage from "@/pages/admin/SpecialistProgramsPage";
import BootcampsPage from "@/pages/admin/BootcampsPage";
import DiplomaPage from "@/pages/admin/DiplomaPage";
import CourseBuilderPage from "@/pages/admin/CourseBuilderPage";
import EnrollmentsAdminPage from "@/pages/admin/Enrollments";
import PaymentsAdminPage from "@/pages/admin/Payments";
import ProductsAdminPage from "@/pages/admin/Products";
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
      
      {/* Course Management Routes */}
      <AdminProtectedRoute path="/admin/courses" component={CoursesAdminPage} />
      <AdminProtectedRoute path="/admin/courses/short" component={ShortCoursesPage} />
      <AdminProtectedRoute path="/admin/courses/specialist" component={SpecialistProgramsPage} />
      <AdminProtectedRoute path="/admin/courses/bootcamp" component={BootcampsPage} />
      <AdminProtectedRoute path="/admin/courses/diploma" component={DiplomaPage} />
      <AdminProtectedRoute path="/admin/course-builder/:courseId" component={CourseBuilderPage} />
      
      {/* Other Admin Routes */}
      <AdminProtectedRoute path="/admin/payments" component={PaymentsAdminPage} />
      <AdminProtectedRoute path="/admin/enrollments" component={EnrollmentsAdminPage} />
      <AdminProtectedRoute path="/admin/certificates" component={() => <div>Certificates Admin Page</div>} />
      <AdminProtectedRoute path="/admin/testimonials" component={() => <div>Testimonials Admin Page</div>} />
      <AdminProtectedRoute path="/admin/products" component={ProductsAdminPage} />
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
