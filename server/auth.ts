import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendPasswordResetEmail } from './services/emailService';
import { rateLimitPasswordReset, formatTimeRemaining } from './services/rateLimiter';

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
      });

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
          
          res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          });
        });
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
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
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
          }
          
          // Add rememberMe to response so client knows the setting was applied
          res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            rememberMe: !!req.body.rememberMe
          });
        });
      });
    });
  });

  app.post("/api/logout", (req, res, next) => {
    // First, call logout to clear auth state
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
      role: user.role
    });
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
}