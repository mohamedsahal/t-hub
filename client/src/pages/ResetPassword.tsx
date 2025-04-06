import { Helmet } from 'react-helmet';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Card } from '@/components/ui/card';

export default function ResetPassword() {
  return (
    <div className="container flex items-center justify-center min-h-screen px-4 py-12">
      <Helmet>
        <title>Reset Password | THUB Learning Platform</title>
      </Helmet>
      
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
          <p className="mt-2 text-muted-foreground">
            Create a new password for your account
          </p>
        </div>
        
        <ResetPasswordForm />
      </div>
    </div>
  );
}