import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, uniqueIndex, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum definitions
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student']);
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived']);
export const courseTypeEnum = pgEnum('course_type', ['multimedia', 'accounting', 'marketing', 'development', 'diploma']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed']);
export const paymentTypeEnum = pgEnum('payment_type', ['one_time', 'installment']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'dropped']);
export const productTypeEnum = pgEnum('product_type', [
  'restaurant', 'school', 'laundry', 'inventory', 
  'task', 'hotel', 'hospital', 'dental', 
  'realestate', 'travel', 'shop', 'custom'
]);
export const contentTypeEnum = pgEnum('content_type', ['hero', 'about', 'feature', 'testimonial', 'event', 'partner', 'contact']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('student'),
  phone: text("phone"),
  preferredCourse: courseTypeEnum("preferred_course"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations will be added after all tables are defined

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: courseTypeEnum("type").notNull(),
  duration: integer("duration").notNull(), // in weeks
  price: doublePrecision("price").notNull(),
  status: courseStatusEnum("status").notNull().default('draft'),
  imageUrl: text("image_url"),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  amount: doublePrecision("amount").notNull(),
  type: paymentTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  transactionId: text("transaction_id"),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  numberOfInstallments: integer("number_of_installments").default(1),
  dueDate: timestamp("due_date"),
});

// Enum for installment status
export const installmentStatusEnum = pgEnum('installment_status', ['pending', 'completed', 'failed']);

// Installments table
export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id).notNull(),
  amount: doublePrecision("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  transactionId: text("transaction_id"),
  paymentDate: timestamp("payment_date"),
  installmentNumber: integer("installment_number").notNull().default(1),
  status: installmentStatusEnum("status").notNull().default('pending'),
});

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  status: enrollmentStatusEnum("status").notNull().default('active'),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  completionDate: timestamp("completion_date"),
});

// Certificates table
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  certificateId: varchar("certificate_id", { length: 20 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"),
});

// Testimonials table
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SaaS Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: productTypeEnum("type").notNull(),
  price: doublePrecision("price"),
  features: text("features").array(),
  imageUrl: text("image_url"),
  demoUrl: text("demo_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Partner Universities table
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Landing Page Content table
export const landingContent = pgTable("landing_content", {
  id: serial("id").primaryKey(),
  type: contentTypeEnum("type").notNull(),
  title: text("title"),
  subtitle: text("subtitle"),
  content: text("content"),
  imageUrl: text("image_url"),
  buttonText: text("button_text"),
  buttonUrl: text("button_url"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, paymentDate: true });
export const insertInstallmentSchema = createInsertSchema(installments).omit({ id: true, paymentDate: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrollmentDate: true, completionDate: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issueDate: true, expiryDate: true });
export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertPartnerSchema = createInsertSchema(partners).omit({ id: true, createdAt: true });
export const insertLandingContentSchema = createInsertSchema(landingContent).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Installment = typeof installments.$inferSelect;
export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;

export type LandingContent = typeof landingContent.$inferSelect;
export type InsertLandingContent = z.infer<typeof insertLandingContentSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Define relationships between tables
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses, { relationName: "teacher_courses" }),
  payments: many(payments),
  enrollments: many(enrollments),
  certificates: many(certificates),
  testimonials: many(testimonials),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
    relationName: "teacher_courses"
  }),
  payments: many(payments),
  enrollments: many(enrollments),
  certificates: many(certificates),
  testimonials: many(testimonials),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id]
  }),
  course: one(courses, {
    fields: [payments.courseId],
    references: [courses.id]
  }),
  installments: many(installments)
}));

export const installmentsRelations = relations(installments, ({ one }) => ({
  payment: one(payments, {
    fields: [installments.paymentId],
    references: [payments.id]
  })
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id]
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id]
  })
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, {
    fields: [certificates.userId],
    references: [users.id]
  }),
  course: one(courses, {
    fields: [certificates.courseId],
    references: [courses.id]
  })
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  user: one(users, {
    fields: [testimonials.userId],
    references: [users.id]
  }),
  course: one(courses, {
    fields: [testimonials.courseId],
    references: [courses.id]
  })
}));
