import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertCourseSchema, insertPaymentSchema, 
  insertInstallmentSchema, insertEnrollmentSchema, insertCertificateSchema, 
  insertTestimonialSchema 
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Set up sessions
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "thub-innovation-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Set up passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Incorrect email or password" });
          }
          if (user.password !== password) { // In a real app, use bcrypt to compare passwords
            return done(null, false, { message: "Incorrect email or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  const checkRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = req.user as any;
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    };
  };

  // Error handling middleware for ZodErrors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const formattedError = fromZodError(err);
      return res.status(400).json({ message: formattedError.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  };

  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      });
    })(req, res, next);
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const user = await storage.createUser(userData);
      
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      return res.json({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
    res.json({ authenticated: false });
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      let courses;
      
      if (type) {
        courses = await storage.getCoursesByType(type);
      } else {
        courses = await storage.getAllCourses();
      }
      
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Error fetching course" });
    }
  });

  app.post("/api/courses", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      
      res.status(201).json(course);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/courses/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to update this course" });
      }
      
      const courseData = req.body;
      const updatedCourse = await storage.updateCourse(courseId, courseData);
      
      res.json(updatedCourse);
    } catch (error) {
      res.status(500).json({ message: "Error updating course" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      let enrollments;
      
      if (user.role === "student") {
        enrollments = await storage.getEnrollmentsByUser(user.id);
      } else if (user.role === "teacher") {
        // Get all courses taught by this teacher
        const courses = await storage.getAllCourses();
        const teacherCourses = courses.filter(course => course.teacherId === user.id);
        
        // Get enrollments for these courses
        enrollments = [];
        for (const course of teacherCourses) {
          const courseEnrollments = await storage.getEnrollmentsByCourse(course.id);
          enrollments.push(...courseEnrollments);
        }
      } else if (user.role === "admin") {
        // Admin can see all enrollments, but need to paginate for production
        const enrollmentsList = [];
        const allCourses = await storage.getAllCourses();
        
        for (const course of allCourses) {
          const courseEnrollments = await storage.getEnrollmentsByCourse(course.id);
          enrollmentsList.push(...courseEnrollments);
        }
        
        enrollments = enrollmentsList;
      }
      
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse(req.body);
      const user = req.user as any;
      
      // Students can only enroll themselves
      if (user.role === "student" && enrollmentData.userId !== user.id) {
        return res.status(403).json({ message: "You can only enroll yourself" });
      }
      
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Payment routes
  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const user = req.user as any;
      
      // Students can only make payments for themselves
      if (user.role === "student" && paymentData.userId !== user.id) {
        return res.status(403).json({ message: "You can only make payments for yourself" });
      }
      
      const payment = await storage.createPayment(paymentData);
      
      // If it's an installment payment, create the installments
      if (payment.type === "installment" && req.body.installments) {
        const installments = req.body.installments;
        
        for (const installment of installments) {
          await storage.createInstallment({
            paymentId: payment.id,
            amount: installment.amount,
            dueDate: new Date(installment.dueDate),
            isPaid: false
          });
        }
      }
      
      res.status(201).json(payment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      let payments;
      
      if (user.role === "student") {
        payments = await storage.getPaymentsByUser(user.id);
      } else if (user.role === "admin") {
        // Get all payments for admin, but would need pagination in production
        const allUsers = await storage.getAllUsers();
        
        payments = [];
        for (const user of allUsers) {
          const userPayments = await storage.getPaymentsByUser(user.id);
          payments.push(...userPayments);
        }
      }
      
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payments" });
    }
  });

  // Installment routes
  app.get("/api/installments/:paymentId", isAuthenticated, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const user = req.user as any;
      if (user.role !== "admin" && payment.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized to view these installments" });
      }
      
      const installments = await storage.getInstallmentsByPayment(paymentId);
      res.json(installments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching installments" });
    }
  });

  app.put("/api/installments/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const installmentId = parseInt(req.params.id);
      const installment = await storage.getInstallment(installmentId);
      
      if (!installment) {
        return res.status(404).json({ message: "Installment not found" });
      }
      
      const installmentData = req.body;
      const updatedInstallment = await storage.updateInstallment(installmentId, installmentData);
      
      res.json(updatedInstallment);
    } catch (error) {
      res.status(500).json({ message: "Error updating installment" });
    }
  });

  // Certificate routes
  app.get("/api/certificates", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const certificates = await storage.getCertificatesByUser(user.id);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching certificates" });
    }
  });

  app.post("/api/certificates", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const certificateData = insertCertificateSchema.parse(req.body);
      const certificate = await storage.createCertificate(certificateData);
      res.status(201).json(certificate);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.get("/api/certificates/verify/:id", async (req, res) => {
    try {
      const certificateId = req.params.id;
      const certificate = await storage.getCertificateByUniqueId(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ 
          verified: false,
          message: "Certificate not found" 
        });
      }
      
      // Get related user and course
      const user = await storage.getUser(certificate.userId);
      const course = await storage.getCourse(certificate.courseId);
      
      res.json({
        verified: true,
        certificate: {
          id: certificate.certificateId,
          issueDate: certificate.issueDate,
          studentName: user?.name,
          courseName: course?.title
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error verifying certificate" });
    }
  });

  // Testimonial routes
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getPublishedTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Error fetching testimonials" });
    }
  });

  app.post("/api/testimonials", isAuthenticated, async (req, res) => {
    try {
      const testimonialData = insertTestimonialSchema.parse(req.body);
      const user = req.user as any;
      
      // Users can only create testimonials for themselves
      if (testimonialData.userId !== user.id) {
        return res.status(403).json({ message: "You can only create testimonials for yourself" });
      }
      
      const testimonial = await storage.createTestimonial(testimonialData);
      res.status(201).json(testimonial);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/testimonials/:id/publish", checkRole(["admin"]), async (req, res) => {
    try {
      const testimonialId = parseInt(req.params.id);
      const testimonial = await storage.getTestimonial(testimonialId);
      
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      const updatedTestimonial = await storage.updateTestimonial(testimonialId, { isPublished: true });
      res.json(updatedTestimonial);
    } catch (error) {
      res.status(500).json({ message: "Error publishing testimonial" });
    }
  });

  // WaafipPay integration endpoint
  app.post("/api/payment/process", isAuthenticated, async (req, res) => {
    try {
      const { amount, courseId, paymentType, installments } = req.body;
      
      // Validate payment data
      if (!amount || !courseId || !paymentType) {
        return res.status(400).json({ message: "Missing required payment information" });
      }
      
      // In a real implementation, we would integrate with WaafiPay API here
      // For now, we'll simulate a successful payment
      
      const user = req.user as any;
      
      // Create the payment record
      const payment = await storage.createPayment({
        userId: user.id,
        courseId,
        amount,
        type: paymentType,
        status: "completed",
        transactionId: `WAAFI-${Date.now()}`
      });
      
      // If installment payment, create installment records
      if (paymentType === "installment" && installments && installments.length > 0) {
        for (const installment of installments) {
          await storage.createInstallment({
            paymentId: payment.id,
            amount: installment.amount,
            dueDate: new Date(installment.dueDate),
            isPaid: installment.isPaid || false
          });
        }
      }
      
      // Create enrollment record
      await storage.createEnrollment({
        userId: user.id,
        courseId,
        status: "active"
      });
      
      res.status(200).json({
        success: true,
        paymentId: payment.id,
        message: "Payment processed successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing payment", error: String(error) });
    }
  });

  // Dashboard information for users
  app.get("/api/dashboard", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.role === "student") {
        // Get student dashboard data
        const enrollments = await storage.getEnrollmentsByUser(user.id);
        const courses = [];
        
        for (const enrollment of enrollments) {
          const course = await storage.getCourse(enrollment.courseId);
          if (course) {
            courses.push(course);
          }
        }
        
        const payments = await storage.getPaymentsByUser(user.id);
        const certificates = await storage.getCertificatesByUser(user.id);
        
        res.json({
          enrolledCourses: courses,
          payments,
          certificates
        });
      } else if (user.role === "teacher") {
        // Get teacher dashboard data
        const allCourses = await storage.getAllCourses();
        const teacherCourses = allCourses.filter(course => course.teacherId === user.id);
        
        let totalStudents = 0;
        for (const course of teacherCourses) {
          const enrollments = await storage.getEnrollmentsByCourse(course.id);
          totalStudents += enrollments.length;
        }
        
        res.json({
          courses: teacherCourses,
          totalStudents,
          activeStudents: totalStudents // For simplicity, considering all are active
        });
      } else if (user.role === "admin") {
        // Get admin dashboard data
        const allCourses = await storage.getAllCourses();
        const allUsers = await storage.getAllUsers();
        
        const studentCount = allUsers.filter(u => u.role === "student").length;
        const teacherCount = allUsers.filter(u => u.role === "teacher").length;
        
        let totalRevenue = 0;
        const allPayments = [];
        
        for (const user of allUsers) {
          const payments = await storage.getPaymentsByUser(user.id);
          allPayments.push(...payments);
        }
        
        for (const payment of allPayments) {
          if (payment.status === "completed") {
            totalRevenue += payment.amount;
          }
        }
        
        res.json({
          courseCount: allCourses.length,
          studentCount,
          teacherCount,
          totalRevenue,
          recentPayments: allPayments.slice(-5)
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard data" });
    }
  });

  return httpServer;
}
