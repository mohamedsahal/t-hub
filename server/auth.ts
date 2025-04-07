import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendPasswordResetEmail, sendVerificationEmail } from './services/emailService';
import { rateLimitPasswordReset, formatTimeRemaining, rateLimitVerificationCode } from './services/rateLimiter';
import { InsertUserSession, InsertUserLocationHistory } from "@shared/schema";

// Define additional session properties
declare module 'express-session' {
  interface SessionData {
    rememberMe?: boolean;
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  // Check if the password is hashed (contains a '.' separator for hash.salt)
  if (stored.includes('.')) {
    // Handle hashed password
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } else {
    // Handle plain text password (direct comparison for existing legacy accounts)
    // Note: This is less secure and should be upgraded when users log in
    return supplied === stored;
  }
}

// Helper functions to extract device and location information
function extractDeviceInfo(req: Request): { 
  deviceInfo: string, 
  isMobile: boolean,
  browserName: string | null,
  browserVersion: string | null,
  osName: string | null,
  osVersion: string | null
} {
  const userAgent = req.headers['user-agent'] || '';
  
  // Basic device detection
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  
  // Extract browser information
  let browserName: string | null = null;
  let browserVersion: string | null = null;
  if (userAgent.includes('Firefox/')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    browserVersion = match ? match[1] : null;
  } else if (userAgent.includes('Chrome/')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    browserVersion = match ? match[1] : null;
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    browserVersion = match ? match[1] : null;
  } else if (userAgent.includes('Edge/') || userAgent.includes('Edg/')) {
    browserName = 'Edge';
    const match = userAgent.match(/Edge\/([0-9.]+)/) || userAgent.match(/Edg\/([0-9.]+)/);
    browserVersion = match ? match[1] : null;
  } else if (userAgent.includes('MSIE ') || userAgent.includes('Trident/')) {
    browserName = 'Internet Explorer';
    const match = userAgent.match(/MSIE ([0-9.]+)/) || userAgent.match(/rv:([0-9.]+)/);
    browserVersion = match ? match[1] : null;
  }
  
  // Extract operating system information
  let osName: string | null = null;
  let osVersion: string | null = null;
  
  if (userAgent.includes('Windows')) {
    osName = 'Windows';
    if (userAgent.includes('Windows NT 10.0')) osVersion = '10';
    else if (userAgent.includes('Windows NT 6.3')) osVersion = '8.1';
    else if (userAgent.includes('Windows NT 6.2')) osVersion = '8';
    else if (userAgent.includes('Windows NT 6.1')) osVersion = '7';
    else if (userAgent.includes('Windows NT 6.0')) osVersion = 'Vista';
    else if (userAgent.includes('Windows NT 5.1')) osVersion = 'XP';
  } else if (userAgent.includes('Mac OS X')) {
    osName = 'macOS';
    const match = userAgent.match(/Mac OS X ([0-9_.]+)/);
    if (match) {
      osVersion = match[1].replace(/_/g, '.');
    }
  } else if (userAgent.includes('Android')) {
    osName = 'Android';
    const match = userAgent.match(/Android ([0-9.]+)/);
    osVersion = match ? match[1] : null;
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone OS')) {
    osName = 'iOS';
    const match = userAgent.match(/OS ([0-9_]+)/);
    if (match) {
      osVersion = match[1].replace(/_/g, '.');
    }
  } else if (userAgent.includes('Linux')) {
    osName = 'Linux';
    osVersion = null; // Hard to determine specific Linux version from UA
  }
  
  return {
    deviceInfo: userAgent,
    isMobile,
    browserName,
    browserVersion,
    osName,
    osVersion
  };
}

function extractLocationInfo(req: Request): { ipAddress: string, location: string | null } {
  // Get IP address, respecting proxy headers
  const ipAddress = 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
    req.socket.remoteAddress || 
    '';
  
  // In a real implementation, this would call a geolocation service
  // For now, we'll just use the IP as a placeholder
  const location = null; // This would normally come from a geolocation lookup
  
  return { ipAddress, location };
}

async function createUserSessionRecord(req: Request, userId: number): Promise<{sessionId?: number, isSuspicious?: boolean, reason?: string | null}> {
  try {
    // Extract info from the request
    const deviceData = extractDeviceInfo(req);
    const locationData = extractLocationInfo(req);
    
    // Get session expiry date
    const expiryDate = req.session.cookie.expires;
    
    // Create session record with initial status as 'active'
    const session = await storage.createUserSession({
      userId,
      sessionId: req.sessionID,
      deviceInfo: deviceData.deviceInfo,
      ipAddress: locationData.ipAddress,
      location: locationData.location,
      isMobile: deviceData.isMobile,
      browserName: deviceData.browserName,
      browserVersion: deviceData.browserVersion,
      osName: deviceData.osName,
      osVersion: deviceData.osVersion,
      expiresAt: expiryDate,
      status: 'active' as const
    });
    
    // Create location record
    let locationRecord;
    if (session && locationData.ipAddress) {
      locationRecord = await storage.createUserLocation({
        userId,
        sessionId: session.id,
        ipAddress: locationData.ipAddress
      });
    }
    
    // If session was created, check for suspicious patterns
    if (session) {
      try {
        // Run analysis to detect suspicious activity
        const suspiciousCheck = await storage.detectSuspiciousActivity(
          userId,
          req.sessionID,
          locationData.ipAddress,
          locationData.location,
          deviceData.deviceInfo
        );
        
        // If activity is deemed suspicious, update the session
        if (suspiciousCheck.isSuspicious) {
          await storage.updateUserSession(session.id, { 
            status: 'suspicious' as const 
          });
          
          // Also mark the location record
          if (locationRecord) {
            await storage.markLocationAsSuspicious(locationRecord.id);
          }
          
          // Run broader analysis to find patterns across all user's sessions
          await storage.analyzeSuspiciousActivity(userId);
          
          // Log suspicious activity
          console.warn(`Suspicious login detected for user ${userId}: ${suspiciousCheck.reason}`);
          
          return {
            sessionId: session.id,
            isSuspicious: true,
            reason: suspiciousCheck.reason
          };
        }
      } catch (analyzeError) {
        console.error("Error analyzing suspicious activity:", analyzeError);
        // Continue even if analysis fails
      }
    }
    
    return { sessionId: session?.id, isSuspicious: false };
  } catch (error) {
    console.error("Error creating user session record:", error);
    return { isSuspicious: false };
  }
}

export function setupAuth(app: Express) {
  // Use a stronger secret with multiple values for better security
  const secret = process.env.SESSION_SECRET || 
                "thub-innovation-secret-" + randomBytes(16).toString('hex');
  
  const sessionSettings: session.SessionOptions = {
    secret: secret,
    resave: false, // Only save session if it was modified
    saveUninitialized: false, // Don't create session until something is stored
    store: storage.sessionStore,
    cookie: {
      // Set a longer default session for better user experience
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      httpOnly: true, // Prevent client-side JS from accessing the cookie
      sameSite: 'lax', // Better CSRF protection while allowing some cross-site requests
      path: '/' // Ensures the cookie is sent with every request
    }
  };

  app.set("trust proxy", 1); // Trust first proxy
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect email or password" });
        } else {
          // Upgrade plain text passwords to hashed passwords on login
          if (!user.password.includes('.')) {
            try {
              // Hash the plain text password for better security
              const hashedPassword = await hashPassword(password);
              await storage.updateUser(user.id, { password: hashedPassword });
              console.log(`Upgraded password hash for user: ${user.email}`);
            } catch (err) {
              console.error('Failed to upgrade password hash:', err);
              // Continue login even if upgrade fails
            }
          }
          
          // If user's email is not verified, send a new verification code
          if (!user.isVerified) {
            try {
              // Generate verification code
              const verificationCode = await storage.createVerificationCode(user.id);
              
              // Send verification email
              const emailSent = await sendVerificationEmail(user, verificationCode);
              if (!emailSent) {
                console.error("Failed to send verification email during login to:", user.email);
              }
            } catch (verificationError) {
              console.error("Error generating verification code during login:", verificationError);
              // Continue with login even if verification email fails
            }
          }
          
          return done(null, user);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isVerified: false // Make sure user starts as unverified
      });
      
      // Generate verification code
      try {
        const verificationCode = await storage.createVerificationCode(user.id);
        
        // Send verification email
        const emailSent = await sendVerificationEmail(user, verificationCode);
        if (!emailSent) {
          console.error("Failed to send verification email to:", user.email);
        }
      } catch (verificationError) {
        console.error("Error generating verification code:", verificationError);
        // Continue with registration even if verification fails
      }

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Set default session to last 7 days for registrations
        if (req.session.cookie) {
          req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        }
        
        // Explicitly save the session
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
          }
          
          // Create user session record for tracking
          createUserSessionRecord(req, user.id)
            .then(() => {
              res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                requiresVerification: true
              });
            })
            .catch(sessionError => {
              console.error("Error tracking user session during registration:", sessionError);
              // Continue even if session tracking fails
              res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                requiresVerification: true
              });
            });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), async (req, res) => {
    const user = req.user as SelectUser;
    
    // Store the rememberMe setting in the session
    req.session.rememberMe = !!req.body.rememberMe;
    
    // If rememberMe is true, set a longer session
    if (req.body.rememberMe) {
      // Set cookie to expire in 30 days
      if (req.session.cookie) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }
    } else {
      // For non-remembered sessions, use a shorter expiry time
      if (req.session.cookie) {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      }
    }
    
    // Regenerate the session ID to prevent session fixation attacks
    req.session.regenerate((regenerateErr) => {
      if (regenerateErr) {
        console.error("Session regeneration error:", regenerateErr);
        return res.status(500).json({ message: "Session error" });
      }
      
      // Re-login user after session regeneration
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Re-login error:", loginErr);
          return res.status(500).json({ message: "Authentication error" });
        }
        
        // Explicitly save the session to ensure changes are persisted
        req.session.save(async (saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
          }
          
          try {
            // Check for existing sessions for this user
            const existingSessions = await storage.getUserSessions(user.id);
            const activeSessionsCount = existingSessions.filter(s => s.status === 'active').length;
            
            // Create session record for this login and check for suspicious activity
            const sessionResult = await createUserSessionRecord(req, user.id);
            
            // If we should limit to one active session (anti-sharing),
            // revoke all other sessions except the current one
            if (process.env.LIMIT_ACTIVE_SESSIONS === 'true' && activeSessionsCount > 0 && sessionResult.sessionId) {
              try {
                await storage.revokeAllUserSessions(user.id, req.sessionID);
                console.log(`Revoked previous sessions for user ${user.id} as part of anti-sharing measures`);
              } catch (revokeError) {
                console.error("Error revoking previous sessions:", revokeError);
              }
            }
            
            // Generate response with user data
            const response = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isVerified: user.isVerified,
              requiresVerification: !user.isVerified,
              rememberMe: !!req.body.rememberMe
            };
            
            // If suspicious activity was detected, add warning to response
            if (sessionResult.isSuspicious) {
              // Add suspicious flag to response
              Object.assign(response, {
                suspiciousActivity: true,
                suspiciousReason: sessionResult.reason
              });
              
              // Log suspicious activity
              console.warn(`Suspicious login activity detected for user ${user.id}: ${sessionResult.reason}`);
              
              // For admins, we might want to send an email alert
              if (user.role === 'admin') {
                // In a real implementation, send an email to the admin
                console.warn(`Suspicious admin login: ${sessionResult.reason}`);
              }
            }
            
            // Return the response
            res.status(200).json(response);
            
          } catch (sessionError) {
            console.error("Error tracking user session during login:", sessionError);
            
            // Continue even if session tracking fails
            res.status(200).json({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isVerified: user.isVerified,
              requiresVerification: !user.isVerified,
              rememberMe: !!req.body.rememberMe
            });
          }
        });
      });
    });
  });

  app.post("/api/logout", async (req, res, next) => {
    try {
      // If user is authenticated, update their session status in the database
      if (req.isAuthenticated() && req.sessionID) {
        const user = req.user as SelectUser;
        try {
          // Mark session as inactive in the database
          const session = await storage.getUserSessionBySessionId(req.sessionID);
          if (session) {
            await storage.updateUserSession(session.id, { 
              status: 'inactive' as const,
              lastActivity: new Date()
            });
            console.log(`User session ${session.id} marked as inactive during logout`);
          }
        } catch (sessionErr) {
          console.error("Error updating session status during logout:", sessionErr);
          // Continue with logout even if session update fails
        }
      }
    } catch (preLogoutErr) {
      console.error("Pre-logout error:", preLogoutErr);
      // Continue with logout even if there was an error
    }

    // Call logout to clear auth state
    req.logout((err) => {
      if (err) return next(err);
      
      // Then destroy the session completely
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destruction error:", destroyErr);
          return res.status(500).json({ message: "Logout failed" });
        }
        
        // Clear the session cookie from the client
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        
        res.status(200).json({ success: true });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      requiresVerification: !user.isVerified
    });
  });
  
  // Session tracking and management endpoints
  
  // Get current user's active sessions
  app.get("/api/user/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as SelectUser;
      const sessions = await storage.getActiveSessions(user.id);
      
      // Filter sensitive info for regular users
      const sanitizedSessions = sessions.map(session => ({
        id: session.id,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        deviceInfo: session.deviceInfo,
        location: session.location,
        isMobile: session.isMobile,
        browserName: session.browserName,
        osName: session.osName,
        // Include a property to identify the current session
        isCurrentSession: session.sessionId === req.sessionID
      }));
      
      return res.json(sanitizedSessions);
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      return res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });
  
  // Let users revoke their own sessions (except current one)
  app.delete("/api/user/sessions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as SelectUser;
      const sessionId = parseInt(req.params.id, 10);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      // Check if the session belongs to the user
      const session = await storage.getUserSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== user.id) {
        return res.status(403).json({ message: "You can only revoke your own sessions" });
      }
      
      // Don't allow revoking the current session
      if (session.sessionId === req.sessionID) {
        return res.status(400).json({ message: "Cannot revoke your current session. Use logout instead." });
      }
      
      const success = await storage.revokeUserSession(sessionId, "Revoked by user");
      
      if (!success) {
        return res.status(500).json({ message: "Failed to revoke session" });
      }
      
      return res.json({ success: true, message: "Session revoked successfully" });
    } catch (error) {
      console.error("Error revoking session:", error);
      return res.status(500).json({ message: "Failed to revoke session" });
    }
  });
  
  // Admin endpoints for session management
  
  // Get all user sessions (admin only)
  app.get("/api/admin/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as SelectUser;
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      // Get all sessions
      const sessions = Array.from(await storage.getSessions());
      
      // Get all user IDs from sessions
      const userIds = [...new Set(sessions.map(session => session.userId))];
      
      // Get user details for each user ID
      const userDetails: Record<number, {name: string, email: string}> = {};
      for (const userId of userIds) {
        const user = await storage.getUser(userId);
        if (user) {
          userDetails[userId] = {
            name: user.name,
            email: user.email
          };
        }
      }
      
      // Add user details to each session
      const sessionsWithUserDetails = sessions.map(session => ({
        ...session,
        userName: userDetails[session.userId]?.name || 'Unknown',
        userEmail: userDetails[session.userId]?.email || 'Unknown'
      }));
      
      return res.json(sessionsWithUserDetails);
    } catch (error) {
      console.error("Error fetching all sessions:", error);
      return res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });
  
  // Get suspicious sessions (admin only)
  app.get("/api/admin/sessions/suspicious", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as SelectUser;
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const suspiciousSessions = await storage.getSuspiciousSessions();
      
      // Get user details for each suspicious session
      const sessionsWithUserDetails = await Promise.all(
        suspiciousSessions.map(async (session) => {
          const user = await storage.getUser(session.userId);
          return {
            ...session,
            userName: user?.name || 'Unknown',
            userEmail: user?.email || 'Unknown'
          };
        })
      );
      
      return res.json(sessionsWithUserDetails);
    } catch (error) {
      console.error("Error fetching suspicious sessions:", error);
      return res.status(500).json({ message: "Failed to fetch suspicious sessions" });
    }
  });
  
  // Mark session as suspicious (admin only)
  app.put("/api/admin/sessions/:id/mark-suspicious", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as SelectUser;
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const sessionId = parseInt(req.params.id, 10);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const success = await storage.updateUserSession(sessionId, { 
        status: 'suspicious' as const 
      });
      
      if (!success) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      return res.json({ success: true, message: "Session marked as suspicious" });
    } catch (error) {
      console.error("Error marking session as suspicious:", error);
      return res.status(500).json({ message: "Failed to update session" });
    }
  });
  
  // Revoke session (admin only)
  app.delete("/api/admin/sessions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as SelectUser;
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const sessionId = parseInt(req.params.id, 10);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const reason = req.body.reason || "Revoked by admin";
      const success = await storage.revokeUserSession(sessionId, reason);
      
      if (!success) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      return res.json({ success: true, message: "Session revoked successfully" });
    } catch (error) {
      console.error("Error revoking session:", error);
      return res.status(500).json({ message: "Failed to revoke session" });
    }
  });
  
  // Revoke all sessions for a user (admin only)
  app.delete("/api/admin/users/:userId/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const admin = req.user as SelectUser;
      
      if (admin.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
      
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const success = await storage.revokeAllUserSessions(userId);
      
      if (!success) {
        return res.status(404).json({ message: "No sessions found for user" });
      }
      
      return res.json({ success: true, message: "All sessions revoked successfully" });
    } catch (error) {
      console.error("Error revoking all sessions:", error);
      return res.status(500).json({ message: "Failed to revoke sessions" });
    }
  });
  
  // Forgot password - request password reset with rate limiting
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Apply rate limiting based on email
      // 3 requests per 15 minutes, with 1 minute cooldown between requests
      const rateLimit = rateLimitPasswordReset(email);
      
      // If rate limited, return error with timing information
      if (!rateLimit.allowed) {
        const message = rateLimit.cooldownRemaining > 0
          ? `Please wait ${formatTimeRemaining(rateLimit.cooldownRemaining)} before requesting another reset link.`
          : `Too many password reset requests. Please try again in ${formatTimeRemaining(rateLimit.msBeforeNext)}.`;
        
        return res.status(429).json({ 
          message,
          cooldownRemaining: rateLimit.cooldownRemaining,
          msBeforeNext: rateLimit.msBeforeNext
        });
      }
      
      // Find user and create reset token
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security reasons, don't reveal that the email doesn't exist
        return res.status(200).json({ 
          message: "If your email exists in our system, you will receive a password reset link." 
        });
      }
      
      // Generate reset token and save to user
      const resetToken = await storage.createPasswordResetToken(email);
      
      // Send reset email
      if (resetToken) {
        const emailSent = await sendPasswordResetEmail(user, resetToken);
        if (!emailSent) {
          console.error("Failed to send password reset email to:", email);
        }
      }
      
      // Always return success, even if email sending fails (security)
      return res.status(200).json({ 
        message: "If your email exists in our system, you will receive a password reset link." 
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Password reset request failed" });
    }
  });
  
  // Verify token when user clicks on reset link
  app.get("/api/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Check if token exists and is valid
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      return res.status(200).json({ 
        valid: true, 
        message: "Token is valid"
      });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({ message: "Token verification failed" });
    }
  });
  
  // Reset password with token
  app.post("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "New password is required" });
      }
      
      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ 
          message: "Password must be at least 8 characters long" 
        });
      }
      
      // Reset password
      const success = await storage.resetPassword(token, password);
      
      if (!success) {
        return res.status(400).json({ message: "Password reset failed. Token may be invalid or expired." });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "Password has been reset successfully" 
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });
  
  // Email verification endpoint
  app.post("/api/verify-email", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as SelectUser;
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Verification code is required" });
      }
      
      // Verify the code
      const success = await storage.verifyEmail(user.id, code);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      
      // Update the user in session with verified status
      const updatedUser = await storage.getUser(user.id);
      if (updatedUser) {
        req.login(updatedUser, (loginErr) => {
          if (loginErr) {
            console.error("Re-login error after verification:", loginErr);
          }
        });
      }
      
      return res.status(200).json({ 
        success: true,
        message: "Email successfully verified"
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });
  
  // Resend verification code endpoint
  app.post("/api/resend-verification", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as SelectUser;
      
      // Apply rate limiting
      const rateLimit = rateLimitVerificationCode(user.id);
      
      // If rate limited, return error with timing information
      if (!rateLimit.allowed) {
        const message = rateLimit.cooldownRemaining > 0
          ? `Please wait ${formatTimeRemaining(rateLimit.cooldownRemaining)} before requesting another verification code.`
          : `Too many verification requests. Please try again in ${formatTimeRemaining(rateLimit.msBeforeNext)}.`;
        
        return res.status(429).json({ 
          message,
          cooldownRemaining: rateLimit.cooldownRemaining,
          msBeforeNext: rateLimit.msBeforeNext
        });
      }
      
      // Generate new verification code
      const verificationCode = await storage.createVerificationCode(user.id);
      
      // Send verification email
      const emailSent = await sendVerificationEmail(user, verificationCode);
      
      if (!emailSent) {
        console.error("Failed to send verification email to:", user.email);
        return res.status(500).json({ message: "Failed to send verification email" });
      }
      
      return res.status(200).json({ 
        success: true,
        message: "Verification code sent successfully" 
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });
}