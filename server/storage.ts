import {
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  courseSections, type CourseSection, type InsertCourseSection,
  payments, type Payment, type InsertPayment,
  installments, type Installment, type InsertInstallment,
  enrollments, type Enrollment, type InsertEnrollment,
  certificates, type Certificate, type InsertCertificate,
  testimonials, type Testimonial, type InsertTestimonial,
  products, type Product, type InsertProduct,
  partners, type Partner, type InsertPartner,
  events, type Event, type InsertEvent,
  landingContent, type LandingContent, type InsertLandingContent
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
  deleteCourse(id: number): Promise<boolean>;
  
  // Course Sections operations
  getCourseSections(courseId: number): Promise<CourseSection[]>;
  getCourseSection(id: number): Promise<CourseSection | undefined>;
  createCourseSection(section: InsertCourseSection): Promise<CourseSection>;
  updateCourseSection(id: number, section: Partial<CourseSection>): Promise<CourseSection | undefined>;
  deleteCourseSection(id: number): Promise<boolean>;
  
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
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByType(type: string): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  
  // Partner operations
  getPartner(id: number): Promise<Partner | undefined>;
  getActivePartners(): Promise<Partner[]>;
  getAllPartners(): Promise<Partner[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: number, partner: Partial<Partner>): Promise<Partner | undefined>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getActiveEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  
  // Landing Content operations
  getLandingContent(id: number): Promise<LandingContent | undefined>;
  getLandingContentByType(type: string): Promise<LandingContent[]>;
  getActiveLandingContent(): Promise<LandingContent[]>;
  getAllLandingContent(): Promise<LandingContent[]>;
  createLandingContent(content: InsertLandingContent): Promise<LandingContent>;
  updateLandingContent(id: number, content: Partial<LandingContent>): Promise<LandingContent | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private courseSections: Map<number, CourseSection>;
  private payments: Map<number, Payment>;
  private installments: Map<number, Installment>;
  private enrollments: Map<number, Enrollment>;
  private certificates: Map<number, Certificate>;
  private testimonials: Map<number, Testimonial>;
  private products: Map<number, Product>;
  private partners: Map<number, Partner>;
  private events: Map<number, Event>;
  private landingContents: Map<number, LandingContent>;
  
  private userIdCounter: number;
  private courseIdCounter: number;
  private courseSectionIdCounter: number;
  private paymentIdCounter: number;
  private installmentIdCounter: number;
  private enrollmentIdCounter: number;
  private certificateIdCounter: number;
  private testimonialIdCounter: number;
  private productIdCounter: number;
  private partnerIdCounter: number;
  private eventIdCounter: number;
  private landingContentIdCounter: number;
  
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.courseSections = new Map();
    this.payments = new Map();
    this.installments = new Map();
    this.enrollments = new Map();
    this.certificates = new Map();
    this.testimonials = new Map();
    this.products = new Map();
    this.partners = new Map();
    this.events = new Map();
    this.landingContents = new Map();
    
    this.userIdCounter = 1;
    this.courseIdCounter = 1;
    this.courseSectionIdCounter = 1;
    this.paymentIdCounter = 1;
    this.installmentIdCounter = 1;
    this.enrollmentIdCounter = 1;
    this.certificateIdCounter = 1;
    this.testimonialIdCounter = 1;
    this.productIdCounter = 1;
    this.partnerIdCounter = 1;
    this.eventIdCounter = 1;
    this.landingContentIdCounter = 1;
    
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
      type: "short_course",
      category: "multimedia",
      shortName: "PS",
      duration: 8,
      price: 120,
      status: "published",
      imageUrl: "https://images.unsplash.com/photo-1587440871875-191322ee64b0",
      teacherId: 2,
      isHasExams: false,
      hasCertificate: true,
      hasOnlineSessions: false
    });

    this.createCourse({
      title: "QuickBooks Accounting",
      description: "Master QuickBooks for small business accounting. Set up company files, manage customers and vendors, reconcile accounts, and generate reports.",
      type: "short_course",
      category: "accounting",
      shortName: "QB",
      duration: 6,
      price: 90,
      status: "published",
      imageUrl: "https://images.unsplash.com/photo-1566837945700-30057527ade0",
      teacherId: 2,
      isHasExams: false,
      hasCertificate: true,
      hasOnlineSessions: false
    });

    this.createCourse({
      title: "Full Stack Web Development",
      description: "Comprehensive 24-week bootcamp covering MERN stack development with AI integration. Project-based learning with real-world applications.",
      type: "bootcamp",
      category: "development",
      shortName: "FSWD",
      duration: 24,
      price: 1200,
      status: "published",
      imageUrl: "https://images.unsplash.com/photo-1543286386-713bdd548da4",
      teacherId: 2,
      isHasExams: true,
      hasCertificate: true,
      hasOnlineSessions: true
    });

    // Create SaaS products
    this.createProduct({
      name: "T-Hub POS System",
      description: "Complete point-of-sale solution for retail businesses with inventory management and sales analytics.",
      type: "shop",
      price: 49.99,
      features: ["Inventory tracking", "Customer management", "Receipt printing", "Sales reports", "Cloud backup"],
      demoUrl: "https://pos-demo.thub.so",
      isActive: true
    });

    this.createProduct({
      name: "T-Hub School Management",
      description: "Comprehensive school management system for educational institutions of all sizes.",
      type: "school",
      price: 199.99,
      features: ["Student records", "Attendance tracking", "Grade management", "Fee collection", "Parent portal"],
      demoUrl: "https://school-demo.thub.so",
      isActive: true
    });

    this.createProduct({
      name: "T-Hub Accounting Software",
      description: "Financial management solution for small to medium businesses with integrated payroll.",
      type: "shop", // Changed from "accounting" to a valid enum value
      price: 79.99,
      features: ["General ledger", "Accounts payable/receivable", "Financial reporting", "Tax preparation", "Multi-currency support"],
      demoUrl: "https://accounting-demo.thub.so",
      isActive: true
    });

    // Create partners
    this.createPartner({
      name: "Hormuud Telecom",
      description: "Leading telecommunications company in Somalia providing mobile, internet, and financial services.",
      logoUrl: "https://example.com/hormuud-logo.png",
      websiteUrl: "https://hormuud.com",
      isActive: true
    });

    this.createPartner({
      name: "Somali Chamber of Commerce",
      description: "Official chamber of commerce supporting business growth and development in Somalia.",
      logoUrl: "https://example.com/scci-logo.png",
      websiteUrl: "https://somalichamber.so",
      isActive: true
    });

    this.createPartner({
      name: "University of Somalia",
      description: "Premier educational institution offering degree programs in business, technology, and healthcare.",
      logoUrl: "https://example.com/uniso-logo.png",
      websiteUrl: "https://uniso.edu.so",
      isActive: true
    });

    // Create events
    this.createEvent({
      title: "Tech Innovation Summit 2025",
      description: "Annual technology conference showcasing the latest innovations in tech and entrepreneurship in East Africa.",
      date: new Date(2025, 5, 15), // June 15, 2025
      location: "Mogadishu, Somalia",
      imageUrl: "https://example.com/tech-summit.jpg",
      isActive: true
    });

    this.createEvent({
      title: "Digital Skills Workshop",
      description: "Hands-on workshop for developing essential digital skills for the modern workplace.",
      date: new Date(2025, 4, 10), // May 10, 2025
      location: "T-Hub Training Center, Mogadishu",
      imageUrl: "https://example.com/digital-workshop.jpg",
      isActive: true
    });

    this.createEvent({
      title: "Entrepreneurship Bootcamp",
      description: "Intensive three-day bootcamp for aspiring entrepreneurs to develop business ideas and pitch to investors.",
      date: new Date(2025, 7, 22), // August 22, 2025
      location: "Business Innovation Hub, Hargeisa",
      imageUrl: "https://example.com/bootcamp.jpg",
      isActive: true
    });

    // Create landing content
    this.createLandingContent({
      type: "hero",
      title: "Transform Your Future with T-Hub",
      content: "Quality education and professional training for the digital economy",
      imageUrl: "https://example.com/hero-image.jpg",
      buttonText: "Explore Courses",
      buttonUrl: "/courses",
      isActive: true,
      sortOrder: 1
    });

    this.createLandingContent({
      type: "feature",
      title: "Expert-Led Courses",
      content: "Learn from industry professionals with real-world experience",
      imageUrl: "https://example.com/expert-led.jpg",
      isActive: true,
      sortOrder: 1
    });

    this.createLandingContent({
      type: "feature",
      title: "Flexible Learning",
      content: "Study at your own pace with online and in-person options",
      imageUrl: "https://example.com/flexible-learning.jpg",
      isActive: true,
      sortOrder: 2
    });

    this.createLandingContent({
      type: "feature",
      title: "Industry-Recognized Certificates",
      content: "Earn credentials valued by employers across industries",
      imageUrl: "https://example.com/certificates.jpg",
      isActive: true,
      sortOrder: 3
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
      preferredCourse: user.preferredCourse || null,
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
      id,
      title: course.title,
      description: course.description,
      type: course.type,
      category: course.category,
      shortName: course.shortName,
      price: course.price,
      duration: course.duration || 0,
      imageUrl: course.imageUrl || null,
      status: course.status || "draft",
      teacherId: course.teacherId || null,
      createdAt: new Date(),
      hasCertificate: course.hasCertificate || false,
      isHasExams: course.isHasExams || false,
      hasOnlineSessions: course.hasOnlineSessions || false,
      examPassingGrade: course.examPassingGrade || 60,
      hasSemesters: course.hasSemesters || false,
      numberOfSemesters: course.numberOfSemesters || 1,
      isDripping: course.isDripping || false
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
  
  async deleteCourse(id: number): Promise<boolean> {
    if (!this.courses.has(id)) return false;
    return this.courses.delete(id);
  }
  
  // Course Sections operations
  
  async getCourseSections(courseId: number): Promise<CourseSection[]> {
    const sections: CourseSection[] = [];
    this.courseSections.forEach(section => {
      if (section.courseId === courseId) {
        sections.push(section);
      }
    });
    return sections.sort((a, b) => a.order - b.order);
  }
  
  async getCourseSection(id: number): Promise<CourseSection | undefined> {
    return this.courseSections.get(id);
  }
  
  async createCourseSection(section: InsertCourseSection): Promise<CourseSection> {
    // Find the maximum order value for the course
    const existingSections = await this.getCourseSections(section.courseId);
    const maxOrder = existingSections.length > 0 
      ? Math.max(...existingSections.map(s => s.order)) 
      : 0;
    
    const id = this.courseSectionIdCounter++;
    const newSection: CourseSection = {
      id,
      title: section.title,
      description: section.description || null,
      courseId: section.courseId,
      semesterId: section.semesterId || null,
      duration: section.duration || null,
      unlockDate: section.unlockDate || null,
      order: section.order || maxOrder + 1,
      videoUrl: section.videoUrl || null,
      contentUrl: section.contentUrl || null,
      isPublished: section.isPublished !== undefined ? section.isPublished : true
    };
    
    this.courseSections.set(id, newSection);
    return newSection;
  }
  
  async updateCourseSection(id: number, sectionData: Partial<CourseSection>): Promise<CourseSection | undefined> {
    const section = this.courseSections.get(id);
    if (!section) return undefined;
    
    const updatedSection = { ...section, ...sectionData };
    this.courseSections.set(id, updatedSection);
    return updatedSection;
  }
  
  async deleteCourseSection(id: number): Promise<boolean> {
    if (!this.courseSections.has(id)) return false;
    return this.courseSections.delete(id);
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

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByType(type: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.type === type);
  }

  async getActiveProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isActive);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const newProduct: Product = {
      id,
      name: product.name,
      description: product.description,
      type: product.type,
      price: product.price || null,
      features: product.features || [],
      imageUrl: product.imageUrl || null,
      demoUrl: product.demoUrl || null,
      isActive: product.isActive ?? true,
      createdAt: new Date()
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  // Partner operations
  async getPartner(id: number): Promise<Partner | undefined> {
    return this.partners.get(id);
  }

  async getActivePartners(): Promise<Partner[]> {
    return Array.from(this.partners.values()).filter(partner => partner.isActive);
  }

  async getAllPartners(): Promise<Partner[]> {
    return Array.from(this.partners.values());
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const id = this.partnerIdCounter++;
    const newPartner: Partner = {
      id,
      name: partner.name,
      description: partner.description || null,
      logoUrl: partner.logoUrl || null,
      websiteUrl: partner.websiteUrl || null,
      isActive: partner.isActive ?? true,
      createdAt: new Date()
    };
    this.partners.set(id, newPartner);
    return newPartner;
  }

  async updatePartner(id: number, partnerData: Partial<Partner>): Promise<Partner | undefined> {
    const partner = this.partners.get(id);
    if (!partner) return undefined;
    
    const updatedPartner = { ...partner, ...partnerData };
    this.partners.set(id, updatedPartner);
    return updatedPartner;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getActiveEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => event.isActive);
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    return Array.from(this.events.values())
      .filter(event => event.isActive && event.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const newEvent = {
      ...event,
      id,
      isActive: event.isActive ?? true,
      imageUrl: event.imageUrl ?? null,
      createdAt: new Date()
    } as Event;
    this.events.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  // Landing Content operations
  async getLandingContent(id: number): Promise<LandingContent | undefined> {
    return this.landingContents.get(id);
  }

  async getLandingContentByType(type: string): Promise<LandingContent[]> {
    return Array.from(this.landingContents.values())
      .filter(content => content.type === type)
      .sort((a, b) => {
        const orderA = a.sortOrder ?? 0;
        const orderB = b.sortOrder ?? 0;
        return orderA - orderB;
      });
  }

  async getActiveLandingContent(): Promise<LandingContent[]> {
    return Array.from(this.landingContents.values())
      .filter(content => content.isActive)
      .sort((a, b) => {
        const orderA = a.sortOrder ?? 0;
        const orderB = b.sortOrder ?? 0;
        return orderA - orderB;
      });
  }

  async getAllLandingContent(): Promise<LandingContent[]> {
    return Array.from(this.landingContents.values());
  }

  async createLandingContent(content: InsertLandingContent): Promise<LandingContent> {
    const id = this.landingContentIdCounter++;
    const newContent: LandingContent = {
      id,
      type: content.type,
      title: content.title || null,
      subtitle: content.subtitle || null,
      content: content.content || null,
      imageUrl: content.imageUrl || null,
      buttonText: content.buttonText || null,
      buttonUrl: content.buttonUrl || null,
      sortOrder: content.sortOrder || 0,
      isActive: content.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.landingContents.set(id, newContent);
    return newContent;
  }

  async updateLandingContent(id: number, contentData: Partial<LandingContent>): Promise<LandingContent | undefined> {
    const content = this.landingContents.get(id);
    if (!content) return undefined;
    
    const updatedContent = { 
      ...content, 
      ...contentData,
      updatedAt: new Date()
    };
    this.landingContents.set(id, updatedContent);
    return updatedContent;
  }
}

import { PgStorage } from './pgStorage';

// Choose storage implementation based on environment
// By default, use PostgreSQL storage for persistent data
export const storage: IStorage = new PgStorage();
