// Load environment variables first
import './load-env';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import notificationService from "./services/notificationService";
import emailService from "./services/emailService";
import { runPaymentMigration } from './payment-schema-migration';
import { runUserProgressMigration } from './user-progress-migration';
import { migrateEnrollments } from './user-enrollment-migration';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Handle errors
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Run database migrations
  if (process.env.SKIP_MIGRATIONS !== 'true') {
    try {
      // Payment migration
      await runPaymentMigration();
      log("Payment schema migration completed", "migration");
      
      // User progress tracking migration
      await runUserProgressMigration();
      log("User progress tracking migration completed", "migration");
      
      // User enrollment migration to add progress_percentage column
      await migrateEnrollments();
      log("User enrollment migration completed", "migration");
    } catch (migrationError) {
      log(`Failed to run migrations: ${migrationError}`, "migration");
    }
  } else {
    log("Skipping migrations due to SKIP_MIGRATIONS=true", "migration");
  }

  // Initialize notification service
  try {
    // Explicitly initialize email service
    await emailService.initializeEmailService();
    
    // Start notification service (handles email credential checking internally)
    await notificationService.startNotificationService();
    log("Notification service setup completed", "notification");
  } catch (error) {
    log(`Failed to setup notification service: ${error}`, "notification");
  }

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 3000; // Hardcoded port to avoid conflicts
  server.listen({
    port,
    host: "0.0.0.0",  // Allow connections from any IP address
  }, () => {
    log(`serving on port ${port}`);
  });
})();
