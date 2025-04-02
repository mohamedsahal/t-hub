import { apiRequest } from "./queryClient";

// Register new user
export async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}) {
  const response = await apiRequest("POST", "/api/auth/register", userData);
  return response.json();
}

// Login user
export async function loginUser(credentials: {
  email: string;
  password: string;
}) {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  return response.json();
}

// Logout user
export async function logoutUser() {
  const response = await apiRequest("POST", "/api/auth/logout", {});
  return response.json();
}

// Get current session
export async function getSession() {
  const response = await fetch("/api/auth/session", {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to get session");
  }
  
  return response.json();
}

// Check if user has required role
export function hasRole(user: any, requiredRoles: string[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}
