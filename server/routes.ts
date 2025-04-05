import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertCourseSchema, insertPaymentSchema, 
  insertInstallmentSchema, insertEnrollmentSchema, insertCertificateSchema, 
  insertTestimonialSchema, insertProductSchema, insertPartnerSchema,
  insertEventSchema, insertLandingContentSchema, insertCourseSectionSchema,
  insertCourseModuleSchema, insertExamSchema, insertExamQuestionSchema,
  insertExamResultSchema, insertSemesterSchema, insertCohortSchema,
  insertCohortEnrollmentSchema, insertAlertSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import waafiPayService from "./services/waafiPayService";
import notificationService from "./services/notificationService";
import { setupAuth, hashPassword, comparePasswords } from "./auth";

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
    console.error("Server error:", err);
    return res.status(500).json({ message: "Internal server error", error: err instanceof Error ? err.message : String(err) });
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
  app.get("/api/user/certificates", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const certificates = await storage.getCertificatesByUser(user.id);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching certificates" });
    }
  });
  
  // Get all users for certificate management, etc.
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send password hashes
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Error fetching users" });
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

  // Certificate sharing endpoint
  app.get("/api/certificates/share/:id", async (req, res) => {
    try {
      const certificateId = req.params.id;
      const certificate = await storage.getCertificateByUniqueId(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ 
          success: false,
          message: "Certificate not found" 
        });
      }
      
      // Get related user and course
      const user = await storage.getUser(certificate.userId);
      const course = await storage.getCourse(certificate.courseId);
      
      // Generate sharing metadata
      const shareData = {
        success: true,
        certificate: {
          id: certificate.certificateId,
          issueDate: certificate.issueDate,
          expiryDate: certificate.expiryDate,
          studentName: user?.name,
          courseName: course?.title,
          verificationUrl: `${req.protocol}://${req.get('host')}/verify-certificate?id=${certificate.certificateId}`,
          organisation: "Thub Innovation",
          shareTitle: `${user?.name}'s ${course?.title} Certificate`,
          shareDescription: `This certificate was issued to ${user?.name} by Thub Innovation for completing ${course?.title}`,
        }
      };
      
      res.json(shareData);
    } catch (error) {
      res.status(500).json({ success: false, message: "Error generating share data" });
    }
  });

  // Certificate CRUD routes
  app.get("/api/certificates", async (req, res) => {
    try {
      const certificates = await storage.getAllCertificates();
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching certificates" });
    }
  });

  app.get("/api/certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const certificate = await storage.getCertificate(id);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "Error fetching certificate" });
    }
  });

  app.post("/api/certificates", checkRole(["admin"]), async (req, res) => {
    try {
      const certificateData = insertCertificateSchema.parse(req.body);
      
      // Check if certificate ID already exists
      const existingCertificate = await storage.getCertificateByUniqueId(certificateData.certificateId);
      if (existingCertificate) {
        return res.status(400).json({ message: "Certificate ID already exists" });
      }
      
      const certificate = await storage.createCertificate(certificateData);
      res.status(201).json(certificate);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/certificates/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const certificateData = req.body;
      
      // If certificateId is being updated, check if it already exists and is not the current one
      if (certificateData.certificateId) {
        const existingCertificate = await storage.getCertificateByUniqueId(certificateData.certificateId);
        if (existingCertificate && existingCertificate.id !== id) {
          return res.status(400).json({ message: "Certificate ID already exists" });
        }
      }
      
      const updatedCertificate = await storage.updateCertificate(id, certificateData);
      
      if (!updatedCertificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.json(updatedCertificate);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/certificates/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const certificate = await storage.getCertificate(id);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      const success = await storage.deleteCertificate(id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete certificate" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting certificate" });
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

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const activeOnly = req.query.active === "true";
      
      let products;
      if (type) {
        products = await storage.getProductsByType(type);
      } else if (activeOnly) {
        products = await storage.getActiveProducts();
      } else {
        products = await storage.getAllProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.post("/api/products", checkRole(["admin"]), async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/products/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const productData = req.body;
      const updatedProduct = await storage.updateProduct(productId, productData);
      
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Error updating product" });
    }
  });

  // Partner routes
  app.get("/api/partners", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      
      let partners;
      if (activeOnly) {
        partners = await storage.getActivePartners();
      } else {
        partners = await storage.getAllPartners();
      }
      
      res.json(partners);
    } catch (error) {
      res.status(500).json({ message: "Error fetching partners" });
    }
  });

  app.get("/api/partners/:id", async (req, res) => {
    try {
      const partnerId = parseInt(req.params.id);
      const partner = await storage.getPartner(partnerId);
      
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      res.json(partner);
    } catch (error) {
      res.status(500).json({ message: "Error fetching partner" });
    }
  });

  app.post("/api/partners", checkRole(["admin"]), async (req, res) => {
    try {
      const partnerData = insertPartnerSchema.parse(req.body);
      const partner = await storage.createPartner(partnerData);
      res.status(201).json(partner);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/partners/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const partnerId = parseInt(req.params.id);
      const partner = await storage.getPartner(partnerId);
      
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      const partnerData = req.body;
      const updatedPartner = await storage.updatePartner(partnerId, partnerData);
      
      res.json(updatedPartner);
    } catch (error) {
      res.status(500).json({ message: "Error updating partner" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const upcoming = req.query.upcoming === "true";
      
      let events;
      if (activeOnly && upcoming) {
        events = await storage.getUpcomingEvents();
      } else if (activeOnly) {
        events = await storage.getActiveEvents();
      } else {
        events = await storage.getAllEvents();
      }
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Error fetching event" });
    }
  });

  app.post("/api/events", checkRole(["admin"]), async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/events/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const eventData = req.body;
      const updatedEvent = await storage.updateEvent(eventId, eventData);
      
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Error updating event" });
    }
  });

  // Landing Content routes
  app.get("/api/landing-content", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const activeOnly = req.query.active === "true";
      
      let landingContent;
      if (type) {
        landingContent = await storage.getLandingContentByType(type);
      } else if (activeOnly) {
        landingContent = await storage.getActiveLandingContent();
      } else {
        landingContent = await storage.getAllLandingContent();
      }
      
      res.json(landingContent);
    } catch (error) {
      res.status(500).json({ message: "Error fetching landing content" });
    }
  });

  app.get("/api/landing-content/:id", async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const content = await storage.getLandingContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Landing content not found" });
      }
      
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Error fetching landing content" });
    }
  });

  app.post("/api/landing-content", checkRole(["admin"]), async (req, res) => {
    try {
      const contentData = insertLandingContentSchema.parse(req.body);
      const content = await storage.createLandingContent(contentData);
      res.status(201).json(content);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/landing-content/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const content = await storage.getLandingContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Landing content not found" });
      }
      
      const contentData = req.body;
      const updatedContent = await storage.updateLandingContent(contentId, contentData);
      
      res.json(updatedContent);
    } catch (error) {
      res.status(500).json({ message: "Error updating landing content" });
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
      if (!webhookData || !webhookData.transactionId || !webhookData.referenceId) {
        return res.status(400).json({ success: false, message: "Invalid webhook data" });
      }
      
      // Process the webhook with WaafiPay service
      const success = await waafiPayService.handlePaymentWebhook(webhookData);
      
      if (success) {
        // Find the payment by reference ID (which we set as the transactionId in our DB)
        const payments = await storage.getAllPayments();
        const payment = payments.find(p => p.transactionId === webhookData.referenceId);
        
        if (payment) {
          // Map WaafiPay status to our payment status
          const paymentStatus = webhookData.status === "COMPLETED" ? "completed" : 
                               webhookData.status === "FAILED" ? "failed" : "pending";
          
          // Update payment record
          await storage.updatePayment(payment.id, {
            status: paymentStatus,
            gatewayResponse: JSON.stringify(webhookData)
          });
          
          // If payment is completed, also create an enrollment and process installments
          if (paymentStatus === "completed") {
            // Check if enrollment already exists
            const existingEnrollments = await storage.getEnrollmentsByUser(payment.userId);
            const alreadyEnrolled = existingEnrollments.some(e => 
              e.courseId === payment.courseId && e.status === "active"
            );
            
            if (!alreadyEnrolled) {
              // Create enrollment record
              await storage.createEnrollment({
                userId: payment.userId,
                courseId: payment.courseId,
                status: "active"
              });
              
              // Send enrollment confirmation email
              try {
                await notificationService.sendEnrollmentConfirmation(payment.userId, payment.courseId);
              } catch (emailError) {
                console.error("Failed to send enrollment confirmation email:", emailError);
              }
            }
            
            // If it's an installment payment, update the first installment as paid
            if (payment.type === "installment") {
              const installments = await storage.getInstallmentsByPayment(payment.id);
              if (installments.length > 0) {
                // Update the first installment to paid
                const firstInstallment = installments.find(i => i.installmentNumber === 1);
                if (firstInstallment) {
                  await storage.updateInstallment(firstInstallment.id, {
                    isPaid: true,
                    status: "completed",
                    paymentDate: new Date(),
                    transactionId: webhookData.transactionId
                  });
                }
              }
            }
          }
          
          console.log(`Payment ${payment.id} updated to status: ${paymentStatus}`);
        } else {
          console.log(`No payment found for reference ID: ${webhookData.referenceId}`);
        }
        
        // Always return 200 to WaafiPay to acknowledge receipt
        res.status(200).json({ success: true });
      } else {
        // Still return 200 to acknowledge receipt, but log the failure
        console.error("Failed to process webhook data");
        res.status(200).json({ success: false, message: "Webhook received but failed to process" });
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      // Still return 200 to acknowledge receipt, even on error
      res.status(200).json({ success: false, message: "Error during webhook processing" });
    }
  });
  
  // Verify payment status endpoint
  app.get("/api/payment/verify/:referenceId", isAuthenticated, async (req, res) => {
    try {
      const { referenceId } = req.params;
      
      if (!referenceId) {
        return res.status(400).json({ success: false, message: "Reference ID is required" });
      }
      
      // First check our local database
      const payments = await storage.getAllPayments();
      const payment = payments.find(p => p.transactionId === referenceId);
      
      if (payment) {
        // Check if user is authorized to view this payment
        const user = req.user as any;
        if (user.role !== 'admin' && payment.userId !== user.id) {
          return res.status(403).json({ success: false, message: "Unauthorized to view this payment" });
        }
        
        // Get course details
        const course = await storage.getCourse(payment.courseId);
        
        // Check if there's an enrollment
        const enrollments = await storage.getEnrollmentsByUser(payment.userId);
        const enrollment = enrollments.find(e => e.courseId === payment.courseId);
        
        // Get installments if applicable
        let installments = [];
        if (payment.type === 'installment') {
          installments = await storage.getInstallmentsByPayment(payment.id);
        }
        
        return res.status(200).json({
          success: true,
          payment: {
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            type: payment.type,
            paymentMethod: payment.paymentMethod,
            walletType: payment.walletType,
            paymentDate: payment.paymentDate,
            courseName: course?.title || 'Unknown Course',
            enrollmentStatus: enrollment?.status || 'not_enrolled',
            installments: installments.map(i => ({
              id: i.id,
              amount: i.amount,
              dueDate: i.dueDate,
              isPaid: i.isPaid,
              status: i.status
            }))
          }
        });
      }
      
      // If not found locally, check with WaafiPay API
      try {
        // Initialize WaafiPay if needed
        if (!waafiPayService.validateWaafiPayCredentials()) {
          await waafiPayService.askForWaafiPayCredentials();
        }
        
        // In a real integration, this would verify with the WaafiPay API using the reference ID
        // For now, we'll assume it's not found if it's not in our database
        
        return res.status(404).json({
          success: false,
          message: "Payment not found. It may still be processing."
        });
      } catch (verifyError) {
        return res.status(404).json({
          success: false,
          message: "Payment not found or payment verification failed",
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
      const { 
        amount, 
        courseId, 
        paymentType, 
        installments, 
        paymentMethod, 
        walletType, 
        phone 
      } = req.body;
      
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
      
      try {
        // Initialize WaafiPay if needed
        if (!waafiPayService.validateWaafiPayCredentials()) {
          await waafiPayService.askForWaafiPayCredentials();
        }
        
        // Format payment request data
        const paymentRequestData = waafiPayService.formatPaymentRequest({
          amount: parseFloat(amount),
          courseId: parseInt(courseId),
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userPhone: phone || user.phone || '',
          paymentMethod,
          walletType
        });
        
        // Process the payment (defaults to using Hosted Payment Page)
        const useHostedPage = true; // Set to false for direct API integration
        const paymentResponse = await waafiPayService.processPayment(paymentRequestData, useHostedPage);
        
        // Create the payment record in pending status
        const payment = await storage.createPayment({
          userId: user.id,
          courseId: parseInt(courseId),
          amount: parseFloat(amount),
          type: paymentType,
          status: "pending", // Will be updated when webhook is received
          transactionId: paymentResponse.referenceId || paymentRequestData.referenceId,
          paymentMethod: paymentMethod || 'card',
          walletType: walletType || null,
          customerPhone: phone || user.phone || '',
          redirectUrl: paymentResponse.redirectUrl
        });
        
        // If installment payment, create installment records
        if (paymentType === "installment" && installments && installments.length > 0) {
          for (let i = 0; i < installments.length; i++) {
            const installment = installments[i];
            await storage.createInstallment({
              paymentId: payment.id,
              amount: parseFloat(installment.amount),
              dueDate: new Date(installment.dueDate),
              isPaid: i === 0 && installment.isPaid, // Only first installment might be paid now
              installmentNumber: i + 1,
              status: i === 0 ? 'pending' : 'pending' // Will be updated after payment
            });
          }
        }
        
        // Return the payment information with redirect URL for the frontend
        res.status(200).json({
          success: true,
          paymentId: payment.id,
          redirectUrl: paymentResponse.redirectUrl,
          referenceId: paymentResponse.referenceId || paymentRequestData.referenceId,
          message: "Payment initiated successfully"
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

  // Admin User Management Endpoints
  app.get("/api/admin/users", checkRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  app.get("/api/admin/users/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  app.post("/api/admin/users", checkRole(["admin"]), async (req, res) => {
    try {
      const userSchema = insertUserSchema.extend({
        password: z.string().min(6, "Password must be at least 6 characters"),
        preferredCourse: z.enum(["short", "specialist", "bootcamp", "diploma"]).optional()
      });
      
      const result = userSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: fromZodError(result.error).message 
        });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Create user with hashed password
      const hashedPassword = await hashPassword(result.data.password);
      const newUser = await storage.createUser({
        ...result.data,
        password: hashedPassword
      });
      
      // Don't return the password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });
  
  app.put("/api/admin/users/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a separate schema for updates that doesn't require all fields
      const updateSchema = z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "teacher", "student"]).optional(),
        preferredCourse: z.enum(["short", "specialist", "bootcamp", "diploma"]).optional(),
        password: z.string().min(6).optional(),
        phone: z.string().optional(),
      });
      
      const result = updateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: fromZodError(result.error).message 
        });
      }
      
      // Check if email is being changed and if it's already in use
      if (result.data.email && result.data.email !== user.email) {
        const existingUser = await storage.getUserByEmail(result.data.email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      // Handle password update
      let updatedFields: any = { ...result.data };
      if (result.data.password) {
        updatedFields.password = await hashPassword(result.data.password);
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updatedFields);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });
  
  app.delete("/api/admin/users/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow deleting your own account
      if (req.user && (req.user as any).id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
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

  // Admin teacher routes
  app.get("/api/admin/teachers", checkRole(["admin"]), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const teachers = allUsers.filter(user => user.role === "teacher");
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Error fetching teachers" });
    }
  });

  // Admin courses routes
  app.get("/api/admin/courses", checkRole(["admin"]), async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Error fetching courses" });
    }
  });

  app.post("/api/admin/courses", checkRole(["admin"]), async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/admin/courses/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const updatedCourse = await storage.updateCourse(courseId, req.body);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Error updating course" });
    }
  });

  app.delete("/api/admin/courses/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // In a real application, you would need to handle deleting related records
      // or implementing soft delete functionality
      
      // For now, just return success
      res.json({ success: true, message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Error deleting course" });
    }
  });

  // Admin enrollments routes
  app.get("/api/admin/enrollments", checkRole(["admin"]), async (req, res) => {
    try {
      const enrollments = await storage.getAllEnrollments();
      
      // Enhance enrollments with user and course info
      const enhancedEnrollments = [];
      for (const enrollment of enrollments) {
        const user = await storage.getUser(enrollment.userId);
        const course = await storage.getCourse(enrollment.courseId);
        
        enhancedEnrollments.push({
          ...enrollment,
          userName: user?.name || 'Unknown User',
          userEmail: user?.email || '',
          courseName: course?.title || 'Unknown Course'
        });
      }
      
      res.json(enhancedEnrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Error fetching enrollments" });
    }
  });

  app.post("/api/admin/enrollments", checkRole(["admin"]), async (req, res) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/admin/enrollments/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.getEnrollment(enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, req.body);
      res.json(updatedEnrollment);
    } catch (error) {
      console.error("Error updating enrollment:", error);
      res.status(500).json({ message: "Error updating enrollment" });
    }
  });

  app.delete("/api/admin/enrollments/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.getEnrollment(enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // In a real application, you would need to implement actual deletion or soft delete
      
      // For now, just return success
      res.json({ success: true, message: "Enrollment deleted successfully" });
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      res.status(500).json({ message: "Error deleting enrollment" });
    }
  });

  // Admin payments routes
  app.get("/api/admin/payments", checkRole(["admin"]), async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      
      // Enhance payments with user and course info
      const enhancedPayments = [];
      for (const payment of payments) {
        const user = await storage.getUser(payment.userId);
        const course = await storage.getCourse(payment.courseId);
        
        enhancedPayments.push({
          ...payment,
          userName: user?.name || 'Unknown User',
          userEmail: user?.email || '',
          courseName: course?.title || 'Unknown Course'
        });
      }
      
      res.json(enhancedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Error fetching payments" });
    }
  });

  app.post("/api/admin/payments", checkRole(["admin"]), async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
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

  app.patch("/api/admin/payments/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const updatedPayment = await storage.updatePayment(paymentId, req.body);
      res.json(updatedPayment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Error updating payment" });
    }
  });

  // Admin installments routes
  app.get("/api/admin/installments", checkRole(["admin"]), async (req, res) => {
    try {
      const installments = await storage.getAllInstallments();
      
      // Enhance installments with payment, user, and course info
      const enhancedInstallments = [];
      for (const installment of installments) {
        const payment = await storage.getPayment(installment.paymentId);
        if (payment) {
          const user = await storage.getUser(payment.userId);
          const course = await storage.getCourse(payment.courseId);
          
          enhancedInstallments.push({
            ...installment,
            userName: user?.name || 'Unknown User',
            userEmail: user?.email || '',
            courseName: course?.title || 'Unknown Course',
            totalAmount: payment.amount
          });
        }
      }
      
      res.json(enhancedInstallments);
    } catch (error) {
      console.error("Error fetching installments:", error);
      res.status(500).json({ message: "Error fetching installments" });
    }
  });

  app.get("/api/admin/payments/:paymentId/installments", checkRole(["admin"]), async (req, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const installments = await storage.getInstallmentsByPayment(paymentId);
      res.json(installments);
    } catch (error) {
      console.error("Error fetching installments:", error);
      res.status(500).json({ message: "Error fetching installments" });
    }
  });

  app.post("/api/admin/installments", checkRole(["admin"]), async (req, res) => {
    try {
      const installmentData = insertInstallmentSchema.parse(req.body);
      const installment = await storage.createInstallment(installmentData);
      res.status(201).json(installment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/admin/installments/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const installmentId = parseInt(req.params.id);
      const installment = await storage.getInstallment(installmentId);
      
      if (!installment) {
        return res.status(404).json({ message: "Installment not found" });
      }
      
      const updatedInstallment = await storage.updateInstallment(installmentId, req.body);
      res.json(updatedInstallment);
    } catch (error) {
      console.error("Error updating installment:", error);
      res.status(500).json({ message: "Error updating installment" });
    }
  });

  // Profile management
  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { name, email, currentPassword, newPassword } = req.body;
      
      // Check if email already exists and it's not the current user's email
      if (email && email !== user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // If user is trying to change password, verify current password
      if (currentPassword && newPassword) {
        const isValid = await comparePasswords(currentPassword, user.password);
        if (!isValid) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
        
        // Update user with new password
        const hashedPassword = await hashPassword(newPassword);
        await storage.updateUser(user.id, { 
          name: name || user.name,
          email: email || user.email,
          password: hashedPassword
        });
      } else {
        // Update user without changing password
        await storage.updateUser(user.id, { 
          name: name || user.name,
          email: email || user.email
        });
      }
      
      // Get updated user data
      const updatedUser = await storage.getUser(user.id);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return updated user data without password
      const { password, ...userData } = updatedUser;
      res.status(200).json(userData);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Error updating profile" });
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

  // Course module routes for the course builder
  app.get("/api/admin/courses/:courseId/modules", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is authorized to view this course's modules
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to view this course's modules" });
      }
      
      // Get modules for the course
      const modules = await storage.getCourseModules(courseId);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching course modules" });
    }
  });

  app.post("/api/admin/courses/:courseId/modules", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is authorized to add modules to this course
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to add modules to this course" });
      }
      
      // Create the module data with course ID
      const moduleData = insertCourseModuleSchema.parse({
        ...req.body,
        courseId
      });
      
      // Create the module
      const module = await storage.createCourseModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/admin/courses/:courseId/modules/:moduleId", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const moduleId = parseInt(req.params.moduleId);
      
      // Get the course and module
      const course = await storage.getCourse(courseId);
      const module = await storage.getCourseModule(moduleId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (!module || module.courseId !== courseId) {
        return res.status(404).json({ message: "Module not found in this course" });
      }
      
      // Check if user is authorized to update modules in this course
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to update modules in this course" });
      }
      
      // Update the module
      const updatedModule = await storage.updateCourseModule(moduleId, req.body);
      if (!updatedModule) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json(updatedModule);
    } catch (error) {
      res.status(500).json({ message: "Error updating course module" });
    }
  });

  app.delete("/api/admin/courses/:courseId/modules/:moduleId", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const moduleId = parseInt(req.params.moduleId);
      
      // Get the course and module
      const course = await storage.getCourse(courseId);
      const module = await storage.getCourseModule(moduleId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (!module || module.courseId !== courseId) {
        return res.status(404).json({ message: "Module not found in this course" });
      }
      
      // Check if user is authorized to delete modules in this course
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to delete modules in this course" });
      }
      
      // Delete the module (which will also delete all associated sections)
      const success = await storage.deleteCourseModule(moduleId);
      if (!success) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting course module" });
    }
  });

  // Reorder modules
  app.patch("/api/admin/courses/:courseId/modules/reorder", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is authorized to reorder modules in this course
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to reorder modules in this course" });
      }
      
      // Validate the request body
      if (!req.body.modules || !Array.isArray(req.body.modules)) {
        return res.status(400).json({ message: "Invalid request body - modules array required" });
      }
      
      // Update each module's order
      const modules = req.body.modules;
      for (const module of modules) {
        await storage.updateCourseModule(module.id, { order: module.order });
      }
      
      // Return the updated modules
      const updatedModules = await storage.getCourseModules(courseId);
      res.json(updatedModules);
    } catch (error) {
      res.status(500).json({ message: "Error reordering course modules" });
    }
  });

  // Course section routes for the course builder
  app.get("/api/admin/courses/:courseId/sections", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if the user is an admin or the teacher of this course
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to view this course's sections" });
      }
      
      // Get sections for the course
      const sections = await storage.getCourseSections(courseId);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "Error fetching course sections" });
    }
  });
  
  app.post("/api/admin/courses/:courseId/sections", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if the user is an admin or the teacher of this course
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to add sections to this course" });
      }
      
      // Validate and parse the request body
      const sectionData = insertCourseSectionSchema.parse({
        ...req.body,
        courseId,
      });
      
      // Create the section
      const section = await storage.createCourseSection(sectionData);
      res.status(201).json(section);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/admin/courses/:courseId/sections/:sectionId", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const sectionId = parseInt(req.params.sectionId);
      
      // Get the course and section
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if the user is an admin or the teacher of this course
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to update sections in this course" });
      }
      
      // Update the section
      const updatedSection = await storage.updateCourseSection(sectionId, req.body);
      if (!updatedSection) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      res.json(updatedSection);
    } catch (error) {
      res.status(500).json({ message: "Error updating course section" });
    }
  });
  
  app.delete("/api/admin/courses/:courseId/sections/:sectionId", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const sectionId = parseInt(req.params.sectionId);
      
      // Get the course
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if the user is an admin or the teacher of this course
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to delete sections in this course" });
      }
      
      // Delete the section
      const success = await storage.deleteCourseSection(sectionId);
      if (!success) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting course section" });
    }
  });
  
  // Reorder sections
  app.patch("/api/admin/courses/:courseId/sections/reorder", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      // Get the course
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if the user is an admin or the teacher of this course
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to reorder sections in this course" });
      }
      
      // Validate request body
      if (!req.body.sections || !Array.isArray(req.body.sections)) {
        return res.status(400).json({ message: "Invalid request body - sections array required" });
      }
      
      // Update each section's order
      const sections = req.body.sections;
      for (const section of sections) {
        await storage.updateCourseSection(section.id, { order: section.order });
      }
      
      // Return the updated sections
      const updatedSections = await storage.getCourseSections(courseId);
      res.json(updatedSections);
    } catch (error) {
      res.status(500).json({ message: "Error reordering course sections" });
    }
  });
  
  // Semester management routes
  app.get("/api/admin/semesters", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      
      let semesters: any[] = [];
      if (courseId) {
        semesters = await storage.getSemestersByCourse(courseId);
      } else {
        semesters = await storage.getAllSemesters();
      }
      
      res.json(semesters);
    } catch (error) {
      console.error("Error fetching semesters:", error);
      res.status(500).json({ message: "Error fetching semesters" });
    }
  });

  app.get("/api/admin/semesters/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const semesterId = parseInt(req.params.id);
      const semester = await storage.getSemester(semesterId);
      
      if (!semester) {
        return res.status(404).json({ message: "Semester not found" });
      }
      
      // Get course to check permissions for teachers
      const user = req.user as any;
      if (user.role === "teacher") {
        const course = await storage.getCourse(semester.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to view this semester" });
        }
      }
      
      res.json(semester);
    } catch (error) {
      console.error("Error fetching semester:", error);
      res.status(500).json({ message: "Error fetching semester" });
    }
  });

  app.post("/api/admin/semesters", checkRole(["admin"]), async (req, res) => {
    try {
      const semesterData = insertSemesterSchema.parse(req.body);
      
      // Verify the course exists
      const course = await storage.getCourse(semesterData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const semester = await storage.createSemester(semesterData);
      res.status(201).json(semester);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/admin/semesters/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const semesterId = parseInt(req.params.id);
      const semester = await storage.getSemester(semesterId);
      
      if (!semester) {
        return res.status(404).json({ message: "Semester not found" });
      }
      
      const updatedSemester = await storage.updateSemester(semesterId, req.body);
      res.json(updatedSemester);
    } catch (error) {
      console.error("Error updating semester:", error);
      res.status(500).json({ message: "Error updating semester" });
    }
  });
  
  // Cohort management routes
  app.get("/api/admin/cohorts", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      
      let cohorts: any[] = [];
      if (courseId) {
        cohorts = await storage.getCohortsByCourse(courseId);
      } else {
        cohorts = await storage.getAllCohorts();
      }
      
      res.json(cohorts);
    } catch (error) {
      console.error("Error fetching cohorts:", error);
      res.status(500).json({ message: "Error fetching cohorts" });
    }
  });

  app.get("/api/admin/cohorts/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const cohortId = parseInt(req.params.id);
      const cohort = await storage.getCohort(cohortId);
      
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      // For teachers, check if they are assigned to the course
      const user = req.user as any;
      if (user.role === "teacher") {
        const course = await storage.getCourse(cohort.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to view this cohort" });
        }
      }
      
      res.json(cohort);
    } catch (error) {
      console.error("Error fetching cohort:", error);
      res.status(500).json({ message: "Error fetching cohort" });
    }
  });

  app.post("/api/admin/cohorts", checkRole(["admin"]), async (req, res) => {
    try {
      console.log("Creating cohort with data:", req.body);
      
      // Validate required fields manually before passing to Zod
      const { name, courseId, startDate, endDate, academicYear, status } = req.body;
      
      if (!name || name.trim() === "") {
        return res.status(400).json({ message: "Validation error: Required at \"name\"" });
      }
      if (!courseId) {
        return res.status(400).json({ message: "Validation error: Required at \"courseId\"" });
      }
      if (!startDate) {
        return res.status(400).json({ message: "Validation error: Required at \"startDate\"" });
      }
      if (!endDate) {
        return res.status(400).json({ message: "Validation error: Required at \"endDate\"" });
      }
      if (!academicYear) {
        return res.status(400).json({ message: "Validation error: Required at \"academicYear\"" });
      }
      if (!status) {
        return res.status(400).json({ message: "Validation error: Required at \"status\"" });
      }
      
      // Ensure all data is properly formatted
      const cohortData = {
        ...req.body,
        name: name.trim(),
        courseId: typeof courseId === 'string' ? parseInt(courseId) : courseId,
        // Convert string dates to actual Date objects
        startDate: startDate instanceof Date ? startDate : new Date(startDate),
        endDate: endDate instanceof Date ? endDate : new Date(endDate),
        maxStudents: req.body.maxStudents ? 
          (typeof req.body.maxStudents === 'string' ? 
            parseInt(req.body.maxStudents) : req.body.maxStudents) : null
      };
      
      try {
        const validatedData = insertCohortSchema.parse(cohortData);
        
        // Verify the course exists
        const course = await storage.getCourse(validatedData.courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        
        console.log("Creating cohort with validated data:", validatedData);
        const cohort = await storage.createCohort(validatedData);
        res.status(201).json(cohort);
      } catch (zodError) {
        console.error("Zod validation error:", zodError);
        handleZodError(zodError, res);
      }
    } catch (error) {
      console.error("Error creating cohort:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  app.patch("/api/admin/cohorts/:id", checkRole(["admin"]), async (req, res) => {
    try {
      console.log("Updating cohort with data:", req.body);
      
      const cohortId = parseInt(req.params.id);
      const cohort = await storage.getCohort(cohortId);
      
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      // Validate the data before updating
      const { name, courseId, startDate, endDate, academicYear, status } = req.body;
      
      // Only validate fields that are provided
      if (name !== undefined && (name === null || name.trim() === "")) {
        return res.status(400).json({ message: "Validation error: Name cannot be empty" });
      }
      
      // Ensure all data is properly formatted
      const cohortData = {
        ...req.body,
        name: name?.trim(),
        courseId: courseId !== undefined ? 
          (typeof courseId === 'string' ? parseInt(courseId) : courseId) : 
          undefined,
        // Convert string dates to actual Date objects if they're provided
        startDate: startDate ? 
          (startDate instanceof Date ? startDate : new Date(startDate)) : 
          undefined,
        endDate: endDate ? 
          (endDate instanceof Date ? endDate : new Date(endDate)) : 
          undefined,
        maxStudents: req.body.maxStudents !== undefined ? 
          (typeof req.body.maxStudents === 'string' ? 
            parseInt(req.body.maxStudents) : req.body.maxStudents) : 
          undefined
      };
      
      console.log("Formatted cohort update data:", cohortData);
      const updatedCohort = await storage.updateCohort(cohortId, cohortData);
      
      if (!updatedCohort) {
        return res.status(500).json({ message: "Failed to update cohort" });
      }
      
      res.json(updatedCohort);
    } catch (error) {
      console.error("Error updating cohort:", error);
      res.status(500).json({ message: "Error updating cohort" });
    }
  });

  app.delete("/api/admin/cohorts/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const cohortId = parseInt(req.params.id);
      const cohort = await storage.getCohort(cohortId);
      
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      // Delete the cohort and all its enrollments
      await storage.deleteCohort(cohortId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cohort:", error);
      res.status(500).json({ message: "Error deleting cohort" });
    }
  });
  
  // Cohort Enrollment routes
  app.get("/api/admin/cohorts/:cohortId/enrollments", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const cohortId = parseInt(req.params.cohortId);
      const cohort = await storage.getCohort(cohortId);
      
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      // For teachers, check if they are assigned to the course
      const user = req.user as any;
      if (user.role === "teacher") {
        const course = await storage.getCourse(cohort.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to view enrollments for this cohort" });
        }
      }
      
      const enrollments = await storage.getCohortEnrollmentsByCohort(cohortId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching cohort enrollments:", error);
      res.status(500).json({ message: "Error fetching cohort enrollments" });
    }
  });

  app.post("/api/admin/cohorts/:cohortId/enrollments", checkRole(["admin"]), async (req, res) => {
    try {
      const cohortId = parseInt(req.params.cohortId);
      const cohort = await storage.getCohort(cohortId);
      
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      // Validate the enrollment data
      const enrollmentData = insertCohortEnrollmentSchema.parse({
        ...req.body,
        cohortId
      });
      
      // Verify the user exists
      const user = await storage.getUser(enrollmentData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the user is already enrolled in this cohort
      const existingEnrollments = await storage.getCohortEnrollmentsByCohort(cohortId);
      const userAlreadyEnrolled = existingEnrollments.some(e => e.userId === enrollmentData.userId);
      
      if (userAlreadyEnrolled) {
        return res.status(400).json({ message: "User is already enrolled in this cohort" });
      }
      
      const enrollment = await storage.createCohortEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/admin/cohorts/:cohortId/enrollments/:enrollmentId", checkRole(["admin"]), async (req, res) => {
    try {
      const cohortId = parseInt(req.params.cohortId);
      const enrollmentId = parseInt(req.params.enrollmentId);
      
      const cohort = await storage.getCohort(cohortId);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      const enrollment = await storage.getCohortEnrollment(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Verify the enrollment belongs to the specified cohort
      if (enrollment.cohortId !== cohortId) {
        return res.status(400).json({ message: "Enrollment does not belong to the specified cohort" });
      }
      
      const updatedEnrollment = await storage.updateCohortEnrollment(enrollmentId, req.body);
      res.json(updatedEnrollment);
    } catch (error) {
      console.error("Error updating cohort enrollment:", error);
      res.status(500).json({ message: "Error updating cohort enrollment" });
    }
  });

  app.delete("/api/admin/cohorts/:cohortId/enrollments/:enrollmentId", checkRole(["admin"]), async (req, res) => {
    try {
      const cohortId = parseInt(req.params.cohortId);
      const enrollmentId = parseInt(req.params.enrollmentId);
      
      const cohort = await storage.getCohort(cohortId);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      const enrollment = await storage.getCohortEnrollment(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Verify the enrollment belongs to the specified cohort
      if (enrollment.cohortId !== cohortId) {
        return res.status(400).json({ message: "Enrollment does not belong to the specified cohort" });
      }
      
      await storage.deleteCohortEnrollment(enrollmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cohort enrollment:", error);
      res.status(500).json({ message: "Error deleting cohort enrollment" });
    }
  });
  
  // Exam routes
  app.get("/api/admin/exams", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const sectionId = req.query.sectionId ? parseInt(req.query.sectionId as string) : undefined;
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId as string) : undefined;
      
      let exams: any[] = [];
      
      if (courseId) {
        exams = await storage.getExamsByCourse(courseId);
      } else if (sectionId) {
        exams = await storage.getExamsBySection(sectionId);
      } else if (semesterId) {
        exams = await storage.getExamsBySemester(semesterId);
      } else {
        // For admin, return all exams
        // For teachers, return exams for their courses
        try {
          const user = req.user as any;
          if (user.role === "admin") {
            // Use the new getAllExams method
            exams = await storage.getAllExams();
          } else if (user.role === "teacher") {
            const allCourses = await storage.getAllCourses();
            const teacherCourses = allCourses.filter(course => course.teacherId === user.id);
            for (const course of teacherCourses) {
              try {
                const courseExams = await storage.getExamsByCourse(course.id);
                exams.push(...courseExams);
              } catch (e) {
                console.error(`Error getting exams for course ${course.id}:`, e);
              }
            }
          }
        } catch (e) {
          console.error("Error in exam fetch logic:", e);
        }
      }
      
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exams" });
    }
  });
  
  app.get("/api/admin/exams/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if user is authorized to view this exam
      const user = req.user as any;
      if (user.role !== "admin") {
        const course = await storage.getCourse(exam.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to view this exam" });
        }
      }
      
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exam" });
    }
  });
  
  app.post("/api/admin/exams", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      console.log("Received exam creation request:", JSON.stringify(req.body, null, 2));
      
      // The request data is wrapped in a 'data' property
      const formData = req.body.data || req.body;
      
      // Simplified approach - directly create an object with expected database field names
      // but using the values from the incoming request
      const examData = {
        title: formData.title,
        description: formData.description || null,
        course_id: formData.courseId,
        section_id: formData.sectionId || null,
        semester_id: formData.semesterId || null,
        type: formData.type,
        max_score: formData.maxScore,
        passing_score: formData.passingScore,
        time_limit: formData.timeLimit,
        status: formData.status || 'active',
        grade_a_threshold: formData.gradeAThreshold || 90,
        grade_b_threshold: formData.gradeBThreshold || 80,
        grade_c_threshold: formData.gradeCThreshold || 70, 
        grade_d_threshold: formData.gradeDThreshold || 60,
        available_from: formData.availableFrom || null,
        available_to: formData.availableTo || null
      };
      
      console.log("Direct exam data without schema validation:", JSON.stringify(examData, null, 2));
      
      // Skip schema validation for now and work directly with our data object
      
      // Verify the course exists
      const course = await storage.getCourse(examData.course_id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is authorized to add exams to this course
      const user = req.user as any;
      if (user.role !== "admin" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to add exams to this course" });
      }
      
      // If section_id is provided, verify the section exists
      if (examData.section_id) {
        const section = await storage.getCourseSection(examData.section_id);
        if (!section) {
          return res.status(404).json({ message: "Section not found" });
        }
        
        // Verify the section belongs to the specified course
        if (section.courseId !== examData.course_id) {
          return res.status(400).json({ message: "Section does not belong to the specified course" });
        }
      }
      
      try {
        const exam = await storage.createExam(examData);
        console.log("Exam created successfully:", JSON.stringify(exam, null, 2));
        res.status(201).json(exam);
      } catch (storageError) {
        console.error("Error in createExam:", storageError);
        throw storageError;
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/admin/exams/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if user is authorized to update this exam
      const user = req.user as any;
      if (user.role !== "admin") {
        const course = await storage.getCourse(exam.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to update this exam" });
        }
      }
      
      // The request data is wrapped in a 'data' property
      const formData = req.body.data || req.body;
      
      // Convert camelCase properties to snake_case before updating
      const convertedBody = {
        title: formData.title,
        description: formData.description,
        course_id: formData.courseId,
        section_id: formData.sectionId,
        semester_id: formData.semesterId,
        type: formData.type,
        max_score: formData.maxScore,
        passing_score: formData.passingScore,
        time_limit: formData.timeLimit,
        status: formData.status,
        grade_a_threshold: formData.gradeAThreshold,
        grade_b_threshold: formData.gradeBThreshold,
        grade_c_threshold: formData.gradeCThreshold,
        grade_d_threshold: formData.gradeDThreshold,
        available_from: formData.availableFrom,
        available_to: formData.availableTo
      };
      
      console.log("Converted exam data for update:", JSON.stringify(convertedBody, null, 2));
      const updatedExam = await storage.updateExam(examId, convertedBody);
      
      res.json(updatedExam);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.delete("/api/admin/exams/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if user is authorized to delete this exam
      const user = req.user as any;
      if (user.role !== "admin") {
        const course = await storage.getCourse(exam.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to delete this exam" });
        }
      }
      
      await storage.deleteExam(examId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting exam" });
    }
  });
  
  // Exam Questions routes
  app.get("/api/admin/exams/:examId/questions", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if user is authorized to view these questions
      const user = req.user as any;
      if (user.role !== "admin") {
        const course = await storage.getCourse(exam.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to view questions for this exam" });
        }
      }
      
      const questions = await storage.getExamQuestionsByExam(examId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exam questions" });
    }
  });
  
  app.post("/api/admin/exams/:examId/questions", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if user is authorized to add questions to this exam
      const user = req.user as any;
      if (user.role !== "admin") {
        const course = await storage.getCourse(exam.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to add questions to this exam" });
        }
      }
      
      console.log("Received question creation request:", JSON.stringify(req.body, null, 2));
      
      // The request data may be wrapped in a 'data' property
      const formData = req.body.data || req.body;
      
      // Convert camelCase properties to snake_case before validation
      const questionData = {
        exam_id: examId,
        question: formData.question,
        type: formData.type,
        options: formData.options || [],
        correct_answer: formData.correctAnswer,
        points: formData.points,
        order: formData.order,
        explanation: formData.explanation || null
      };
      
      console.log("Direct question data without schema validation:", JSON.stringify(questionData, null, 2));
      
      // Get the current highest order value and add 1
      const existingQuestions = await storage.getExamQuestionsByExam(examId);
      const maxOrder = existingQuestions.length > 0 
        ? Math.max(...existingQuestions.map(q => q.order)) 
        : 0;
      
      questionData.order = questionData.order || maxOrder + 1;
      
      const question = await storage.createExamQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/admin/exams/:examId/questions/:questionId", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const questionId = parseInt(req.params.questionId);
      
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      const question = await storage.getExamQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Verify the question belongs to the specified exam
      if (question.examId !== examId) {
        return res.status(400).json({ message: "Question does not belong to the specified exam" });
      }
      
      // Check if user is authorized to update this question
      const user = req.user as any;
      if (user.role !== "admin") {
        const course = await storage.getCourse(exam.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to update questions for this exam" });
        }
      }
      
      console.log("Received question update request:", JSON.stringify(req.body, null, 2));
      
      // The request data may be wrapped in a 'data' property
      const formData = req.body.data || req.body;
      
      // Convert camelCase properties to snake_case before updating
      const convertedBody = {
        exam_id: formData.examId || examId,
        question: formData.question,
        type: formData.type,
        options: formData.options,
        correct_answer: formData.correctAnswer,
        points: formData.points,
        order: formData.order,
        explanation: formData.explanation
      };
      
      console.log("Converted question data for update:", JSON.stringify(convertedBody, null, 2));
      const updatedQuestion = await storage.updateExamQuestion(questionId, convertedBody);
      
      res.json(updatedQuestion);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.delete("/api/admin/exams/:examId/questions/:questionId", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const questionId = parseInt(req.params.questionId);
      
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      const question = await storage.getExamQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Verify the question belongs to the specified exam
      if (question.examId !== examId) {
        return res.status(400).json({ message: "Question does not belong to the specified exam" });
      }
      
      // Check if user is authorized to delete this question
      const user = req.user as any;
      if (user.role !== "admin") {
        const course = await storage.getCourse(exam.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to delete questions for this exam" });
        }
      }
      
      await storage.deleteExamQuestion(questionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting exam question" });
    }
  });
  
  // Reorder questions
  app.patch("/api/admin/exams/:examId/questions/reorder", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      
      // Verify the exam exists
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if user is authorized to modify this exam
      const user = req.user as any;
      if (user.role !== "admin") {
        const course = await storage.getCourse(exam.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to reorder questions in this exam" });
        }
      }
      
      // Validate request body
      if (!req.body.questions || !Array.isArray(req.body.questions)) {
        return res.status(400).json({ message: "Invalid request body - questions array required" });
      }
      
      // Update the order of each question
      const questions = req.body.questions;
      for (const question of questions) {
        await storage.updateExamQuestion(question.id, { order: question.order });
      }
      
      // Return the updated questions
      const updatedQuestions = await storage.getExamQuestionsByExam(examId);
      res.json(updatedQuestions);
    } catch (error) {
      res.status(500).json({ message: "Error reordering exam questions" });
    }
  });
  
  // Student Exam Endpoints
  app.get("/api/exams", isAuthenticated, async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const examType = req.query.type as string | undefined;
      const user = req.user as any;
      
      if (!courseId && !examType) {
        return res.status(400).json({ message: "Either Course ID or exam type is required" });
      }
      
      let exams: any[] = [];
      
      if (examType && (user.role === "admin" || user.role === "teacher")) {
        // If exam type filter is specified and user is admin/teacher
        exams = await storage.getExamsByType(examType);
      } else if (courseId) {
        // If filtering by course ID
        
        // Verify the user is enrolled in the course if they're a student
        if (user.role === "student") {
          const enrollments = await storage.getEnrollmentsByUser(user.id);
          const isEnrolled = enrollments.some(enrollment => enrollment.courseId === courseId);
          
          if (!isEnrolled) {
            return res.status(403).json({ message: "Not enrolled in this course" });
          }
        }
        
        exams = await storage.getExamsByCourse(courseId);
      }
      
      // Filter the exams if a type was specified after getting by course
      if (examType && courseId) {
        exams = exams.filter(exam => exam.type === examType);
      }
      
      // Filter out inactive exams and include only available ones for students
      const filteredExams = user.role === "student" 
        ? exams.filter(exam => {
            const isActive = exam.isActive;
            const isAvailable = (!exam.availableFrom || new Date(exam.availableFrom) <= new Date()) && 
                               (!exam.availableTo || new Date(exam.availableTo) >= new Date());
            return isActive && isAvailable;
          })
        : exams;
        
      res.json(filteredExams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      res.status(500).json({ message: "Error fetching exams" });
    }
  });
  
  app.get("/api/exams/:id", isAuthenticated, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      const user = req.user as any;
      
      // For students, check if they're enrolled and if the exam is active and available
      if (user.role === "student") {
        const enrollments = await storage.getEnrollmentsByUser(user.id);
        const isEnrolled = enrollments.some(enrollment => enrollment.courseId === exam.courseId);
        
        if (!isEnrolled) {
          return res.status(403).json({ message: "Not enrolled in this course" });
        }
        
        const isActive = exam.isActive;
        const isAvailable = (!exam.availableFrom || new Date(exam.availableFrom) <= new Date()) && 
                           (!exam.availableTo || new Date(exam.availableTo) >= new Date());
                           
        if (!isActive || !isAvailable) {
          return res.status(403).json({ message: "Exam is not available" });
        }
      }
      
      // For teachers, check if they are assigned to the course
      if (user.role === "teacher") {
        const course = await storage.getCourse(exam.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to view this exam" });
        }
      }
      
      // Get questions for the exam but exclude correct answers for students
      const questions = await storage.getExamQuestionsByExam(examId);
      
      if (user.role === "student") {
        // Remove correct answers for students
        const sanitizedQuestions = questions.map(q => {
          const { correctAnswer, explanation, ...rest } = q;
          return rest;
        });
        
        res.json({
          ...exam,
          questions: sanitizedQuestions
        });
      } else {
        // Include all data for teachers and admins
        res.json({
          ...exam,
          questions
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching exam" });
    }
  });
  
  // Submit exam results
  app.post("/api/exams/:id/submit", isAuthenticated, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      const user = req.user as any;
      
      // Verify the user is enrolled in the course
      const enrollments = await storage.getEnrollmentsByUser(user.id);
      const isEnrolled = enrollments.some(enrollment => enrollment.courseId === exam.courseId);
      
      if (!isEnrolled && user.role === "student") {
        return res.status(403).json({ message: "Not enrolled in this course" });
      }
      
      // Verify the exam is active and available
      const isActive = exam.isActive;
      const isAvailable = (!exam.availableFrom || new Date(exam.availableFrom) <= new Date()) && 
                         (!exam.availableTo || new Date(exam.availableTo) >= new Date());
                         
      if (!isActive || !isAvailable) {
        return res.status(403).json({ message: "Exam is not available" });
      }
      
      // Validate submitted answers
      if (!req.body.answers || !Array.isArray(req.body.answers)) {
        return res.status(400).json({ message: "Invalid request body - answers array required" });
      }
      
      // Get all questions for the exam
      const questions = await storage.getExamQuestionsByExam(examId);
      
      // Calculate score
      const answers = req.body.answers;
      let score = 0;
      let totalPoints = 0;
      
      // Process only questions with automatic scoring (multiple choice, true/false)
      const automaticQuestions = questions.filter(q => 
        q.type === 'multiple_choice' || q.type === 'true_false');
      
      for (const question of automaticQuestions) {
        totalPoints += question.points;
        
        // Find the submitted answer for this question
        const submittedAnswer = answers.find((a: any) => a.questionId === question.id);
        
        if (submittedAnswer && submittedAnswer.answer === question.correctAnswer) {
          score += question.points;
        }
      }
      
      // Determine exam status
      let status: 'pending' | 'completed' | 'failed' | 'passed' = 'pending';
      
      // Helper function to determine the grade
      const determineGrade = (
        percentScore: number, 
        aThreshold = 90, 
        bThreshold = 80, 
        cThreshold = 70, 
        dThreshold = 60
      ): string => {
        if (percentScore >= aThreshold) return 'A';
        if (percentScore >= bThreshold) return 'B';
        if (percentScore >= cThreshold) return 'C';
        if (percentScore >= dThreshold) return 'D';
        return 'F';
      };
      
      // Calculate percentage score
      const percentScore = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
      
      // Default grade
      let grade: 'A' | 'B' | 'C' | 'D' | 'F' | 'incomplete' | 'not_graded' = 'not_graded';
      
      // If there are only multiple choice/true-false questions, we can automatically grade
      if (questions.length === automaticQuestions.length) {
        status = score >= exam.passingPoints ? 'passed' : 'failed';
        
        // Calculate grade for auto-gradable exams
        grade = determineGrade(
          percentScore,
          exam.gradeAThreshold === null ? 90 : exam.gradeAThreshold,
          exam.gradeBThreshold === null ? 80 : exam.gradeBThreshold,
          exam.gradeCThreshold === null ? 70 : exam.gradeCThreshold,
          exam.gradeDThreshold === null ? 60 : exam.gradeDThreshold
        ) as 'A' | 'B' | 'C' | 'D' | 'F';
      } else {
        // If there are essay/short answer questions, mark as pending for manual grading
        status = 'pending';
        grade = 'not_graded';
      }
      
      // Save the exam result
      const result = await storage.createExamResult({
        examId,
        userId: user.id,
        score,
        status,
        grade,
        remarks: null,
        attemptNumber: 1, // Would need to check previous attempts in production
        answers: answers.map((a: any) => JSON.stringify(a)),
      });
      
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error submitting exam" });
    }
  });
  
  // Get exam results for a student
  app.get("/api/user/exam-results", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const results = await storage.getExamResultsByUser(user.id);
      
      // Enrich with exam data
      const enrichedResults = [];
      for (const result of results) {
        const exam = await storage.getExam(result.examId);
        if (exam) {
          enrichedResults.push({
            ...result,
            examTitle: exam.title,
            examType: exam.type,
            courseId: exam.courseId
          });
        }
      }
      
      res.json(enrichedResults);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exam results" });
    }
  });
  
  // Get exam results for a course (for teachers and admins)
  app.get("/api/admin/exam-results/course/:courseId", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const user = req.user as any;
      
      // Verify teacher is authorized for this course
      if (user.role === "teacher") {
        const course = await storage.getCourse(courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to view results for this course" });
        }
      }
      
      const results = await storage.getExamResultsByCourse(courseId);
      
      // Enrich with exam and user data
      const enrichedResults = [];
      for (const result of results) {
        const exam = await storage.getExam(result.examId);
        const student = await storage.getUser(result.userId);
        
        if (exam && student) {
          enrichedResults.push({
            ...result,
            examTitle: exam.title,
            examType: exam.type,
            studentName: student.name,
            studentEmail: student.email
          });
        }
      }
      
      res.json(enrichedResults);
    } catch (error) {
      console.error("Error fetching course exam results:", error);
      res.status(500).json({ message: "Error fetching exam results" });
    }
  });
  
  // Get exam results by semester (class) for a course
  app.get("/api/admin/exam-results/semester/:semesterId", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const semesterId = parseInt(req.params.semesterId);
      const user = req.user as any;
      
      // Get the semester
      const semester = await storage.getSemester(semesterId);
      if (!semester) {
        return res.status(404).json({ message: "Semester not found" });
      }
      
      // Get course to check authorization
      const course = await storage.getCourse(semester.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Verify teacher is authorized for this course
      if (user.role === "teacher" && course.teacherId !== user.id) {
        return res.status(403).json({ message: "Not authorized to view results for this semester" });
      }
      
      // Get all exams for this semester
      const exams = await storage.getExamsBySemester(semesterId);
      if (exams.length === 0) {
        return res.json([]);
      }
      
      // Get all results for these exams
      const allResults = [];
      for (const exam of exams) {
        const examResults = await storage.getExamResultsByExam(exam.id);
        
        // Enrich with student and exam data
        for (const result of examResults) {
          const student = await storage.getUser(result.userId);
          if (student) {
            allResults.push({
              ...result,
              examId: exam.id,
              examTitle: exam.title,
              examType: exam.type,
              totalPoints: exam.totalPoints,
              studentId: student.id,
              studentName: student.name,
              studentEmail: student.email
            });
          }
        }
      }
      
      res.json(allResults);
    } catch (error) {
      console.error("Error fetching semester exam results:", error);
      res.status(500).json({ message: "Error fetching exam results" });
    }
  });
  
  // Grade an exam (for teachers and admins)
  app.patch("/api/admin/exam-results/:id/grade", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const resultId = parseInt(req.params.id);
      const result = await storage.getExamResult(resultId);
      
      if (!result) {
        return res.status(404).json({ message: "Exam result not found" });
      }
      
      const exam = await storage.getExam(result.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if user is authorized to grade this exam
      const user = req.user as any;
      if (user.role !== "admin") {
        const course = await storage.getCourse(exam.courseId);
        if (!course || course.teacherId !== user.id) {
          return res.status(403).json({ message: "Not authorized to grade exams for this course" });
        }
      }
      
      // Validate request body
      if (typeof req.body.score !== 'number') {
        return res.status(400).json({ message: "Invalid request body - score is required" });
      }
      
      // Determine status based on score
      const status = req.body.score >= exam.passingPoints ? 'passed' : 'failed';
      
      // Calculate grade based on percentage score and thresholds
      const percentScore = (req.body.score / exam.totalPoints) * 100;
      
      // Helper function to determine the grade
      const determineGrade = (
        score: number, 
        aThreshold = 90, 
        bThreshold = 80, 
        cThreshold = 70, 
        dThreshold = 60
      ): string => {
        if (score >= aThreshold) return 'A';
        if (score >= bThreshold) return 'B';
        if (score >= cThreshold) return 'C';
        if (score >= dThreshold) return 'D';
        return 'F';
      };
      
      // Get grade using helper function with null-safe values
      const grade = determineGrade(
        percentScore,
        exam.gradeAThreshold === null ? 90 : exam.gradeAThreshold,
        exam.gradeBThreshold === null ? 80 : exam.gradeBThreshold,
        exam.gradeCThreshold === null ? 70 : exam.gradeCThreshold,
        exam.gradeDThreshold === null ? 60 : exam.gradeDThreshold
      );
      
      // Update the exam result
      const updatedResult = await storage.gradeExamResult(
        resultId, 
        req.body.score, 
        grade, 
        req.body.remarks
      );
      
      res.json(updatedResult);
    } catch (error) {
      res.status(500).json({ message: "Error grading exam" });
    }
  });

  // Semester routes
  app.get("/api/courses/:courseId/semesters", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const semesters = await storage.getSemestersByCourse(courseId);
      res.json(semesters);
    } catch (error) {
      res.status(500).json({ message: "Error fetching semesters" });
    }
  });

  app.get("/api/semesters/:id", async (req, res) => {
    try {
      const semesterId = parseInt(req.params.id);
      const semester = await storage.getSemester(semesterId);
      
      if (!semester) {
        return res.status(404).json({ message: "Semester not found" });
      }
      
      res.json(semester);
    } catch (error) {
      res.status(500).json({ message: "Error fetching semester" });
    }
  });

  app.post("/api/semesters", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const semesterData = insertSemesterSchema.parse(req.body);
      const semester = await storage.createSemester(semesterData);
      res.status(201).json(semester);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/semesters/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const semesterId = parseInt(req.params.id);
      const semester = await storage.getSemester(semesterId);
      
      if (!semester) {
        return res.status(404).json({ message: "Semester not found" });
      }
      
      // Course related checks - teacher can only edit their own courses' semesters
      if (req.user && (req.user as any).role === "teacher") {
        const course = await storage.getCourse(semester.courseId);
        if (!course || course.teacherId !== (req.user as any).id) {
          return res.status(403).json({ message: "Not authorized to update this semester" });
        }
      }
      
      const semesterData = req.body;
      const updatedSemester = await storage.updateSemester(semesterId, semesterData);
      
      res.json(updatedSemester);
    } catch (error) {
      res.status(500).json({ message: "Error updating semester" });
    }
  });

  // Cohort routes
  app.get("/api/cohorts", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      
      let cohorts;
      if (status === 'active') {
        cohorts = await storage.getActiveCohorts();
      } else {
        cohorts = await storage.getAllCohorts();
      }
      
      res.json(cohorts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cohorts" });
    }
  });

  app.get("/api/courses/:courseId/cohorts", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const cohorts = await storage.getCohortsByCourse(courseId);
      res.json(cohorts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cohorts" });
    }
  });

  app.get("/api/cohorts/:id", async (req, res) => {
    try {
      const cohortId = parseInt(req.params.id);
      const cohort = await storage.getCohort(cohortId);
      
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      res.json(cohort);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cohort" });
    }
  });

  app.post("/api/cohorts", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const cohortData = insertCohortSchema.parse(req.body);
      
      // Course related checks - teacher can only create cohorts for their own courses
      if (req.user && (req.user as any).role === "teacher") {
        const course = await storage.getCourse(cohortData.courseId);
        if (!course || course.teacherId !== (req.user as any).id) {
          return res.status(403).json({ message: "Not authorized to create cohorts for this course" });
        }
      }
      
      const cohort = await storage.createCohort(cohortData);
      res.status(201).json(cohort);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/cohorts/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const cohortId = parseInt(req.params.id);
      const cohort = await storage.getCohort(cohortId);
      
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      // Course related checks - teacher can only edit their own courses' cohorts
      if (req.user && (req.user as any).role === "teacher") {
        const course = await storage.getCourse(cohort.courseId);
        if (!course || course.teacherId !== (req.user as any).id) {
          return res.status(403).json({ message: "Not authorized to update this cohort" });
        }
      }
      
      const cohortData = req.body;
      const updatedCohort = await storage.updateCohort(cohortId, cohortData);
      
      res.json(updatedCohort);
    } catch (error) {
      res.status(500).json({ message: "Error updating cohort" });
    }
  });

  app.delete("/api/cohorts/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const cohortId = parseInt(req.params.id);
      const cohort = await storage.getCohort(cohortId);
      
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      const result = await storage.deleteCohort(cohortId);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ message: "Error deleting cohort" });
    }
  });

  // Cohort Enrollment routes
  app.get("/api/cohorts/:cohortId/enrollments", async (req, res) => {
    try {
      const cohortId = parseInt(req.params.cohortId);
      const enrollments = await storage.getCohortEnrollmentsByCohort(cohortId);
      
      // For each enrollment, get the user details
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          const user = await storage.getUser(enrollment.userId);
          return {
            ...enrollment,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            } : null
          };
        })
      );
      
      res.json(enrichedEnrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cohort enrollments" });
    }
  });
  
  // Get all cohort enrollments (primarily for certificate searches by student ID)
  app.get("/api/cohort-enrollments", checkRole(["admin"]), async (req, res) => {
    try {
      const cohorts = await storage.getAllCohorts();
      let allEnrollments: any[] = [];
      
      for (const cohort of cohorts) {
        const enrollments = await storage.getCohortEnrollmentsByCohort(cohort.id);
        allEnrollments = [...allEnrollments, ...enrollments];
      }
      
      res.json(allEnrollments);
    } catch (error) {
      console.error("Error fetching all cohort enrollments:", error);
      res.status(500).json({ message: "Error fetching all cohort enrollments" });
    }
  });

  app.get("/api/users/:userId/cohort-enrollments", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = req.user as any;
      
      // Users can only view their own enrollments unless they're admin or teacher
      if (user.role === "student" && userId !== user.id) {
        return res.status(403).json({ message: "Not authorized to view these enrollments" });
      }
      
      const enrollments = await storage.getCohortEnrollmentsByUser(userId);
      
      // For each enrollment, get the cohort and course details
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          const cohort = await storage.getCohort(enrollment.cohortId);
          let course = null;
          
          if (cohort) {
            course = await storage.getCourse(cohort.courseId);
          }
          
          return {
            ...enrollment,
            cohort: cohort || null,
            course: course ? {
              id: course.id,
              title: course.title,
              type: course.type,
              description: course.description
            } : null
          };
        })
      );
      
      res.json(enrichedEnrollments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user cohort enrollments" });
    }
  });

  app.post("/api/cohort-enrollments", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const enrollmentData = insertCohortEnrollmentSchema.parse(req.body);
      
      // Verify the cohort exists
      const cohort = await storage.getCohort(enrollmentData.cohortId);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }
      
      // Course related checks - teacher can only enroll students in their own courses' cohorts
      if (req.user && (req.user as any).role === "teacher") {
        const course = await storage.getCourse(cohort.courseId);
        if (!course || course.teacherId !== (req.user as any).id) {
          return res.status(403).json({ message: "Not authorized to enroll students in this cohort" });
        }
      }
      
      // Verify the user exists
      const user = await storage.getUser(enrollmentData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the user is already enrolled in this cohort
      const existingEnrollments = await storage.getCohortEnrollmentsByUser(enrollmentData.userId);
      const alreadyEnrolled = existingEnrollments.some(e => e.cohortId === enrollmentData.cohortId);
      
      if (alreadyEnrolled) {
        return res.status(400).json({ message: "User is already enrolled in this cohort" });
      }
      
      const enrollment = await storage.createCohortEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/cohort-enrollments/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.getCohortEnrollment(enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Course related checks - teacher can only update enrollments for their own courses' cohorts
      if (req.user && (req.user as any).role === "teacher") {
        const cohort = await storage.getCohort(enrollment.cohortId);
        if (!cohort) {
          return res.status(404).json({ message: "Cohort not found" });
        }
        
        const course = await storage.getCourse(cohort.courseId);
        if (!course || course.teacherId !== (req.user as any).id) {
          return res.status(403).json({ message: "Not authorized to update this enrollment" });
        }
      }
      
      const enrollmentData = req.body;
      const updatedEnrollment = await storage.updateCohortEnrollment(enrollmentId, enrollmentData);
      
      res.json(updatedEnrollment);
    } catch (error) {
      res.status(500).json({ message: "Error updating enrollment" });
    }
  });

  app.delete("/api/cohort-enrollments/:id", checkRole(["admin", "teacher"]), async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.getCohortEnrollment(enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Course related checks - teacher can only delete enrollments for their own courses' cohorts
      if (req.user && (req.user as any).role === "teacher") {
        const cohort = await storage.getCohort(enrollment.cohortId);
        if (!cohort) {
          return res.status(404).json({ message: "Cohort not found" });
        }
        
        const course = await storage.getCourse(cohort.courseId);
        if (!course || course.teacherId !== (req.user as any).id) {
          return res.status(403).json({ message: "Not authorized to delete this enrollment" });
        }
      }
      
      const result = await storage.deleteCohortEnrollment(enrollmentId);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ message: "Error deleting enrollment" });
    }
  });
  
  // Alert routes
  app.get("/api/alerts/active", async (req, res) => {
    try {
      const activeAlerts = await storage.getActiveAlerts();
      res.json(activeAlerts);
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      res.status(500).json({ message: "Failed to fetch active alerts" });
    }
  });

  app.get("/api/alerts", checkRole(["admin"]), async (req, res) => {
    try {
      const alerts = await storage.getAllAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/active", async (req, res) => {
    try {
      const activeAlerts = await storage.getActiveAlerts();
      res.json(activeAlerts);
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      res.status(500).json({ message: "Failed to fetch active alerts" });
    }
  });

  app.get("/api/alerts/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const alertId = parseInt(req.params.id, 10);
      if (isNaN(alertId)) {
        return res.status(400).json({ message: "Invalid alert ID" });
      }
      
      const alert = await storage.getAlert(alertId);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error('Error fetching alert:', error);
      res.status(500).json({ message: "Failed to fetch alert" });
    }
  });

  app.post("/api/alerts", checkRole(["admin"]), async (req, res) => {
    try {
      // Extract actual data from the request - handle both { data: {...} } and direct format
      const dataToProcess = req.body.data || req.body;
      console.log('Received alert data:', { data: dataToProcess });
      
      // Validate request body against schema
      const alertData = insertAlertSchema.parse(dataToProcess);
      console.log('Parsed alert data:', alertData);
      
      const newAlert = await storage.createAlert(alertData);
      console.log('Created new alert:', newAlert);
      
      res.status(201).json(newAlert);
    } catch (error) {
      console.error('Error creating alert (detailed):', error);
      if (error.issues) {
        console.error('Validation issues:', JSON.stringify(error.issues, null, 2));
      }
      handleZodError(error, res);
    }
  });

  app.put("/api/alerts/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const alertId = parseInt(req.params.id, 10);
      if (isNaN(alertId)) {
        return res.status(400).json({ message: "Invalid alert ID" });
      }
      
      // Extract actual data from the request - handle both { data: {...} } and direct format
      const dataToProcess = req.body.data || req.body;
      console.log('Received alert update data:', { data: dataToProcess });
      
      // Get the existing alert to make sure it exists
      const existingAlert = await storage.getAlert(alertId);
      if (!existingAlert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      // Update the alert
      const updatedAlert = await storage.updateAlert(alertId, dataToProcess);
      res.json(updatedAlert);
    } catch (error) {
      console.error('Error updating alert:', error);
      res.status(500).json({ message: "Failed to update alert" });
    }
  });

  app.delete("/api/alerts/:id", checkRole(["admin"]), async (req, res) => {
    try {
      const alertId = parseInt(req.params.id, 10);
      if (isNaN(alertId)) {
        return res.status(400).json({ message: "Invalid alert ID" });
      }
      
      // Check if the alert exists
      const existingAlert = await storage.getAlert(alertId);
      if (!existingAlert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      // Delete the alert
      const success = await storage.deleteAlert(alertId);
      if (success) {
        res.status(204).send(); // No content response for successful deletion
      } else {
        res.status(500).json({ message: "Failed to delete alert" });
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      res.status(500).json({ message: "Failed to delete alert" });
    }
  });

  return httpServer;
}
