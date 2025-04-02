import { apiRequest } from "./queryClient";

// Register new user
export async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}) {
  const response = await apiRequest("POST", "/api/register", userData);
  return response.json();
}

// Login user
export async function loginUser(credentials: {
  email: string;
  password: string;
}) {
  const response = await apiRequest("POST", "/api/login", credentials);
  return response.json();
}

// Logout user
export async function logoutUser() {
  const response = await apiRequest("POST", "/api/logout", {});
  return response.json();
}

// Get current session
export async function getSession() {
  const response = await fetch("/api/user", {
    credentials: "include",
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      return { authenticated: false, user: null };
    }
    throw new Error("Failed to get session");
  }
  
  const user = await response.json();
  return { authenticated: true, user };
}

// Check if user has required role
export function hasRole(user: any, requiredRoles: string[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}
