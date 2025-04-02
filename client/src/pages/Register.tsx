import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";

const Register = () => {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Register to start learning with Thub Innovation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
