import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Check, Loader2, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';

// Define form validation schema with password requirements
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  // Extract token from URL
  const token = location.split('/').pop() || '';

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setIsVerifying(true);
        const response = await axios.get(`/api/verify-reset-token/${token}`);
        
        if (response.data.valid) {
          setIsValidToken(true);
        } else {
          setError("Invalid or expired reset token. Please request a new password reset link.");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        setError("This password reset link is invalid or has expired. Please request a new one.");
      } finally {
        setIsVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setIsVerifying(false);
      setError("Invalid reset link. No token provided.");
    }
  }, [token]);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await axios.post(`/api/reset-password/${token}`, {
        password: values.password
      });
      
      setIsSuccess(true);
      form.reset();
      
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
        variant: "default",
      });
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("An error occurred. Please try again later.");
      }
      
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isVerifying) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Verifying your reset link...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!isValidToken && error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Invalid Link</CardTitle>
          <CardDescription>
            There was a problem with your password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <X className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Link href="/forgot-password">
              <Button>Request New Reset Link</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Create a new password for your account
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
        
        {isSuccess ? (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              Your password has been reset successfully.
              Redirecting to login page...
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your new password" 
                        type="password" 
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-xs text-muted-foreground mt-1">
                      Password must be at least 8 characters and include uppercase, lowercase, and numbers.
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Confirm your new password" 
                        type="password" 
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
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