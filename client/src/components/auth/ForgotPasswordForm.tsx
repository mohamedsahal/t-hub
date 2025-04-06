import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Clock, Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// Define form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

// Rate limit response interface
interface RateLimitResponse {
  message: string;
  cooldownRemaining?: number;
  msBeforeNext?: number;
}

export default function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  // Handle countdown timer for rate limiting
  useEffect(() => {
    if (countdown <= 0) {
      if (cooldownActive) {
        setCooldownActive(false);
        setButtonDisabled(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, cooldownActive]);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Format milliseconds to a readable time string
  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return '0 seconds';
    
    const seconds = Math.ceil(ms / 1000);
    
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  async function onSubmit(values: ForgotPasswordValues) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await axios.post('/api/forgot-password', values);
      setEmailSent(true);
      form.reset();
      
      // Set a minimum cooldown even on success (1 minute)
      const cooldownTime = 60 * 1000; // 1 minute
      setCountdown(cooldownTime);
      setCooldownActive(true);
      setButtonDisabled(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      // Handle rate limiting errors (429 status)
      if (error.response?.status === 429) {
        const data = error.response.data as RateLimitResponse;
        setError(data.message);
        
        // Set cooldown timer if provided
        if (data.cooldownRemaining && data.cooldownRemaining > 0) {
          setCountdown(data.cooldownRemaining);
          setCooldownActive(true);
          setButtonDisabled(true);
        } else if (data.msBeforeNext && data.msBeforeNext > 0) {
          setCountdown(data.msBeforeNext);
          setCooldownActive(true);
          setButtonDisabled(true);
        }
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("An error occurred. Please try again later.");
        
        toast({
          title: "Error",
          description: "Failed to send password reset email. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const remainingPercentage = countdown > 0 ? (countdown / (60 * 1000)) * 100 : 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {cooldownActive && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-amber-600">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Cooldown active</span>
              </div>
              <span className="text-sm">{formatTimeRemaining(countdown)}</span>
            </div>
            <Progress value={remainingPercentage} className="h-2 bg-gray-100" />
          </div>
        )}
        
        {emailSent ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Email Sent</AlertTitle>
              <AlertDescription className="text-green-700">
                If an account exists with that email, we've sent instructions to reset your password.
                Please check your email inbox (and spam folder).
              </AlertDescription>
            </Alert>
            
            {cooldownActive ? (
              <div className="text-sm text-gray-500 text-center">
                You can send another reset link in {formatTimeRemaining(countdown)}
              </div>
            ) : (
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setEmailSent(false)}
                disabled={buttonDisabled}
              >
                Send Again
              </Button>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your.email@example.com" 
                        type="email" 
                        autoComplete="email"
                        disabled={isSubmitting || buttonDisabled}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || buttonDisabled}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : cooldownActive ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Wait {formatTimeRemaining(countdown)}
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4">
        <div className="text-sm text-center">
          <Link href="/login" className="flex items-center justify-center text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}