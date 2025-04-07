import { db } from './db';
import { eq, and, desc, asc, gte, inArray } from 'drizzle-orm';
import { 
  User, InsertUser, Course, InsertCourse, CourseSection, InsertCourseSection,
  CourseModule, InsertCourseModule, Payment, InsertPayment, Installment, InsertInstallment, 
  Enrollment, InsertEnrollment, Certificate, InsertCertificate, 
  Testimonial, InsertTestimonial, Product, InsertProduct,
  Partner, InsertPartner, Event, InsertEvent, LandingContent, InsertLandingContent,
  Exam, InsertExam, ExamQuestion, InsertExamQuestion, ExamResult, InsertExamResult,
  Semester, InsertSemester, Cohort, InsertCohort, CohortEnrollment, InsertCohortEnrollment,
  Alert, InsertAlert, UserSession, InsertUserSession, UserLocationHistory, InsertUserLocationHistory,
  users, courses, courseSections, courseModules, payments, installments, enrollments, certificates, testimonials,
  products, partners, events, landingContent, exams, examQuestions, examResults,
  semesters, cohorts, cohortEnrollments, alerts, userSessions, userLocationHistory
} from '@shared/schema';
import { IStorage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db';
import { randomBytes } from 'crypto';
import { hashPassword } from './auth';

export class PgStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Default short name mapping for course types
    const courseTypeToShortName: Record<string, string> = {
      'multimedia': 'MULT',
      'accounting': 'ACCT',
      'marketing': 'MRKT',
      'development': 'DEV',
      'diploma': 'DIPL'
    };
    
    // Default to "THUB" if no preferred course is specified
    let courseShortName = "THUB";
    
    // If user has a preferred course, use that for the short name
    if (user.preferredCourse) {
      courseShortName = courseTypeToShortName[user.preferredCourse] || courseShortName;
    } else {
      try {
        // If no preferred course, try to get a course from database
        const allCourses = await db.select().from(courses);
        if (allCourses.length > 0) {
          const selectedCourse = allCourses[0];
          // Generate a short name from course title or type
          courseShortName = selectedCourse.title
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 4) || 
            courseTypeToShortName[selectedCourse.type] || 
            selectedCourse.type.toUpperCase().substring(0, 4);
        }
      } catch (error) {
        console.error("Error getting courses for user ID prefix:", error);
      }
    }
    
    // Generate a user ID using the course short name and a unique timestamp
    const userIdSuffix = Date.now().toString().substring(7);
    const userIdPrefix = `${courseShortName}-${userIdSuffix}`;
    
    const result = await db.insert(users).values({
      ...user,
      role: user.role || "student",
      phone: user.phone || null,
      preferredCourse: user.preferredCourse || null,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async createPasswordResetToken(email: string): Promise<string | null> {
    try {
      // Find user by email
      const user = await this.getUserByEmail(email);
      if (!user) {
        return null;
      }

      // Generate a secure random token
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour

      // Save token to user record
      await db.update(users)
        .set({
          resetToken,
          resetTokenExpiry
        })
        .where(eq(users.id, user.id));

      return resetToken;
    } catch (error) {
      console.error("Error creating password reset token:", error);
      return null;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    try {
      const now = new Date();
      const result = await db.select().from(users)
        .where(
          and(
            eq(users.resetToken, token),
            gte(users.resetTokenExpiry, now)
          )
        );
      return result[0];
    } catch (error) {
      console.error("Error finding user by reset token:", error);
      return undefined;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Find user with valid token
      const user = await this.getUserByResetToken(token);
      if (!user) {
        return false;
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password and clear reset token
      await db.update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        })
        .where(eq(users.id, user.id));

      return true;
    } catch (error) {
      console.error("Error resetting password:", error);
      return false;
    }
  }

  /**
   * Create verification code for user email verification
   * 
   * @param userId User ID
   * @returns Verification code
   */
  async createVerificationCode(userId: number): Promise<string> {
    try {
      // Generate a 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiration time (10 minutes from now)
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 10);
      
      // Update user with verification code
      await db.update(users)
        .set({
          verificationCode: verificationCode,
          verificationCodeExpiry: expiryTime
        })
        .where(eq(users.id, userId));
      
      return verificationCode;
    } catch (error) {
      console.error('Error creating verification code:', error);
      throw error;
    }
  }

  /**
   * Verify user email with verification code
   * 
   * @param userId User ID
   * @param code Verification code
   * @returns True if verification succeeded
   */
  async verifyEmail(userId: number, code: string): Promise<boolean> {
    try {
      // Find user
      const user = await this.getUser(userId);
      if (!user) {
        return false;
      }

      // Check code and expiration
      if (user.verificationCode !== code) {
        return false;
      }
      
      // Check if code has expired
      if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
        return false;
      }

      // Mark user as verified and clear verification code
      await db.update(users)
        .set({
          isVerified: true,
          verificationCode: null,
          verificationCodeExpiry: null
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error('Error verifying email:', error);
      return false;
    }
  }

  /**
   * Get user by verification code
   * 
   * @param code Verification code
   * @returns User if found and code is valid
   */
  async getUserByVerificationCode(code: string): Promise<User | undefined> {
    try {
      // Find user with matching verification code
      const result = await db.select().from(users).where(eq(users.verificationCode, code));
      const user = result[0];
      
      // Check if user exists and code hasn't expired
      if (user && user.verificationCodeExpiry && new Date() <= user.verificationCodeExpiry) {
        return user;
      }
      
      return undefined;
    } catch (error) {
      console.error('Error getting user by verification code:', error);
      return undefined;
    }
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.id, id));
    return result[0];
  }

  async getCoursesByType(type: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.type, type as any));
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const result = await db.insert(courses).values({
      ...course,
      status: course.status || "draft",
      imageUrl: course.imageUrl || null,
      teacherId: course.teacherId || null,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const result = await db.update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();
    return result[0];
  }

  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values({
      ...payment,
      status: payment.status || "pending",
      transactionId: payment.transactionId || null,
      numberOfInstallments: payment.numberOfInstallments || null,
      dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
      paymentDate: new Date()
    }).returning();
    return result[0];
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    const result = await db.update(payments)
      .set(paymentData)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  // Installment operations
  async getInstallment(id: number): Promise<Installment | undefined> {
    const result = await db.select().from(installments).where(eq(installments.id, id));
    return result[0];
  }

  async getInstallmentsByPayment(paymentId: number): Promise<Installment[]> {
    return await db.select().from(installments).where(eq(installments.paymentId, paymentId));
  }

  async createInstallment(installment: InsertInstallment): Promise<Installment> {
    const result = await db.insert(installments).values({
      ...installment,
      status: installment.status || "pending",
      transactionId: installment.transactionId || null,
      paymentDate: null,
      isPaid: installment.isPaid || false,
      installmentNumber: installment.installmentNumber || 1
    }).returning();
    return result[0];
  }

  async updateInstallment(id: number, installmentData: Partial<Installment>): Promise<Installment | undefined> {
    const result = await db.update(installments)
      .set(installmentData)
      .where(eq(installments.id, id))
      .returning();
    return result[0];
  }

  async getAllInstallments(): Promise<Installment[]> {
    return await db.select().from(installments);
  }

  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const result = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return result[0];
  }

  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const result = await db.insert(enrollments).values({
      ...enrollment,
      status: enrollment.status || "active",
      enrollmentDate: new Date(),
      completionDate: null
    }).returning();
    return result[0];
  }

  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const result = await db.update(enrollments)
      .set(enrollmentData)
      .where(eq(enrollments.id, id))
      .returning();
    return result[0];
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments);
  }

  // Certificate operations
  async getCertificate(id: number): Promise<Certificate | undefined> {
    const result = await db.select().from(certificates).where(eq(certificates.id, id));
    return result[0];
  }

  async getCertificateByUniqueId(certificateId: string): Promise<Certificate | undefined> {
    const result = await db.select().from(certificates).where(eq(certificates.certificateId, certificateId));
    return result[0];
  }

  async getCertificatesByUser(userId: number): Promise<Certificate[]> {
    return await db.select().from(certificates).where(eq(certificates.userId, userId));
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const result = await db.insert(certificates).values({
      ...certificate,
      certificateId: certificate.certificateId || uuidv4(),
      issueDate: new Date(),
      expiryDate: null
    }).returning();
    return result[0];
  }

  async updateCertificate(id: number, certificateData: Partial<Certificate>): Promise<Certificate | undefined> {
    const result = await db.update(certificates)
      .set(certificateData)
      .where(eq(certificates.id, id))
      .returning();
    return result[0];
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return await db.select().from(certificates);
  }

  async deleteCertificate(id: number): Promise<boolean> {
    try {
      const result = await db.delete(certificates)
        .where(eq(certificates.id, id))
        .returning({ id: certificates.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting certificate:", error);
      return false;
    }
  }

  // Testimonial operations
  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    const result = await db.select().from(testimonials).where(eq(testimonials.id, id));
    return result[0];
  }

  async getTestimonialsByUser(userId: number): Promise<Testimonial[]> {
    return await db.select().from(testimonials).where(eq(testimonials.userId, userId));
  }

  async getTestimonialsByCourse(courseId: number): Promise<Testimonial[]> {
    return await db.select().from(testimonials).where(eq(testimonials.courseId, courseId));
  }

  async getPublishedTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials).where(eq(testimonials.isPublished, true));
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const result = await db.insert(testimonials).values({
      ...testimonial,
      isPublished: testimonial.isPublished || false,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateTestimonial(id: number, testimonialData: Partial<Testimonial>): Promise<Testimonial | undefined> {
    const result = await db.update(testimonials)
      .set(testimonialData)
      .where(eq(testimonials.id, id))
      .returning();
    return result[0];
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async getProductsByType(type: string): Promise<Product[]> {
    // Cast the type to the enum to avoid type issues
    return await db.select()
      .from(products)
      .where(eq(products.type as any, type));
  }

  async getActiveProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values({
      ...product,
      isActive: product.isActive === undefined ? true : product.isActive,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const result = await db.update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  // Partner operations
  async getPartner(id: number): Promise<Partner | undefined> {
    const result = await db.select().from(partners).where(eq(partners.id, id));
    return result[0];
  }

  async getActivePartners(): Promise<Partner[]> {
    return await db.select().from(partners).where(eq(partners.isActive, true));
  }

  async getAllPartners(): Promise<Partner[]> {
    return await db.select().from(partners);
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const result = await db.insert(partners).values({
      ...partner,
      isActive: partner.isActive === undefined ? true : partner.isActive,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updatePartner(id: number, partnerData: Partial<Partner>): Promise<Partner | undefined> {
    const result = await db.update(partners)
      .set(partnerData)
      .where(eq(partners.id, id))
      .returning();
    return result[0];
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async getActiveEvents(): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.isActive, true));
  }

  async getUpcomingEvents(): Promise<Event[]> {
    return await db.select()
      .from(events)
      .where(
        and(
          eq(events.isActive, true),
          gte(events.date, new Date())
        )
      )
      .orderBy(asc(events.date));
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values({
      ...event,
      isActive: event.isActive === undefined ? true : event.isActive,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const result = await db.update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  // Landing Content operations
  async getLandingContent(id: number): Promise<LandingContent | undefined> {
    const result = await db.select().from(landingContent).where(eq(landingContent.id, id));
    return result[0];
  }

  async getLandingContentByType(type: string): Promise<LandingContent[]> {
    // Cast the type to the enum to avoid type issues
    return await db.select()
      .from(landingContent)
      .where(eq(landingContent.type as any, type))
      .orderBy(asc(landingContent.sortOrder));
  }

  async getActiveLandingContent(): Promise<LandingContent[]> {
    return await db.select()
      .from(landingContent)
      .where(eq(landingContent.isActive, true))
      .orderBy(asc(landingContent.sortOrder));
  }

  async getAllLandingContent(): Promise<LandingContent[]> {
    return await db.select().from(landingContent);
  }

  async createLandingContent(content: InsertLandingContent): Promise<LandingContent> {
    const result = await db.insert(landingContent).values({
      ...content,
      isActive: content.isActive === undefined ? true : content.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateLandingContent(id: number, contentData: Partial<LandingContent>): Promise<LandingContent | undefined> {
    const result = await db.update(landingContent)
      .set({
        ...contentData,
        updatedAt: new Date()
      })
      .where(eq(landingContent.id, id))
      .returning();
    return result[0];
  }

  // Course Sections operations
  async getCourseSections(courseId: number): Promise<CourseSection[]> {
    return await db.select().from(courseSections)
      .where(eq(courseSections.courseId, courseId))
      .orderBy(courseSections.order);
  }

  async getCourseSection(id: number): Promise<CourseSection | undefined> {
    const result = await db.select().from(courseSections).where(eq(courseSections.id, id));
    return result[0];
  }

  async createCourseSection(section: InsertCourseSection): Promise<CourseSection> {
    // Find the maximum order value for the course
    const existingSections = await this.getCourseSections(section.courseId);
    const maxOrder = existingSections.length > 0 
      ? Math.max(...existingSections.map(s => s.order)) 
      : 0;
    
    // Set the order to be one more than the current maximum
    const sectionToCreate = {
      title: section.title,
      courseId: section.courseId,
      moduleId: section.moduleId || null,
      semesterId: section.semesterId || null,
      description: section.description || null,
      duration: section.duration || null,
      unlockDate: section.unlockDate ? new Date(section.unlockDate) : null,
      order: section.order || maxOrder + 1,
      isPublished: section.isPublished !== undefined ? section.isPublished : true,
      type: section.type || 'lesson',
      videoUrl: section.videoUrl || null,
      contentUrl: section.contentUrl || null,
      content: section.content || null,
      contentType: section.contentType || null
    };
    
    const result = await db.insert(courseSections).values([sectionToCreate]).returning();
    return result[0];
  }

  async updateCourseSection(id: number, sectionData: Partial<CourseSection>): Promise<CourseSection | undefined> {
    const result = await db.update(courseSections)
      .set(sectionData)
      .where(eq(courseSections.id, id))
      .returning();
    return result[0];
  }

  async deleteCourseSection(id: number): Promise<boolean> {
    try {
      const result = await db.delete(courseSections)
        .where(eq(courseSections.id, id))
        .returning({ id: courseSections.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting course section:", error);
      return false;
    }
  }

  async getCourseModules(courseId: number): Promise<CourseModule[]> {
    try {
      return await db.select().from(courseModules)
        .where(eq(courseModules.courseId, courseId))
        .orderBy(courseModules.order);
    } catch (error) {
      console.error("Error fetching course modules:", error);
      return [];
    }
  }

  async getCourseModule(id: number): Promise<CourseModule | undefined> {
    try {
      const result = await db.select().from(courseModules)
        .where(eq(courseModules.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching course module:", error);
      return undefined;
    }
  }

  async createCourseModule(module: InsertCourseModule): Promise<CourseModule> {
    try {
      // Find the maximum order value for the course
      const existingModules = await this.getCourseModules(module.courseId);
      const maxOrder = existingModules.length > 0 
        ? Math.max(...existingModules.map(m => m.order)) 
        : 0;
      
      // Set the order to be one more than the current maximum
      const moduleToCreate = {
        ...module,
        order: module.order || maxOrder + 1,
      };
      
      const result = await db.insert(courseModules).values([moduleToCreate]).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating course module:", error);
      throw error;
    }
  }

  async updateCourseModule(id: number, moduleData: Partial<CourseModule>): Promise<CourseModule | undefined> {
    try {
      const result = await db.update(courseModules)
        .set(moduleData)
        .where(eq(courseModules.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating course module:", error);
      return undefined;
    }
  }

  async deleteCourseModule(id: number): Promise<boolean> {
    try {
      // First, delete all sections associated with this module
      await db.delete(courseSections)
        .where(eq(courseSections.moduleId, id));
      
      // Then delete the module itself
      const result = await db.delete(courseModules)
        .where(eq(courseModules.id, id))
        .returning({ id: courseModules.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting course module:", error);
      return false;
    }
  }

  // Implement deleteCourse that was used in routes but not defined
  async deleteCourse(id: number): Promise<boolean> {
    try {
      // First, delete all sections associated with this course
      await db.delete(courseSections)
        .where(eq(courseSections.courseId, id));
      
      // Delete all modules associated with this course
      await db.delete(courseModules)
        .where(eq(courseModules.courseId, id));
      
      // Then delete the course itself
      const result = await db.delete(courses)
        .where(eq(courses.id, id))
        .returning({ id: courses.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting course:", error);
      return false;
    }
  }

  // Exam operations
  async getExam(id: number): Promise<Exam | undefined> {
    const result = await db.select().from(exams).where(eq(exams.id, id));
    return result[0];
  }

  async getExamsByCourse(courseId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.courseId, courseId));
  }

  async getExamsBySection(sectionId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.sectionId, sectionId));
  }
  
  async getExamsByType(type: string): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.type as any, type));
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const result = await db.insert(exams).values({
      title: exam.title,
      description: exam.description,
      type: exam.type,
      courseId: exam.courseId,
      sectionId: exam.sectionId || null,
      semesterId: exam.semesterId || null,
      maxScore: exam.maxScore,
      passingScore: exam.passingScore,
      timeLimit: exam.timeLimit,
      status: exam.status || 'active',
      gradingMode: exam.gradingMode || 'auto', // Add gradingMode field
      availableFrom: exam.availableFrom ? new Date(exam.availableFrom) : null,
      availableTo: exam.availableTo ? new Date(exam.availableTo) : null,
      gradeAThreshold: exam.gradeAThreshold || 90,
      gradeBThreshold: exam.gradeBThreshold || 80,
      gradeCThreshold: exam.gradeCThreshold || 70,
      gradeDThreshold: exam.gradeDThreshold || 60,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam | undefined> {
    const result = await db.update(exams)
      .set(examData)
      .where(eq(exams.id, id))
      .returning();
    return result[0];
  }

  async deleteExam(id: number): Promise<boolean> {
    try {
      // First, delete all related exam questions
      await db.delete(examQuestions).where(eq(examQuestions.examId, id));
      
      // Then delete the exam
      const result = await db.delete(exams)
        .where(eq(exams.id, id))
        .returning({ id: exams.id });
        
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting exam:', error);
      return false;
    }
  }

  // Exam Question operations
  async getExamQuestion(id: number): Promise<ExamQuestion | undefined> {
    try {
      // Use direct SQL query to avoid schema mismatch issues
      const result = await pool.query(
        'SELECT * FROM exam_questions WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      
      // Transform database result to match our API format
      return {
        id: row.id,
        examId: row.exam_id,
        question: row.question_text,
        type: row.question_type,
        options: Array.isArray(row.options) ? row.options : [],
        correctAnswer: row.correct_answer,
        points: row.points,
        order: row.sort_order,
        explanation: row.explanation
      };
    } catch (error) {
      console.error("Error fetching exam question:", error);
      return undefined;
    }
  }

  async getExamQuestionsByExam(examId: number): Promise<ExamQuestion[]> {
    console.log(`Fetching questions for exam ID: ${examId}`);
    try {
      // Use direct SQL query to avoid schema mismatch issues
      const result = await pool.query(
        `SELECT * FROM exam_questions 
         WHERE exam_id = $1
         ORDER BY sort_order ASC`,
        [examId]
      );
      
      // Transform database result to match our API format
      const questions = result.rows.map(row => ({
        id: row.id,
        examId: row.exam_id,
        question: row.question_text,
        type: row.question_type,
        options: Array.isArray(row.options) ? row.options : [],
        correctAnswer: row.correct_answer,
        points: row.points,
        order: row.sort_order,
        explanation: row.explanation
      }));
      
      console.log(`Successfully retrieved ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error("Error fetching exam questions:", error);
      return [];
    }
  }

  async createExamQuestion(question: InsertExamQuestion): Promise<ExamQuestion> {
    try {
      console.log(`Creating exam question with data:`, JSON.stringify(question, null, 2));
      
      // For short_answer and essay types, correctAnswer can be optional
      let correctAnswer = question.correctAnswer;
      if ((question.type === 'short_answer' || question.type === 'essay') && !correctAnswer) {
        correctAnswer = ''; // Use empty string if not provided for these types
      }
      
      // Handle options field correctly
      let options: string[] = [];
      if (Array.isArray(question.options) && question.options.length > 0) {
        options = question.options;
      }
      
      // Insert using direct SQL query
      const result = await pool.query(
        `INSERT INTO exam_questions 
         (exam_id, question_text, question_type, options, correct_answer, points, sort_order, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          question.examId,
          question.question,
          question.type,
          JSON.stringify(options),
          correctAnswer,
          question.points || 1,
          question.order || 1,
          question.explanation || null
        ]
      );
      
      if (result.rows.length === 0) {
        throw new Error("Failed to create exam question");
      }
      
      const row = result.rows[0];
      
      // Transform the database result to match our API format
      const createdQuestion: ExamQuestion = {
        id: row.id,
        examId: row.exam_id,
        question: row.question_text,
        type: row.question_type,
        options: Array.isArray(row.options) ? row.options : [],
        correctAnswer: row.correct_answer,
        points: row.points,
        order: row.sort_order,
        explanation: row.explanation
      };
      
      console.log(`Created question with ID: ${createdQuestion.id}`);
      return createdQuestion;
    } catch (error) {
      console.error("Error creating exam question:", error);
      throw error;
    }
  }

  async updateExamQuestion(id: number, questionData: Partial<ExamQuestion>): Promise<ExamQuestion | undefined> {
    try {
      console.log(`Updating exam question ${id} with data:`, JSON.stringify(questionData, null, 2));
      
      // First get the current question to merge with updates
      const currentQuestion = await this.getExamQuestion(id);
      if (!currentQuestion) {
        console.log(`No question found with ID: ${id}`);
        return undefined;
      }
      
      // Extract and prepare data for the SQL query
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      // Create SET clause parts and collect values
      if (questionData.examId !== undefined) {
        updates.push(`exam_id = $${paramCount++}`);
        values.push(questionData.examId);
      }
      
      if (questionData.question !== undefined) {
        updates.push(`question_text = $${paramCount++}`);
        values.push(questionData.question);
      }
      
      if (questionData.type !== undefined) {
        updates.push(`question_type = $${paramCount++}`);
        values.push(questionData.type);
      }
      
      // For short_answer and essay questions, handle correctAnswer appropriately
      if (questionData.correctAnswer !== undefined) {
        updates.push(`correct_answer = $${paramCount++}`);
        
        if ((questionData.type === 'short_answer' || questionData.type === 'essay' || 
             currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && 
            !questionData.correctAnswer) {
          values.push('');
        } else {
          values.push(questionData.correctAnswer);
        }
      }
      
      // Handle options field
      if (questionData.options !== undefined) {
        updates.push(`options = $${paramCount++}`);
        
        if (Array.isArray(questionData.options) && questionData.options.length > 0) {
          values.push(JSON.stringify(questionData.options));
        } else {
          values.push('[]');
        }
      }
      
      if (questionData.points !== undefined) {
        updates.push(`points = $${paramCount++}`);
        values.push(questionData.points);
      }
      
      if (questionData.order !== undefined) {
        updates.push(`sort_order = $${paramCount++}`);
        values.push(questionData.order);
      }
      
      if (questionData.explanation !== undefined) {
        updates.push(`explanation = $${paramCount++}`);
        values.push(questionData.explanation);
      }
      
      // If no updates, return the current question
      if (updates.length === 0) {
        return currentQuestion;
      }
      
      // Add ID to values array for the WHERE clause
      values.push(id);
      
      // Build and execute the SQL query
      const query = `
        UPDATE exam_questions 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;
      
      console.log(`Executing SQL: ${query}`, values);
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      
      // Transform the database result to match our API format
      const updatedQuestion: ExamQuestion = {
        id: row.id,
        examId: row.exam_id,
        question: row.question_text,
        type: row.question_type,
        options: Array.isArray(row.options) ? row.options : [],
        correctAnswer: row.correct_answer,
        points: row.points,
        order: row.sort_order,
        explanation: row.explanation
      };
      
      console.log(`Updated question with ID: ${updatedQuestion.id}`);
      return updatedQuestion;
    } catch (error) {
      console.error("Error updating exam question:", error);
      return undefined;
    }
  }

  async deleteExamQuestion(id: number): Promise<boolean> {
    try {
      // Direct SQL query for deleting exam question
      const result = await pool.query(
        'DELETE FROM exam_questions WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting exam question:', error);
      return false;
    }
  }

  // Exam Result operations
  async getExamResult(id: number): Promise<ExamResult | undefined> {
    const result = await db.select().from(examResults).where(eq(examResults.id, id));
    return result[0];
  }

  async getExamResultsByExam(examId: number): Promise<ExamResult[]> {
    return await db.select().from(examResults).where(eq(examResults.examId, examId));
  }

  async getExamResultsByUser(userId: number): Promise<ExamResult[]> {
    return await db.select().from(examResults).where(eq(examResults.userId, userId));
  }
  
  async getExamResultsByCourse(courseId: number): Promise<ExamResult[]> {
    // First get all exams for this course
    const examsInCourse = await this.getExamsByCourse(courseId);
    const examIds = examsInCourse.map(exam => exam.id);
    
    if (examIds.length === 0) {
      return [];
    }
    
    // Then get results for those exams
    return await db.select()
      .from(examResults)
      .where(inArray(examResults.examId, examIds));
  }
  
  async getExamResultsByExamAndUser(examId: number, userId: number): Promise<ExamResult | undefined> {
    const result = await db.select()
      .from(examResults)
      .where(and(
        eq(examResults.examId, examId),
        eq(examResults.userId, userId)
      ));
    return result[0];
  }

  async createExamResult(result: InsertExamResult): Promise<ExamResult> {
    const examResult = await db.insert(examResults).values({
      ...result,
      submittedAt: new Date(),
      gradedAt: null
    }).returning();
    return examResult[0];
  }

  async updateExamResult(id: number, resultData: Partial<ExamResult>): Promise<ExamResult | undefined> {
    const updatedData: any = { ...resultData };
    if (resultData.gradedBy) {
      updatedData.gradedAt = new Date();
    }
    
    const result = await db.update(examResults)
      .set(updatedData)
      .where(eq(examResults.id, id))
      .returning();
    return result[0];
  }

  async gradeExamResult(id: number, score: number, grade: string, remarks?: string): Promise<ExamResult | undefined> {
    try {
      const result = await db.update(examResults)
        .set({
          score,
          grade: grade as any, // Type cast to satisfy TypeScript
          status: 'completed',
          gradedAt: new Date(),
          remarks: remarks || null
        })
        .where(eq(examResults.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error grading exam result:', error);
      return undefined;
    }
  }
  
  async deleteExamResult(id: number): Promise<boolean> {
    try {
      const result = await db.delete(examResults)
        .where(eq(examResults.id, id))
        .returning({ id: examResults.id });
        
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting exam result:', error);
      return false;
    }
  }
  
  // Exam operations that were missing
  async getAllExams(): Promise<Exam[]> {
    try {
      const result = await db.select().from(exams);
      return result;
    } catch (error) {
      console.error("Error in exam fetch logic:", error);
      return [];
    }
  }
  
  async getExamsBySemester(semesterId: number): Promise<Exam[]> {
    return await db.select()
      .from(exams)
      .where(eq(exams.semesterId, semesterId));
  }
  
  // Semester operations
  async getSemester(id: number): Promise<Semester | undefined> {
    const result = await db.select().from(semesters).where(eq(semesters.id, id));
    return result[0];
  }

  async getSemestersByCourse(courseId: number): Promise<Semester[]> {
    try {
      // Select only the columns that exist in the database
      const result = await db.query.semesters.findMany({
        where: eq(semesters.courseId, courseId),
        orderBy: asc(semesters.id),
        columns: {
          id: true,
          courseId: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          isActive: true
        }
      });
      return result;
    } catch (error) {
      console.error("Error fetching semesters:", error);
      return [];
    }
  }

  async getAllSemesters(): Promise<Semester[]> {
    return await db.select().from(semesters);
  }

  async createSemester(semester: InsertSemester): Promise<Semester> {
    const result = await db.insert(semesters).values({
      ...semester,
      startDate: new Date(semester.startDate),
      endDate: new Date(semester.endDate),
      isActive: semester.isActive !== undefined ? semester.isActive : true,
      order: semester.order || 1
    }).returning();
    return result[0];
  }

  async updateSemester(id: number, semesterData: Partial<Semester>): Promise<Semester | undefined> {
    try {
      const result = await db.update(semesters)
        .set(semesterData)
        .where(eq(semesters.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating semester:', error);
      return undefined;
    }
  }
  
  // Cohort operations
  async getCohort(id: number): Promise<Cohort | undefined> {
    const result = await db.select().from(cohorts).where(eq(cohorts.id, id));
    return result[0];
  }

  async getCohortsByCourse(courseId: number): Promise<Cohort[]> {
    return await db.select()
      .from(cohorts)
      .where(eq(cohorts.courseId, courseId));
  }

  async getAllCohorts(): Promise<Cohort[]> {
    return await db.select().from(cohorts);
  }

  async getActiveCohorts(): Promise<Cohort[]> {
    return await db.select()
      .from(cohorts)
      .where(eq(cohorts.status, 'active'));
  }

  async createCohort(cohort: InsertCohort): Promise<Cohort> {
    const result = await db.insert(cohorts).values({
      ...cohort,
      startDate: new Date(cohort.startDate),
      endDate: new Date(cohort.endDate),
      status: cohort.status || 'upcoming',
      maxStudents: cohort.maxStudents || null,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateCohort(id: number, cohortData: Partial<Cohort>): Promise<Cohort | undefined> {
    try {
      const result = await db.update(cohorts)
        .set(cohortData)
        .where(eq(cohorts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating cohort:', error);
      return undefined;
    }
  }

  async deleteCohort(id: number): Promise<boolean> {
    try {
      // First delete all enrollments for this cohort
      await db.delete(cohortEnrollments)
        .where(eq(cohortEnrollments.cohortId, id));
      
      // Then delete the cohort
      const result = await db.delete(cohorts)
        .where(eq(cohorts.id, id))
        .returning({ id: cohorts.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting cohort:', error);
      return false;
    }
  }
  
  // Cohort Enrollment operations
  async getCohortEnrollment(id: number): Promise<CohortEnrollment | undefined> {
    const result = await db.select().from(cohortEnrollments).where(eq(cohortEnrollments.id, id));
    return result[0];
  }

  async getCohortEnrollmentsByCohort(cohortId: number): Promise<CohortEnrollment[]> {
    return await db.select()
      .from(cohortEnrollments)
      .where(eq(cohortEnrollments.cohortId, cohortId));
  }

  async getCohortEnrollmentsByUser(userId: number): Promise<CohortEnrollment[]> {
    return await db.select()
      .from(cohortEnrollments)
      .where(eq(cohortEnrollments.userId, userId));
  }

  async createCohortEnrollment(enrollment: InsertCohortEnrollment): Promise<CohortEnrollment> {
    const result = await db.insert(cohortEnrollments).values({
      ...enrollment,
      enrollmentDate: new Date(),
      status: enrollment.status || 'active',
      studentId: enrollment.studentId || null
    }).returning();
    return result[0];
  }

  async updateCohortEnrollment(id: number, enrollmentData: Partial<CohortEnrollment>): Promise<CohortEnrollment | undefined> {
    try {
      const result = await db.update(cohortEnrollments)
        .set(enrollmentData)
        .where(eq(cohortEnrollments.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating cohort enrollment:', error);
      return undefined;
    }
  }

  async deleteCohortEnrollment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(cohortEnrollments)
        .where(eq(cohortEnrollments.id, id))
        .returning({ id: cohortEnrollments.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting cohort enrollment:', error);
      return false;
    }
  }

  // Alert operations
  async getAlert(id: number): Promise<Alert | undefined> {
    try {
      const result = await db.select().from(alerts).where(eq(alerts.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting alert:', error);
      return undefined;
    }
  }

  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const now = new Date();
      const allAlerts = await db.select().from(alerts).where(eq(alerts.isActive, true));
      
      // Filter alerts by date constraints
      const activeAlerts = allAlerts.filter(alert => {
        const hasValidStartDate = !alert.startDate || (alert.startDate && new Date(alert.startDate) <= now);
        const hasValidEndDate = !alert.endDate || (alert.endDate && new Date(alert.endDate) >= now);
        return hasValidStartDate && hasValidEndDate;
      });

      // Sort by priority (higher first) and then by created date (newest first)
      return activeAlerts.sort((a, b) => {
        if (a.priority === b.priority) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return b.priority - a.priority;
      });
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  async getAllAlerts(): Promise<Alert[]> {
    try {
      const result = await db.select().from(alerts)
        .orderBy(desc(alerts.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting all alerts:', error);
      return [];
    }
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    try {
      // Log the alert data received
      console.log('Creating alert with data:', alert);
      
      const result = await db.insert(alerts).values({
        title: alert.title,
        content: alert.content,
        type: alert.type,
        priority: alert.priority || 1,
        isActive: alert.isActive !== undefined ? alert.isActive : true,
        startDate: alert.startDate ? new Date(alert.startDate) : null,
        endDate: alert.endDate ? new Date(alert.endDate) : null,
        buttonText: alert.buttonText || null,
        buttonLink: alert.buttonLink || null, // Fixed: changed buttonUrl to buttonLink to match schema
        bgColor: alert.bgColor,
        textColor: alert.textColor,
        iconName: alert.iconName,
        dismissable: alert.dismissable,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log('Alert created successfully:', result[0]);
      return result[0];
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  async updateAlert(id: number, alertData: Partial<Alert>): Promise<Alert | undefined> {
    try {
      console.log('Updating alert with ID:', id, 'Data:', alertData);
      
      // Fix field names if needed - in case message is used instead of title/content
      const processedData = { ...alertData };
      
      // Ensure field names match the database schema
      if ('message' in processedData && !('content' in processedData)) {
        const message = processedData.message as string;
        processedData.content = message;
        delete processedData.message;
      }
      
      // Handle buttonUrl vs buttonLink consistency
      if ('buttonUrl' in processedData && !('buttonLink' in processedData)) {
        const buttonUrl = processedData.buttonUrl as string | null;
        processedData.buttonLink = buttonUrl;
        delete processedData.buttonUrl;
      }
      
      // Handle date conversions if strings are provided
      if (processedData.startDate && typeof processedData.startDate === 'string') {
        processedData.startDate = new Date(processedData.startDate);
      }
      if (processedData.endDate && typeof processedData.endDate === 'string') {
        processedData.endDate = new Date(processedData.endDate);
      }

      // Always update the updatedAt timestamp
      processedData.updatedAt = new Date();

      const result = await db.update(alerts)
        .set(processedData)
        .where(eq(alerts.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating alert:', error);
      return undefined;
    }
  }

  async deleteAlert(id: number): Promise<boolean> {
    try {
      const result = await db.delete(alerts)
        .where(eq(alerts.id, id))
        .returning({ id: alerts.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting alert:', error);
      return false;
    }
  }

  // User Session operations
  async getUserSession(id: number): Promise<UserSession | undefined> {
    try {
      const result = await db.select().from(userSessions).where(eq(userSessions.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting user session:", error);
      return undefined;
    }
  }

  async getUserSessionBySessionId(sessionId: string): Promise<UserSession | undefined> {
    try {
      const result = await db.select().from(userSessions).where(eq(userSessions.sessionId, sessionId));
      return result[0];
    } catch (error) {
      console.error("Error getting user session by session ID:", error);
      return undefined;
    }
  }

  async getUserSessions(userId: number): Promise<UserSession[]> {
    try {
      return await db.select().from(userSessions).where(eq(userSessions.userId, userId));
    } catch (error) {
      console.error("Error getting user sessions:", error);
      return [];
    }
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    try {
      const newSession = {
        ...session,
        lastActivity: new Date(),
        createdAt: new Date(),
        status: session.status || 'active'
      };
      
      const result = await db.insert(userSessions).values(newSession).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user session:", error);
      throw new Error("Failed to create user session");
    }
  }

  async updateUserSession(id: number, sessionData: Partial<UserSession>): Promise<UserSession | undefined> {
    try {
      const result = await db.update(userSessions)
        .set(sessionData)
        .where(eq(userSessions.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating user session:", error);
      return undefined;
    }
  }

  async updateUserSessionActivity(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getUserSessionBySessionId(sessionId);
      if (!session) return false;
      
      await db.update(userSessions)
        .set({ lastActivity: new Date() })
        .where(eq(userSessions.id, session.id));
      
      return true;
    } catch (error) {
      console.error("Error updating user session activity:", error);
      return false;
    }
  }

  async revokeUserSession(id: number, reason?: string): Promise<boolean> {
    try {
      const session = await this.getUserSession(id);
      if (!session) return false;
      
      await db.update(userSessions)
        .set({ 
          status: 'revoked',
          revocationReason: reason || 'Manual revocation'
        })
        .where(eq(userSessions.id, id));
      
      return true;
    } catch (error) {
      console.error("Error revoking user session:", error);
      return false;
    }
  }

  async revokeAllUserSessions(userId: number, exceptSessionId?: string): Promise<boolean> {
    try {
      // Get all user sessions
      const userSessions = await this.getUserSessions(userId);
      if (userSessions.length === 0) return false;
      
      // Filter out the current session if exceptSessionId is provided
      const sessionsToRevoke = exceptSessionId 
        ? userSessions.filter(session => session.sessionId !== exceptSessionId)
        : userSessions;
      
      if (sessionsToRevoke.length === 0) return true; // No sessions to revoke
      
      // Get session IDs to revoke
      const sessionIds = sessionsToRevoke.map(session => session.id);
      
      // Revoke all sessions in one update
      await db.update(userSessions)
        .set({ 
          status: 'revoked',
          revocationReason: 'Revoked as part of revoking all sessions'
        })
        .where(inArray(userSessions.id, sessionIds));
      
      return true;
    } catch (error) {
      console.error("Error revoking all user sessions:", error);
      return false;
    }
  }

  async getActiveSessions(userId: number): Promise<UserSession[]> {
    try {
      return await db.select().from(userSessions)
        .where(and(
          eq(userSessions.userId, userId),
          eq(userSessions.status, 'active')
        ));
    } catch (error) {
      console.error("Error getting active sessions:", error);
      return [];
    }
  }

  async getSuspiciousSessions(): Promise<UserSession[]> {
    try {
      return await db.select().from(userSessions)
        .where(eq(userSessions.status, 'suspicious'));
    } catch (error) {
      console.error("Error getting suspicious sessions:", error);
      return [];
    }
  }

  // User Location History operations
  async getUserLocationHistory(id: number): Promise<UserLocationHistory | undefined> {
    try {
      const result = await db.select().from(userLocationHistory)
        .where(eq(userLocationHistory.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting user location history:", error);
      return undefined;
    }
  }

  async getUserLocationsByUser(userId: number): Promise<UserLocationHistory[]> {
    try {
      return await db.select().from(userLocationHistory)
        .where(eq(userLocationHistory.userId, userId));
    } catch (error) {
      console.error("Error getting user locations by user:", error);
      return [];
    }
  }

  async getUserLocationsBySession(sessionId: number): Promise<UserLocationHistory[]> {
    try {
      return await db.select().from(userLocationHistory)
        .where(eq(userLocationHistory.sessionId, sessionId));
    } catch (error) {
      console.error("Error getting user locations by session:", error);
      return [];
    }
  }

  async createUserLocation(location: InsertUserLocationHistory): Promise<UserLocationHistory> {
    try {
      const newLocation = {
        ...location,
        createdAt: new Date(),
        isSuspicious: location.isSuspicious || false,
      };
      
      const result = await db.insert(userLocationHistory).values(newLocation).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user location:", error);
      throw new Error("Failed to create user location");
    }
  }

  async getSuspiciousLocations(): Promise<UserLocationHistory[]> {
    try {
      return await db.select().from(userLocationHistory)
        .where(eq(userLocationHistory.isSuspicious, true));
    } catch (error) {
      console.error("Error getting suspicious locations:", error);
      return [];
    }
  }

  async markLocationAsSuspicious(id: number): Promise<boolean> {
    try {
      const location = await this.getUserLocationHistory(id);
      if (!location) return false;
      
      // Mark location as suspicious
      await db.update(userLocationHistory)
        .set({ isSuspicious: true })
        .where(eq(userLocationHistory.id, id));
      
      // Also mark the associated session as suspicious
      await db.update(userSessions)
        .set({ status: 'suspicious' })
        .where(eq(userSessions.id, location.sessionId));
      
      return true;
    } catch (error) {
      console.error("Error marking location as suspicious:", error);
      return false;
    }
  }
}