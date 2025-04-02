import { db } from './db';
import { 
  User, InsertUser, Course, InsertCourse, 
  Payment, InsertPayment, Installment, InsertInstallment, 
  Enrollment, InsertEnrollment, Certificate, InsertCertificate, 
  Testimonial, InsertTestimonial,
  users, courses, payments, installments, enrollments, certificates, testimonials
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { IStorage } from './storage';
import { v4 as uuidv4 } from 'uuid';

export class PgStorage implements IStorage {
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
    const result = await db.insert(users).values({
      ...user,
      role: user.role || "student",
      phone: user.phone || null,
      createdAt: new Date()
    }).returning();
    return result[0];
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
}