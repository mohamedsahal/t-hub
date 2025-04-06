import { Helmet } from 'react-helmet';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { Card } from '@/components/ui/card';

export default function ForgotPassword() {
  return (
    <div className="container flex items-center justify-center min-h-screen px-4 py-12">
      <Helmet>
        <title>Forgot Password | THUB Learning Platform</title>
      </Helmet>
      
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email to recover your account
          </p>
        </div>
        
        <ForgotPasswordForm />
      </div>
    </div>
  );
}