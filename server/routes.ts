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
import waafiPayService from "./services/waafiPayService";
import notificationService from "./services/notificationService";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup authentication
  setupAuth(app);

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

  // WaafiPay integration endpoints
  // Webhook endpoint for WaafiPay to callback after payment
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      const webhookData = req.body;
      
      // Log the webhook data
      console.log("Payment webhook received:", JSON.stringify(webhookData));
      
      // Validate the webhook data
      if (!webhookData || !webhookData.transactionId) {
        return res.status(400).json({ success: false, message: "Invalid webhook data" });
      }
      
      // Process the webhook with WaafiPay service
      const success = await waafiPayService.handlePaymentWebhook(webhookData);
      
      if (success) {
        // Update payment status in database
        // This would be based on the reference ID or transaction ID
        if (webhookData.referenceId) {
          const payments = await storage.getAllPayments();
          const payment = payments.find(p => p.transactionId === webhookData.referenceId);
          
          if (payment) {
            await storage.updatePayment(payment.id, {
              status: webhookData.status === "COMPLETED" ? "completed" : 
                     webhookData.status === "FAILED" ? "failed" : "pending"
            });
          }
        }
        
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ success: false, message: "Failed to process webhook" });
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  // Verify payment status endpoint
  app.get("/api/payment/verify/:transactionId", isAuthenticated, async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      if (!transactionId) {
        return res.status(400).json({ success: false, message: "Transaction ID is required" });
      }
      
      // First check our local database
      const payments = await storage.getAllPayments();
      const payment = payments.find(p => p.transactionId === transactionId);
      
      if (payment) {
        return res.status(200).json({
          success: true,
          payment: {
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            type: payment.type,
            paymentDate: payment.paymentDate
          }
        });
      }
      
      // If not found locally, check with WaafiPay API
      try {
        // Initialize WaafiPay if needed
        if (!waafiPayService.validateWaafiPayCredentials()) {
          await waafiPayService.askForWaafiPayCredentials();
        }
        
        const verificationResult = await waafiPayService.verifyPayment(transactionId);
        
        return res.status(200).json({
          success: true,
          externalStatus: verificationResult.status,
          paymentDetails: verificationResult
        });
      } catch (verifyError) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
          error: String(verifyError)
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error verifying payment", 
        error: String(error) 
      });
    }
  });
  
  // Process payment endpoint
  app.post("/api/payment/process", isAuthenticated, async (req, res) => {
    try {
      const { amount, courseId, paymentType, installments } = req.body;
      
      // Validate payment data
      if (!amount || !courseId || !paymentType) {
        return res.status(400).json({ message: "Missing required payment information" });
      }
      
      const user = req.user as any;
      
      // Get course details
      const course = await storage.getCourse(parseInt(courseId));
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Create a reference ID for this transaction
      const referenceId = `THUB-${Date.now()}-${user.id}`;
      
      try {
        // Initialize WaafiPay if needed and process payment
        if (!waafiPayService.validateWaafiPayCredentials()) {
          await waafiPayService.askForWaafiPayCredentials();
        }
        
        const paymentResponse = await waafiPayService.processPayment({
          amount,
          description: `Payment for ${course.title}`,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.phone || '',
          referenceId
        });
        
        // Here you would typically redirect the user to the WaafiPay payment page
        // For this example, we'll create a successful payment record
        
        // Create the payment record
        const payment = await storage.createPayment({
          userId: user.id,
          courseId: parseInt(courseId),
          amount: parseFloat(amount),
          type: paymentType,
          status: "completed",
          transactionId: referenceId
        });
        
        // If installment payment, create installment records
        if (paymentType === "installment" && installments && installments.length > 0) {
          for (const installment of installments) {
            await storage.createInstallment({
              paymentId: payment.id,
              amount: parseFloat(installment.amount),
              dueDate: new Date(installment.dueDate),
              isPaid: installment.isPaid || false
            });
          }
        }
        
        // Create enrollment record
        await storage.createEnrollment({
          userId: user.id,
          courseId: parseInt(courseId),
          status: "active"
        });
        
        // Send enrollment confirmation email
        await notificationService.sendEnrollmentConfirmation(user.id, parseInt(courseId));
        
        res.status(200).json({
          success: true,
          paymentId: payment.id,
          message: "Payment processed successfully"
        });
      } catch (paymentError) {
        console.error("Payment processing error:", paymentError);
        res.status(400).json({ 
          success: false, 
          message: "Payment processing failed", 
          error: String(paymentError) 
        });
      }
    } catch (error) {
      console.error("Server error during payment:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error processing payment", 
        error: String(error) 
      });
    }
  });

  // Admin Stats Endpoints
  app.get("/api/admin/stats/users", checkRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.length);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user stats" });
    }
  });
  
  app.get("/api/admin/stats/courses", checkRole(["admin"]), async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      const activeCourses = courses.filter(c => c.status === "published").length;
      res.json(activeCourses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching course stats" });
    }
  });
  
  app.get("/api/admin/stats/payments", checkRole(["admin"]), async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      const totalRevenue = payments
        .filter(p => p.status === "completed")
        .reduce((sum, payment) => sum + payment.amount, 0);
      res.json(totalRevenue);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment stats" });
    }
  });
  
  app.get("/api/admin/stats/certificates", checkRole(["admin"]), async (req, res) => {
    try {
      // We need to get all users and then get certificates for each user
      const allUsers = await storage.getAllUsers();
      let certificateCount = 0;
      
      for (const user of allUsers) {
        const certificates = await storage.getCertificatesByUser(user.id);
        certificateCount += certificates.length;
      }
      
      res.json(certificateCount);
    } catch (error) {
      res.status(500).json({ message: "Error fetching certificate stats" });
    }
  });
  
  app.get("/api/admin/recent-payments", checkRole(["admin"]), async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      const recentPayments = [];
      
      // Enrich payment data with user and course information
      for (const payment of payments) {
        const user = await storage.getUser(payment.userId);
        const course = await storage.getCourse(payment.courseId);
        
        if (user && course) {
          recentPayments.push({
            id: payment.id,
            student: user.name,
            course: course.title,
            amount: payment.amount,
            date: payment.paymentDate,
            status: payment.status
          });
        }
      }
      
      // Sort by date (newest first) and take the most recent 5
      const sortedPayments = recentPayments.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 5);
      
      res.json(sortedPayments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent payments" });
    }
  });
  
  app.get("/api/admin/recent-enrollments", checkRole(["admin"]), async (req, res) => {
    try {
      const enrollments = await storage.getAllEnrollments();
      const recentEnrollments = [];
      
      // Enrich enrollment data with user and course information
      for (const enrollment of enrollments) {
        const user = await storage.getUser(enrollment.userId);
        const course = await storage.getCourse(enrollment.courseId);
        
        if (user && course) {
          recentEnrollments.push({
            id: enrollment.id,
            student: user.name,
            course: course.title,
            enrollmentDate: enrollment.enrollmentDate,
            status: enrollment.status,
            progress: Math.floor(Math.random() * 100) // Placeholder since we don't track progress
          });
        }
      }
      
      // Sort by date (newest first) and take the most recent 5
      const sortedEnrollments = recentEnrollments.sort(
        (a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime()
      ).slice(0, 5);
      
      res.json(sortedEnrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent enrollments" });
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
        const allEnrollments = await storage.getAllEnrollments();
        
        const studentCount = allUsers.filter(u => u.role === "student").length;
        const teacherCount = allUsers.filter(u => u.role === "teacher").length;
        
        let totalRevenue = 0;
        const allPayments = await storage.getAllPayments();
        
        for (const payment of allPayments) {
          if (payment.status === "completed") {
            totalRevenue += payment.amount;
          }
        }

        // Get monthly enrollment data
        const enrollmentsByMonth = new Array(12).fill(0);
        const currentYear = new Date().getFullYear();
        
        for (const enrollment of allEnrollments) {
          const enrollDate = new Date(enrollment.enrollmentDate);
          if (enrollDate.getFullYear() === currentYear) {
            enrollmentsByMonth[enrollDate.getMonth()]++;
          }
        }
        
        const monthlyEnrollmentData = enrollmentsByMonth.map((count, index) => {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return {
            name: months[index],
            count
          };
        });
        
        // Get course distribution data
        const courseTypes = ["multimedia", "accounting", "marketing", "development", "diploma"];
        const courseDistribution = courseTypes.map(type => {
          return {
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: allCourses.filter(course => course.type === type).length
          };
        });
        
        // Calculate top performing courses
        const courseEnrollments = new Map();
        for (const enrollment of allEnrollments) {
          const count = courseEnrollments.get(enrollment.courseId) || 0;
          courseEnrollments.set(enrollment.courseId, count + 1);
        }
        
        const topCourses = [];
        // Use Array.from to convert Map entries to array for iteration
        const courseEntriesArray = Array.from(courseEnrollments.entries());
        for (const entry of courseEntriesArray) {
          const courseId = entry[0];
          const count = entry[1];
          const course = await storage.getCourse(courseId);
          if (course) {
            topCourses.push({
              id: course.id,
              title: course.title,
              enrollments: count
            });
          }
        }
        
        topCourses.sort((a, b) => b.enrollments - a.enrollments);
        
        // Get weekly revenue data
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
        const threeWeeksAgo = new Date(twoWeeksAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourWeeksAgo = new Date(threeWeeksAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const revenueData = [
          { name: "Week 1", oneTime: 0, installment: 0 },
          { name: "Week 2", oneTime: 0, installment: 0 },
          { name: "Week 3", oneTime: 0, installment: 0 },
          { name: "Week 4", oneTime: 0, installment: 0 }
        ];
        
        for (const payment of allPayments) {
          if (payment.status !== "completed") continue;
          
          const paymentDate = new Date(payment.paymentDate);
          
          if (paymentDate >= oneWeekAgo) {
            if (payment.type === "one_time") {
              revenueData[3].oneTime += payment.amount;
            } else {
              revenueData[3].installment += payment.amount;
            }
          } else if (paymentDate >= twoWeeksAgo) {
            if (payment.type === "one_time") {
              revenueData[2].oneTime += payment.amount;
            } else {
              revenueData[2].installment += payment.amount;
            }
          } else if (paymentDate >= threeWeeksAgo) {
            if (payment.type === "one_time") {
              revenueData[1].oneTime += payment.amount;
            } else {
              revenueData[1].installment += payment.amount;
            }
          } else if (paymentDate >= fourWeeksAgo) {
            if (payment.type === "one_time") {
              revenueData[0].oneTime += payment.amount;
            } else {
              revenueData[0].installment += payment.amount;
            }
          }
        }
        
        res.json({
          courseCount: allCourses.length,
          studentCount,
          teacherCount,
          totalRevenue,
          recentPayments: allPayments
            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
            .slice(0, 5),
          monthlyEnrollments: monthlyEnrollmentData,
          courseDistribution,
          topCourses: topCourses.slice(0, 5),
          revenueData
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard data" });
    }
  });

  return httpServer;
}
