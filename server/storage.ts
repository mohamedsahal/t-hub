import {
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  payments, type Payment, type InsertPayment,
  installments, type Installment, type InsertInstallment,
  enrollments, type Enrollment, type InsertEnrollment,
  certificates, type Certificate, type InsertCertificate,
  testimonials, type Testimonial, type InsertTestimonial
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
  
  // Installment operations
  getInstallment(id: number): Promise<Installment | undefined>;
  getInstallmentsByPayment(paymentId: number): Promise<Installment[]>;
  createInstallment(installment: InsertInstallment): Promise<Installment>;
  updateInstallment(id: number, installment: Partial<Installment>): Promise<Installment | undefined>;
  
  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined>;
  
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
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
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
      paymentDate: new Date()
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
      paymentDate: undefined
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
      enrollmentDate: new Date(),
      completionDate: undefined
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

  // Certificate operations
  async getCertificate(id: number): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }

  async getCertificateByUniqueId(certificateId: string): Promise<Certificate | undefined> {
    for (const certificate of this.certificates.values()) {
      if (certificate.certificateId === certificateId) {
        return certificate;
      }
    }
    return undefined;
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
      expiryDate: undefined
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

export const storage = new MemStorage();
