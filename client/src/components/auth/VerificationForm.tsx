import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface VerificationFormProps {
  userId: number;
  email: string;
  onSuccess: () => void;
}

const VerificationForm = ({ userId, email, onSuccess }: VerificationFormProps) => {
  const [code, setCode] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [resending, setResending] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Format timer to MM:SS
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Set initial timer
  useEffect(() => {
    setTimer(30); // Start with 30-second delay before allowing resend
  }, []);
  
  // Timer functionality
  useEffect(() => {
    let interval: number | undefined;
    
    if (timer > 0) {
      interval = window.setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Auto-submit as each digit is entered
  useEffect(() => {
    // Only attempt verification once 6 digits are entered
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);
  
  // Handle verification code submission
  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await apiRequest('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (response.success) {
        toast({
          title: "Email verified successfully",
          description: "Your email has been verified. Proceeding to your account.",
          variant: "default"
        });
        onSuccess();
      } else {
        toast({
          title: "Verification failed",
          description: response.message || "Invalid verification code. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification error",
        description: "There was a problem verifying your email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Resend verification code
  const handleResend = async () => {
    if (timer > 0) return;
    
    setResending(true);
    
    try {
      const response = await apiRequest('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.success) {
        setTimer(30); // Reset timer to 30 seconds
        toast({
          title: "Code resent",
          description: "A new verification code has been sent to your email.",
          variant: "default"
        });
      } else if (response.cooldownRemaining) {
        // Handle rate limiting - set timer to the cooldown time
        setTimer(Math.ceil(response.cooldownRemaining / 1000));
        toast({
          title: "Please wait",
          description: response.message,
          variant: "default"
        });
      } else {
        toast({
          title: "Resend failed",
          description: response.message || "Failed to resend verification code. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast({
        title: "Resend error",
        description: "There was a problem sending the verification code. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setResending(false);
    }
  };
  
  // Handle input change - only allow numbers and limit to 6 digits
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (/^\d*$/.test(value) && value.length <= 6) {
      setCode(value);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Email Verification</CardTitle>
        <CardDescription className="text-center">
          We've sent a verification code to<br/>
          <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            Enter the 6-digit code below
          </div>
          <Input
            className="text-center text-lg tracking-widest"
            placeholder="000000"
            value={code}
            onChange={handleInputChange}
            maxLength={6}
            autoFocus
            disabled={submitting}
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        <div className="text-xs text-muted-foreground text-center pb-2">
          Didn't receive a code?
        </div>
        <Button
          variant="outline"
          disabled={timer > 0 || resending}
          onClick={handleResend}
          className="w-full"
        >
          {timer > 0 ? `Resend code (${formatTimer(timer)})` : 'Resend code'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VerificationForm;