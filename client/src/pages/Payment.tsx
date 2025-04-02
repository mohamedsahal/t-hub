import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import PaymentForm from "@/components/payment/PaymentForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface PaymentProps {
  params: { courseId: string };
}

const Payment = ({ params }: PaymentProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const courseId = parseInt(params.courseId);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handlePaymentSuccess = () => {
    setPaymentComplete(true);
  };

  const handleViewCourse = () => {
    setLocation("/dashboard");
  };

  if (isLoading || courseLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Course not found or has been removed. Please try another course.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => setLocation("/courses")}>Browse Courses</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {paymentComplete ? "Payment Successful!" : "Complete Your Enrollment"}
        </h1>
        <p className="text-gray-600 mt-2">
          {paymentComplete
            ? "Thank you for enrolling in our course. You can now access your course materials."
            : "You're one step away from starting your learning journey."}
        </p>
      </div>

      {paymentComplete ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Enrollment Confirmed</h2>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                You have successfully enrolled in <span className="font-medium">{course.title}</span>. 
                You can now access the course in your dashboard.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 w-full max-w-md mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Course:</span>
                  <span className="font-medium">{course.title}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium">{formatCurrency(course.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Completed</span>
                </div>
              </div>
              <Button onClick={handleViewCourse}>View Course in Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <PaymentForm 
              courseId={course.id} 
              price={course.price} 
              title={course.title}
              onSuccess={handlePaymentSuccess}
            />
          </div>
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Course Summary</CardTitle>
                <CardDescription>You're enrolling in:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{course.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                  </div>
                  <div className="border-t border-b py-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">{formatCurrency(course.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span>{course.duration} weeks</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>By proceeding with the payment, you agree to our terms of service and refund policy.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
