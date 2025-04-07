/**
 * Simple in-memory rate limiter service
 */
import { log } from '../vite';

// Rate limiter settings
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 3; // Max 3 requests per window

// Store for IP-based rate limiting
type RateLimitRecord = {
  count: number;
  resetAt: number;
  windowMs: number;
};

// Store for email-based rate limiting (for password reset and verification)
type EmailRateLimitRecord = {
  count: number;
  resetAt: number;
  lastRequestAt: number;
  windowMs: number;
};

// In-memory stores
const ipStore: Map<string, RateLimitRecord> = new Map();
const emailStore: Map<string, EmailRateLimitRecord> = new Map();
const verificationStore: Map<string, EmailRateLimitRecord> = new Map();

// Clean up stores periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  
  // Clean up IP store
  for (const [ip, record] of ipStore.entries()) {
    if (now > record.resetAt) {
      ipStore.delete(ip);
    }
  }
  
  // Clean up email store
  for (const [email, record] of emailStore.entries()) {
    if (now > record.resetAt) {
      emailStore.delete(email);
    }
  }
  
  // Clean up verification code store
  for (const [userId, record] of verificationStore.entries()) {
    if (now > record.resetAt) {
      verificationStore.delete(userId);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

/**
 * Rate limit by IP address
 * @param ip Client IP address
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum requests allowed in window
 * @returns Object containing limit info and whether the request is allowed
 */
export const rateLimit = (
  ip: string,
  windowMs: number = DEFAULT_WINDOW_MS,
  maxRequests: number = DEFAULT_MAX_REQUESTS
): { allowed: boolean; remainingRequests: number; msBeforeNext: number } => {
  const now = Date.now();
  let record = ipStore.get(ip);
  
  // Create new record if it doesn't exist or if the window has passed
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + windowMs,
      windowMs
    };
    ipStore.set(ip, record);
  }
  
  // Increment count and determine if request is allowed
  record.count += 1;
  const isAllowed = record.count <= maxRequests;
  
  // Log rate limit hit
  if (!isAllowed) {
    log(`Rate limit exceeded for IP: ${ip}`, 'rate-limit');
  }
  
  // Calculate remaining requests and time before reset
  const remainingRequests = Math.max(0, maxRequests - record.count);
  const msBeforeNext = Math.max(0, record.resetAt - now);
  
  return {
    allowed: isAllowed,
    remainingRequests,
    msBeforeNext
  };
};

/**
 * Rate limit password reset requests by email
 * @param email User email address
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum requests allowed in window
 * @param cooldownMs Minimum time between requests
 * @returns Object containing limit info and whether the request is allowed
 */
export const rateLimitPasswordReset = (
  email: string,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 3, // Max 3 requests per 15 min
  cooldownMs: number = 60 * 1000 // 1 minute cooldown between requests
): { 
  allowed: boolean; 
  remainingRequests: number; 
  msBeforeNext: number;
  cooldownRemaining: number;
} => {
  const now = Date.now();
  let record = emailStore.get(email);
  
  // Create new record if it doesn't exist or if the window has passed
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + windowMs,
      lastRequestAt: 0,
      windowMs
    };
    emailStore.set(email, record);
  }
  
  // Check cooldown - minimum time between requests
  const timeSinceLastRequest = now - (record.lastRequestAt || 0);
  const cooldownRemaining = Math.max(0, cooldownMs - timeSinceLastRequest);
  const cooldownActive = cooldownRemaining > 0;
  
  // Only increment count if cooldown is not active
  if (!cooldownActive) {
    record.count += 1;
    record.lastRequestAt = now;
  }
  
  // Determine if request is allowed (under max count and not in cooldown)
  const underMaxRequests = record.count <= maxRequests;
  const isAllowed = underMaxRequests && !cooldownActive;
  
  // Log rate limit hit
  if (!isAllowed) {
    if (cooldownActive) {
      log(`Password reset cooldown active for email: ${email}`, 'rate-limit');
    } else {
      log(`Password reset rate limit exceeded for email: ${email}`, 'rate-limit');
    }
  }
  
  // Calculate remaining requests and time before reset
  const remainingRequests = Math.max(0, maxRequests - record.count);
  const msBeforeNext = Math.max(0, record.resetAt - now);
  
  return {
    allowed: isAllowed,
    remainingRequests,
    msBeforeNext,
    cooldownRemaining
  };
};

/**
 * Format milliseconds to a human-readable time
 * @param ms Milliseconds
 * @returns Formatted time string
 */
export const formatTimeRemaining = (ms: number): string => {
  if (ms <= 0) return '0 seconds';
  
  const seconds = Math.ceil(ms / 1000);
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

/**
 * Rate limit verification code requests by user ID
 * @param userId User ID
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum requests allowed in window
 * @param cooldownMs Minimum time between requests
 * @returns Object containing limit info and whether the request is allowed
 */
export const rateLimitVerificationCode = (
  userId: string | number,
  windowMs: number = 5 * 60 * 1000, // 5 minutes
  maxRequests: number = 5, // Max 5 requests per 5 min
  cooldownMs: number = 30 * 1000 // 30 second cooldown between requests
): { 
  allowed: boolean; 
  remainingRequests: number; 
  msBeforeNext: number;
  cooldownRemaining: number;
} => {
  const userKey = userId.toString();
  const now = Date.now();
  let record = verificationStore.get(userKey);
  
  // Create new record if it doesn't exist or if the window has passed
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + windowMs,
      lastRequestAt: 0,
      windowMs
    };
    verificationStore.set(userKey, record);
  }
  
  // Check cooldown - minimum time between requests
  const timeSinceLastRequest = now - (record.lastRequestAt || 0);
  const cooldownRemaining = Math.max(0, cooldownMs - timeSinceLastRequest);
  const cooldownActive = cooldownRemaining > 0;
  
  // Only increment count if cooldown is not active
  if (!cooldownActive) {
    record.count += 1;
    record.lastRequestAt = now;
  }
  
  // Determine if request is allowed (under max count and not in cooldown)
  const underMaxRequests = record.count <= maxRequests;
  const isAllowed = underMaxRequests && !cooldownActive;
  
  // Log rate limit hit
  if (!isAllowed) {
    if (cooldownActive) {
      log(`Verification code cooldown active for user: ${userId}`, 'rate-limit');
    } else {
      log(`Verification code rate limit exceeded for user: ${userId}`, 'rate-limit');
    }
  }
  
  // Calculate remaining requests and time before reset
  const remainingRequests = Math.max(0, maxRequests - record.count);
  const msBeforeNext = Math.max(0, record.resetAt - now);
  
  return {
    allowed: isAllowed,
    remainingRequests,
    msBeforeNext,
    cooldownRemaining
  };
};

export default {
  rateLimit,
  rateLimitPasswordReset,
  rateLimitVerificationCode,
  formatTimeRemaining
};