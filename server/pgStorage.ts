import { db } from './db';
import { eq, and, desc, asc, gte } from 'drizzle-orm';
import { 
  User, InsertUser, Course, InsertCourse, CourseSection, InsertCourseSection,
  CourseModule, InsertCourseModule, Payment, InsertPayment, Installment, InsertInstallment, 
  Enrollment, InsertEnrollment, Certificate, InsertCertificate, 
  Testimonial, InsertTestimonial, Product, InsertProduct,
  Partner, InsertPartner, Event, InsertEvent, LandingContent, InsertLandingContent,
  users, courses, courseSections, courseModules, payments, installments, enrollments, certificates, testimonials,
  products, partners, events, landingContent
} from '@shared/schema';
import { IStorage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db';

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
      dueDate: payment.dueDate || null,
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
      ...section,
      order: section.order || maxOrder + 1,
    };
    
    const result = await db.insert(courseSections).values(sectionToCreate).returning();
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
      
      const result = await db.insert(courseModules).values(moduleToCreate).returning();
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
}