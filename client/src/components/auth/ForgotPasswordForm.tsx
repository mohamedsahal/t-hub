import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// Define form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await axios.post('/api/forgot-password', values);
      setEmailSent(true);
      form.reset();
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("An error occurred. Please try again later.");
      }
      
      toast({
        title: "Error",
        description: "Failed to send password reset email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setEmailSent(false)}
            >
              Send Again
            </Button>
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
                    Sending...
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