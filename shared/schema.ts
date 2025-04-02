import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, uniqueIndex, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum definitions
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student']);
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived']);
export const courseTypeEnum = pgEnum('course_type', ['multimedia', 'accounting', 'marketing', 'development', 'diploma']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed']);
export const paymentTypeEnum = pgEnum('payment_type', ['one_time', 'installment']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'dropped']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('student'),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
});

// Installments table
export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id).notNull(),
  amount: doublePrecision("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  transactionId: text("transaction_id"),
  paymentDate: timestamp("payment_date"),
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

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, paymentDate: true });
export const insertInstallmentSchema = createInsertSchema(installments).omit({ id: true, paymentDate: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrollmentDate: true, completionDate: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issueDate: true, expiryDate: true });
export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, createdAt: true });

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
