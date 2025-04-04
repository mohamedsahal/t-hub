import { useLocation, useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PaymentStatus = "completed" | "pending" | "failed";

interface PaymentResultProps {
  referenceId?: string;
}

const PaymentResult = ({ referenceId: propReferenceId }: PaymentResultProps) => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ referenceId: string }>();
  const referenceId = propReferenceId || params.referenceId;
  const [polling, setPolling] = useState<boolean>(true);
  const [pollCount, setPollCount] = useState<number>(0);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["payment", referenceId],
    queryFn: async () => {
      if (!referenceId) return null;
      const response = await fetch(`/api/payment/verify/${referenceId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to verify payment");
      }
      return response.json();
    },
    enabled: !!referenceId,
    refetchInterval: polling ? 5000 : false, // Poll every 5 seconds if payment is pending
  });

  // Handle polling logic
  useEffect(() => {
    if (data?.payment?.status === "completed" || data?.payment?.status === "failed") {
      setPolling(false);
    } else if (pollCount >= 12) { // Poll for max 1 minute (12 * 5s)
      setPolling(false);
      toast({
        title: "Payment Verification Timeout",
        description: "We couldn't verify your payment status. Please check your dashboard for updates.",
        variant: "destructive",
      });
    } else if (data?.payment?.status === "pending") {
      setPollCount(prev => prev + 1);
    }
  }, [data, pollCount, toast]);

  const getStatusIcon = (status?: PaymentStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "failed":
        return <XCircle className="h-12 w-12 text-red-500" />;
      case "pending":
        return <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-amber-500" />;
    }
  };

  const getStatusMessage = (status?: PaymentStatus) => {
    switch (status) {
      case "completed":
        return "Your payment was successful! You are now enrolled in the course.";
      case "failed":
        return "Your payment could not be processed. Please try again or contact support.";
      case "pending":
        return "Your payment is being processed. This page will update automatically.";
      default:
        return "We couldn't verify your payment status. Please check your dashboard for updates.";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Verifying Payment...</h2>
        <p className="text-muted-foreground">Please wait while we verify your payment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment Verification Failed</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "We couldn't verify your payment status. Please check your dashboard for updates."}
          </AlertDescription>
        </Alert>
        
        <div className="mt-6 flex justify-center">
          <Button onClick={() => setLocation("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const payment = data?.payment;
  const status = payment?.status;
  
  return (
    <div className="max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-2">
            {getStatusIcon(status)}
          </div>
          <CardTitle className="text-center">
            {status === "completed" ? "Payment Successful!" : 
             status === "failed" ? "Payment Failed" : 
             "Payment Processing"}
          </CardTitle>
          <CardDescription className="text-center">
            Reference ID: {referenceId}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center">{getStatusMessage(status)}</p>
          
          {payment && (
            <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium">{payment.courseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Date</span>
                <span className="font-medium">
                  {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">
                  {payment.paymentMethod === "mobile_wallet" ? 
                   `${payment.walletType || "Mobile Wallet"}` : 
                   "Credit/Debit Card"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Type</span>
                <span className="font-medium capitalize">
                  {payment.type === "installment" ? "Installment Plan" : "One-time Payment"}
                </span>
              </div>
              
              {payment.type === "installment" && payment.installments && payment.installments.length > 0 && (
                <div className="pt-2 mt-2 border-t">
                  <h4 className="font-semibold mb-2">Installment Plan</h4>
                  <div className="space-y-1">
                    {payment.installments.map((installment: any, index: number) => (
                      <div key={installment.id} className="flex justify-between text-sm">
                        <span>
                          Installment {index + 1}
                          {index === 0 && " (Initial Payment)"}:
                        </span>
                        <span className={`${installment.isPaid ? "text-green-600 font-medium" : ""}`}>
                          {formatCurrency(installment.amount)}
                          {installment.isPaid ? " (Paid)" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {status === "pending" && (
            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertDescription>
                Your payment is being processed. This may take a few moments.
                {pollCount > 0 && ` We've checked ${pollCount} time${pollCount !== 1 ? 's' : ''} so far.`}
              </AlertDescription>
            </Alert>
          )}
          
          {status === "failed" && (
            <Alert variant="destructive">
              <AlertDescription>
                If you've already been charged, please contact customer support for assistance.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4">
          {status === "completed" ? (
            <Button onClick={() => setLocation("/dashboard")}>
              Go to My Course <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : status === "failed" ? (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setLocation("/courses")}>
                Browse Courses
              </Button>
              <Button onClick={() => window.history.back()}>
                Try Again
              </Button>
            </div>
          ) : (
            <Button onClick={() => refetch()}>
              Check Status
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentResult;