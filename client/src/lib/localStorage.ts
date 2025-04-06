/**
 * Secure localStorage utility for handling login credentials
 * 
 * This utility provides methods for securely storing and retrieving user login information
 * when the "Remember Me" option is selected. Password is never stored in plain text.
 */

interface RememberedCredentials {
  email: string;
  timestamp: number;
}

const STORAGE_KEY = 'thub_remembered_user';
// 30 days in milliseconds
const EXPIRATION_TIME = 30 * 24 * 60 * 60 * 1000;

/**
 * Saves user email to localStorage when "Remember Me" is checked
 * @param email The user's email address
 */
export function saveRememberedUser(email: string): void {
  try {
    const data: RememberedCredentials = {
      email,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save remembered user:', error);
    // Silently fail if localStorage is not available
  }
}

/**
 * Retrieves remembered user email from localStorage if it exists and hasn't expired
 * @returns The remembered user's email or null if not found or expired
 */
export function getRememberedUser(): string | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const credentials: RememberedCredentials = JSON.parse(data);
    const now = Date.now();
    
    // Check if the stored credentials have expired
    if (now - credentials.timestamp > EXPIRATION_TIME) {
      clearRememberedUser();
      return null;
    }
    
    return credentials.email;
  } catch (error) {
    console.error('Failed to retrieve remembered user:', error);
    return null;
  }
}

/**
 * Clears the remembered user from localStorage
 */
export function clearRememberedUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear remembered user:', error);
  }
}