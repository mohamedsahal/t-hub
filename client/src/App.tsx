import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import CourseDetail from "@/pages/CourseDetail";
import Courses from "@/pages/Courses";
import Dashboard from "@/pages/Dashboard";
import Payment from "@/pages/Payment";
import VerifyCertificate from "@/pages/VerifyCertificate";
import NotFound from "@/pages/not-found";

import { useAuth } from "./context/AuthContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Protected route component
const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component {...rest} />;
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/dashboard">
        {(params) => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/payment/:courseId">
        {(params) => <ProtectedRoute component={Payment} params={params} />}
      </Route>
      <Route path="/verify-certificate" component={VerifyCertificate} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Router />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}

export default App;
