import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import VerificationForm from '@/components/auth/VerificationForm';

// Component that wraps authenticated pages to handle verification
const AuthVerificationWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, requiresVerification } = useAuth();
  const [showVerification, setShowVerification] = useState(false);
  
  // Check if user needs to verify their email
  useEffect(() => {
    if (user && requiresVerification) {
      setShowVerification(true);
    } else {
      setShowVerification(false);
    }
  }, [user, requiresVerification]);
  
  // If verification is needed, show the verification form
  if (showVerification && user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <VerificationForm 
          userId={user.id} 
          email={user.email} 
          onSuccess={() => setShowVerification(false)} 
        />
      </div>
    );
  }
  
  // Otherwise, render the wrapped content
  return <>{children}</>;
};

export default AuthVerificationWrapper;