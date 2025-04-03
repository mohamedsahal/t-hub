import {
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  payments, type Payment, type InsertPayment,
  installments, type Installment, type InsertInstallment,
  enrollments, type Enrollment, type InsertEnrollment,
  certificates, type Certificate, type InsertCertificate,
  testimonials, type Testimonial, type InsertTestimonial
} from "@shared/schema";
import session from "express-session";

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByType(type: string): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  
  // Payment operations
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  getAllPayments(): Promise<Payment[]>;
  
  // Installment operations
  getInstallment(id: number): Promise<Installment | undefined>;
  getInstallmentsByPayment(paymentId: number): Promise<Installment[]>;
  createInstallment(installment: InsertInstallment): Promise<Installment>;
  updateInstallment(id: number, installment: Partial<Installment>): Promise<Installment | undefined>;
  getAllInstallments(): Promise<Installment[]>;
  
  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined>;
  getAllEnrollments(): Promise<Enrollment[]>;
  
  // Certificate operations
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificateByUniqueId(certificateId: string): Promise<Certificate | undefined>;
  getCertificatesByUser(userId: number): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  
  // Testimonial operations
  getTestimonial(id: number): Promise<Testimonial | undefined>;
  getTestimonialsByUser(userId: number): Promise<Testimonial[]>;
  getTestimonialsByCourse(courseId: number): Promise<Testimonial[]>;
  getPublishedTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: number, testimonial: Partial<Testimonial>): Promise<Testimonial | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private payments: Map<number, Payment>;
  private installments: Map<number, Installment>;
  private enrollments: Map<number, Enrollment>;
  private certificates: Map<number, Certificate>;
  private testimonials: Map<number, Testimonial>;
  
  private userIdCounter: number;
  private courseIdCounter: number;
  private paymentIdCounter: number;
  private installmentIdCounter: number;
  private enrollmentIdCounter: number;
  private certificateIdCounter: number;
  private testimonialIdCounter: number;
  
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.payments = new Map();
    this.installments = new Map();
    this.enrollments = new Map();
    this.certificates = new Map();
    this.testimonials = new Map();
    
    this.userIdCounter = 1;
    this.courseIdCounter = 1;
    this.paymentIdCounter = 1;
    this.installmentIdCounter = 1;
    this.enrollmentIdCounter = 1;
    this.certificateIdCounter = 1;
    this.testimonialIdCounter = 1;
    
    // Create the memory store for sessions
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Initialize with some sample data
    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    this.createUser({
      name: "Admin User",
      email: "admin@t-hub.so",
      password: "admin123",
      role: "admin",
      phone: "+2525251111"
    });

    // Create teacher user
    this.createUser({
      name: "Teacher User",
      email: "teacher@t-hub.so",
      password: "teacher123",
      role: "teacher",
      phone: "+2525251112"
    });

    // Create student user
    this.createUser({
      name: "Student User",
      email: "student@t-hub.so",
      password: "student123",
      role: "student",
      phone: "+2525251113"
    });

    // Create some courses
    this.createCourse({
      title: "Photoshop for Graphic Designers",
      description: "Learn professional graphic design skills with Adobe Photoshop. Master selection tools, layer management, filters, and design principles.",
      type: "multimedia",
      duration: 8,
      price: 120,
      status: "published",
      imageUrl: "https://images.unsplash.com/photo-1587440871875-191322ee64b0",
      teacherId: 2
    });

    this.createCourse({
      title: "QuickBooks Accounting",
      description: "Master QuickBooks for small business accounting. Set up company files, manage customers and vendors, reconcile accounts, and generate reports.",
      type: "accounting",
      duration: 6,
      price: 90,
      status: "published",
      imageUrl: "https://images.unsplash.com/photo-1566837945700-30057527ade0",
      teacherId: 2
    });

    this.createCourse({
      title: "Full Stack Web Development",
      description: "Comprehensive 24-week bootcamp covering MERN stack development with AI integration. Project-based learning with real-world applications.",
      type: "development",
      duration: 24,
      price: 1200,
      status: "published",
      imageUrl: "https://images.unsplash.com/photo-1543286386-713bdd548da4",
      teacherId: 2
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    let foundUser: User | undefined = undefined;
    this.users.forEach(user => {
      if (user.email === email) {
        foundUser = user;
      }
    });
    return foundUser;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = {
      ...user,
      id,
      role: user.role || "student",
      phone: user.phone || null,
      createdAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    if (!this.users.has(id)) return false;
    return this.users.delete(id);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByType(type: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.type === type);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const newCourse: Course = {
      ...course,
      id,
      status: course.status || "draft",
      imageUrl: course.imageUrl || null,
      teacherId: course.teacherId || null,
      createdAt: new Date()
    };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...courseData };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.userId === userId);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const newPayment: Payment = {
      ...payment,
      id,
      paymentDate: new Date(),
      status: payment.status || "pending",
      transactionId: payment.transactionId || null,
      numberOfInstallments: payment.numberOfInstallments || null,
      dueDate: payment.dueDate || null
    };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...paymentData };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  // Installment operations
  async getInstallment(id: number): Promise<Installment | undefined> {
    return this.installments.get(id);
  }

  async getInstallmentsByPayment(paymentId: number): Promise<Installment[]> {
    return Array.from(this.installments.values()).filter(installment => installment.paymentId === paymentId);
  }

  async createInstallment(installment: InsertInstallment): Promise<Installment> {
    const id = this.installmentIdCounter++;
    const newInstallment: Installment = {
      ...installment,
      id,
      status: installment.status || "pending",
      transactionId: installment.transactionId || null,
      paymentDate: null,
      isPaid: installment.isPaid || false,
      installmentNumber: installment.installmentNumber || 1
    };
    this.installments.set(id, newInstallment);
    return newInstallment;
  }

  async updateInstallment(id: number, installmentData: Partial<Installment>): Promise<Installment | undefined> {
    const installment = this.installments.get(id);
    if (!installment) return undefined;
    
    const updatedInstallment = { ...installment, ...installmentData };
    this.installments.set(id, updatedInstallment);
    return updatedInstallment;
  }
  
  async getAllInstallments(): Promise<Installment[]> {
    return Array.from(this.installments.values());
  }

  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(enrollment => enrollment.userId === userId);
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(enrollment => enrollment.courseId === courseId);
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentIdCounter++;
    const newEnrollment: Enrollment = {
      ...enrollment,
      id,
      status: enrollment.status || "active",
      enrollmentDate: new Date(),
      completionDate: null
    };
    this.enrollments.set(id, newEnrollment);
    return newEnrollment;
  }

  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...enrollmentData };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }
  
  async getAllEnrollments(): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values());
  }

  // Certificate operations
  async getCertificate(id: number): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }

  async getCertificateByUniqueId(certificateId: string): Promise<Certificate | undefined> {
    let foundCertificate: Certificate | undefined = undefined;
    this.certificates.forEach(certificate => {
      if (certificate.certificateId === certificateId) {
        foundCertificate = certificate;
      }
    });
    return foundCertificate;
  }

  async getCertificatesByUser(userId: number): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).filter(certificate => certificate.userId === userId);
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const id = this.certificateIdCounter++;
    const newCertificate: Certificate = {
      ...certificate,
      id,
      issueDate: new Date(),
      expiryDate: null
    };
    this.certificates.set(id, newCertificate);
    return newCertificate;
  }

  // Testimonial operations
  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    return this.testimonials.get(id);
  }

  async getTestimonialsByUser(userId: number): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values()).filter(testimonial => testimonial.userId === userId);
  }

  async getTestimonialsByCourse(courseId: number): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values()).filter(testimonial => testimonial.courseId === courseId);
  }

  async getPublishedTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values()).filter(testimonial => testimonial.isPublished);
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.testimonialIdCounter++;
    const newTestimonial: Testimonial = {
      ...testimonial,
      id,
      isPublished: testimonial.isPublished || false,
      createdAt: new Date()
    };
    this.testimonials.set(id, newTestimonial);
    return newTestimonial;
  }

  async updateTestimonial(id: number, testimonialData: Partial<Testimonial>): Promise<Testimonial | undefined> {
    const testimonial = this.testimonials.get(id);
    if (!testimonial) return undefined;
    
    const updatedTestimonial = { ...testimonial, ...testimonialData };
    this.testimonials.set(id, updatedTestimonial);
    return updatedTestimonial;
  }
}

import { PgStorage } from './pgStorage';

// Choose storage implementation based on environment
// By default, use PostgreSQL storage for persistent data
export const storage: IStorage = new PgStorage();
