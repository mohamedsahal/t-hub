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
import PaymentResult from "@/pages/PaymentResult";
import VerifyCertificate from "@/pages/VerifyCertificate";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

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
import CertificatesManagement from "@/pages/admin/Certificates";
import ExamManagement from "./pages/admin/ExamManagement";
import ExamTypes from "./pages/admin/ExamTypes";
import ExamCreate from "./pages/admin/ExamCreate";
import ExamRules from "./pages/admin/ExamRules";
import ExamMarks from "./pages/admin/ExamMarks";
import ExamResults from "./pages/admin/ExamResults";
import AlertsAdminPage from "@/pages/admin/Alerts";

import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import AuthVerificationWrapper from "@/lib/auth-verification-wrapper";
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
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      
      {/* Protected User Routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/payment/:courseId" component={Payment} />
      <ProtectedRoute path="/payment-result/:referenceId" component={PaymentResult} />
      
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
      <AdminProtectedRoute path="/admin/certificates" component={() => <CertificatesManagement />} />
      <AdminProtectedRoute path="/admin/testimonials" component={() => <div>Testimonials Admin Page</div>} />
      
      {/* Exam Management Routes */}
      <AdminProtectedRoute path="/admin/exams" component={() => <ExamManagement />} />
      <AdminProtectedRoute path="/admin/exam-types" component={() => <ExamTypes />} />
      <AdminProtectedRoute path="/admin/exam-create" component={() => <ExamCreate />} />
      <AdminProtectedRoute path="/admin/exam-rules" component={() => <ExamRules />} />
      <AdminProtectedRoute path="/admin/exam-marks" component={() => <ExamMarks />} />
      <AdminProtectedRoute path="/admin/exam-results" component={() => <ExamResults />} />
      
      <AdminProtectedRoute path="/admin/products" component={() => <ProductsAdminPage />} />
      <AdminProtectedRoute path="/admin/partners" component={() => <div>Partners Admin Page</div>} />
      <AdminProtectedRoute path="/admin/content" component={() => <div>Content Admin Page</div>} />
      <AdminProtectedRoute path="/admin/events" component={() => <div>Events Admin Page</div>} />
      <AdminProtectedRoute path="/admin/alerts" component={() => <AlertsAdminPage />} />
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
            <AuthVerificationWrapper>
              <Router />
            </AuthVerificationWrapper>
          </main>
          {!isAdminPage && <Footer />}
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
