import React, { createContext, useState, useContext, useEffect } from "react";
import { getSession, loginUser, logoutUser, registerUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  hasRole: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { authenticated, user } = await getSession();
        
        if (authenticated && user) {
          setUser(user);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const user = await loginUser({ email, password });
      setUser(user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      setIsLoading(true);
      const userData = { name, email, password, role: "student", phone };
      const user = await registerUser(userData);
      setUser(user);
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log you out",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
