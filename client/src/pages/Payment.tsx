import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation, useSearch } from "wouter";
import PaymentForm from "@/components/payment/PaymentForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface PaymentProps {
  params: { courseId: string };
}

const Payment = ({ params }: PaymentProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const paymentStatus = searchParams.get('status');
  const referenceId = searchParams.get('referenceId');
  
  const [paymentComplete, setPaymentComplete] = useState(paymentStatus === 'success');
  const [paymentPending, setPaymentPending] = useState(paymentStatus === 'pending');
  const [paymentFailed, setPaymentFailed] = useState(paymentStatus === 'failed');
  
  const courseId = parseInt(params.courseId);

  // Query to get course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  // Query to verify payment if returning from WaafiPay
  const { data: paymentData, isLoading: paymentVerifying } = useQuery({
    queryKey: ["payment", referenceId],
    queryFn: async () => {
      if (!referenceId) return null;
      try {
        const response = await fetch(`/api/payment/verify/${referenceId}`);
        if (!response.ok) throw new Error("Failed to verify payment");
        return response.json();
      } catch (error) {
        console.error("Payment verification failed:", error);
        return { success: false };
      }
    },
    enabled: !!referenceId,
    // Only run this once when the component mounts
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    // Check payment verification result
    if (paymentData && !paymentVerifying) {
      if (paymentData.success && paymentData.payment?.status === "completed") {
        setPaymentComplete(true);
        setPaymentPending(false);
        setPaymentFailed(false);
      } else if (paymentData.success && paymentData.payment?.status === "pending") {
        setPaymentComplete(false);
        setPaymentPending(true);
        setPaymentFailed(false);
        
        // Redirect to payment result page for real-time status updates
        if (referenceId) {
          setLocation(`/payment-result/${referenceId}`);
        }
      } else {
        setPaymentComplete(false);
        setPaymentPending(false);
        setPaymentFailed(true);
      }
    }
  }, [paymentData, paymentVerifying, referenceId, setLocation]);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth?redirect=" + encodeURIComponent(location));
    }
  }, [isAuthenticated, isLoading, setLocation, location]);

  const handlePaymentSuccess = (reference: string) => {
    // If using direct API integration, you might update state here
    // But for WaafiPay, we'll be redirected to their payment page, then back here with status
    
    // For immediate feedback, you could redirect to the payment result page
    if (reference) {
      setLocation(`/payment-result/${reference}`);
    }
  };

  const handleViewCourse = () => {
    setLocation("/dashboard");
  };

  const handleTryAgain = () => {
    // Clear status parameters and reload the page
    setLocation(`/payment/${courseId}`);
  };

  if (isLoading || courseLoading || (referenceId && paymentVerifying)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center">
          <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {referenceId ? "Verifying Payment..." : "Loading..."}
          </h2>
          <p className="text-muted-foreground text-center max-w-md">
            {referenceId 
              ? "Please wait while we verify your payment status." 
              : "Loading course information..."}
          </p>
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
          {paymentComplete ? "Payment Successful!" : 
           paymentPending ? "Payment Processing" :
           paymentFailed ? "Payment Failed" : 
           "Complete Your Enrollment"}
        </h1>
        <p className="text-gray-600 mt-2">
          {paymentComplete
            ? "Thank you for enrolling in our course. You can now access your course materials."
            : paymentPending
            ? "Your payment is being processed. We'll update you once it's complete."
            : paymentFailed
            ? "There was an issue with your payment. Please try again."
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
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Reference ID:</span>
                  <span className="font-medium">{referenceId || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Completed</span>
                </div>
              </div>
              <Button onClick={handleViewCourse}>
                View Course in Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : paymentFailed ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                There was an issue processing your payment for <span className="font-medium">{course.title}</span>. 
                This could be due to insufficient funds, connection issues, or other payment-related problems.
              </p>
              
              <Alert variant="destructive" className="mb-6 max-w-md">
                <AlertDescription>
                  {paymentData?.error || "Your payment could not be completed. Please try again or contact support."}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setLocation("/courses")}>
                  Browse Other Courses
                </Button>
                <Button onClick={handleTryAgain}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : paymentPending ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <RefreshCw className="h-8 w-8 text-amber-600 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Payment Processing</h2>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                Your payment for <span className="font-medium">{course.title}</span> is being processed. 
                This may take a few moments to complete. You'll be notified once the payment is confirmed.
              </p>
              
              <Alert className="mb-6 max-w-md bg-amber-50 text-amber-800">
                <AlertDescription>
                  Please do not close this window while your payment is being processed.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-4">
                <Button onClick={() => setLocation(`/payment-result/${referenceId}`)}>
                  Check Payment Status
                </Button>
              </div>
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
