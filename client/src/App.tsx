import { useEffect } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { setupLazyLoading, prefetchResources } from '@/lib/performance';

// SEO Component
import SEO from "@/components/layout/SEO";

// Import page components
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
import ShortCourseBuilderPage from "@/pages/admin/ShortCourseBuilderPage";
import EnrollmentsAdminPage from "@/pages/admin/Enrollments";
import PaymentsAdminPage from "@/pages/admin/Payments";
import CohortPage from "@/pages/admin/Cohorts";
import ProductsAdminPage from "@/pages/admin/Products";
import ProfilePage from "@/pages/admin/Profile";
import QuizManagementPage from "@/pages/admin/QuizManagementPage";

import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Loading component for future use with code splitting
const LoadingFallback = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

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
      <AdminProtectedRoute path="/admin" component={() => <AdminPage />} />
      <AdminProtectedRoute path="/admin/users" component={() => <UsersAdminPage />} />
      
      {/* Course Management Routes */}
      <AdminProtectedRoute path="/admin/courses" component={() => <CoursesAdminPage />} />
      <AdminProtectedRoute path="/admin/courses/short" component={() => <ShortCoursesPage />} />
      <AdminProtectedRoute path="/admin/courses/specialist" component={() => <SpecialistProgramsPage />} />
      <AdminProtectedRoute path="/admin/courses/bootcamp" component={() => <BootcampsPage />} />
      <AdminProtectedRoute path="/admin/courses/diploma" component={() => <DiplomaPage />} />
      <AdminProtectedRoute path="/admin/course-builder/:courseId" component={() => <CourseBuilderPage />} />
      <AdminProtectedRoute path="/admin/courses/short/builder/:courseId" component={() => <ShortCourseBuilderPage />} />
      
      {/* Other Admin Routes */}
      <AdminProtectedRoute path="/admin/payments" component={() => <PaymentsAdminPage />} />
      <AdminProtectedRoute path="/admin/cohorts" component={() => <CohortPage />} />
      <AdminProtectedRoute path="/admin/enrollments" component={() => <EnrollmentsAdminPage />} />
      <AdminProtectedRoute path="/admin/certificates" component={() => <div>Certificates Admin Page</div>} />
      <AdminProtectedRoute path="/admin/testimonials" component={() => <div>Testimonials Admin Page</div>} />
      <AdminProtectedRoute path="/admin/quizzes" component={() => <QuizManagementPage />} />
      <AdminProtectedRoute path="/admin/products" component={() => <ProductsAdminPage />} />
      <AdminProtectedRoute path="/admin/partners" component={() => <div>Partners Admin Page</div>} />
      <AdminProtectedRoute path="/admin/content" component={() => <div>Content Admin Page</div>} />
      <AdminProtectedRoute path="/admin/events" component={() => <div>Events Admin Page</div>} />
      <AdminProtectedRoute path="/admin/settings" component={() => <div>Settings Admin Page</div>} />
      <AdminProtectedRoute path="/admin/profile" component={() => <ProfilePage />} />

      {/* 404 Route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Get the current location to determine if we're on an admin page
  const [location] = useLocation();
  const isAdminPage = location.startsWith('/admin');
  
  // Setup performance optimizations
  useEffect(() => {
    // Set up lazy loading for images
    setupLazyLoading();
    
    // Prefetch critical resources
    prefetchResources([
      '/api/user',
      '/api/courses',
    ]);
    
    // Add event listener for page visibility changes to optimize background tab behavior
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When page is not visible, we can reduce polling and updates
        queryClient.setDefaultOptions({
          queries: {
            refetchOnWindowFocus: false,
            refetchInterval: false,
          },
        });
      } else {
        // When page becomes visible again, restore normal behavior
        queryClient.setDefaultOptions({
          queries: {
            refetchOnWindowFocus: false,
            refetchInterval: false,
          },
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Default SEO settings that can be overridden by individual pages */}
        <SEO />
        
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
