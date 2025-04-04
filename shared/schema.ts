import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, uniqueIndex, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum definitions
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student']);
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived']);
export const courseTypeEnum = pgEnum('course_type', ['short', 'specialist', 'bootcamp', 'diploma']);
export const courseCategoryEnum = pgEnum('course_category', ['multimedia', 'accounting', 'marketing', 'development', 'programming', 'design', 'business', 'data_science']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed']);
export const paymentTypeEnum = pgEnum('payment_type', ['one_time', 'installment', 'subscription']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'dropped']);
export const examTypeEnum = pgEnum('exam_type', ['quiz', 'midterm', 'final', 're_exam', 'assignment', 'project', 'practical']);
export const examStatusEnum = pgEnum('exam_status', ['pending', 'completed', 'failed', 'passed']);
export const gradeEnum = pgEnum('grade', ['A', 'B', 'C', 'D', 'F', 'incomplete', 'not_graded']);
export const sectionTypeEnum = pgEnum('section_type', ['lesson', 'quiz', 'exam']);
export const lessonContentTypeEnum = pgEnum('lesson_content_type', ['text', 'video']);
export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'true_false', 'short_answer', 'essay']);
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
  category: courseCategoryEnum("category").notNull(),
  shortName: text("short_name").notNull(), // For student ID prefixes
  duration: integer("duration").notNull(), // in weeks
  price: doublePrecision("price").notNull(),
  status: courseStatusEnum("status").notNull().default('draft'),
  imageUrl: text("image_url"),
  teacherId: integer("teacher_id").references(() => users.id),
  isHasExams: boolean("is_has_exams").default(true).notNull(),
  examPassingGrade: integer("exam_passing_grade").default(60), // Percentage needed to pass
  hasSemesters: boolean("has_semesters").default(false).notNull(), // For diploma courses
  numberOfSemesters: integer("number_of_semesters").default(1), // For diploma courses
  isDripping: boolean("is_dripping").default(false).notNull(), // If content is released over time
  hasOnlineSessions: boolean("has_online_sessions").default(false).notNull(), // For bootcamps
  hasCertificate: boolean("has_certificate").default(true).notNull(), // Whether this course awards a certificate
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Semesters table (for diploma courses)
export const semesters = pgTable("semesters", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  name: text("name").notNull(), // e.g., "Semester 1" or "Spring 2023"
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  price: doublePrecision("price").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  order: integer("order").default(1).notNull(), // Sequence within the course
});

// Course Modules (groups of sections)
export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  semesterId: integer("semester_id").references(() => semesters.id), // Optional, for diploma courses
  title: varchar("title").notNull(),
  description: text("description"),
  order: integer("sort_order").default(1).notNull(),
  duration: integer("duration"), // Duration in hours
  unlockDate: timestamp("unlock_date"), // For dripping content
  isPublished: boolean("is_published").default(true),
});

// Course Sections (parts of a module, can be lessons, quizzes, or exams)
export const courseSections = pgTable("course_sections", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  moduleId: integer("module_id").references(() => courseModules.id), // Reference to parent module
  semesterId: integer("semester_id").references(() => semesters.id), // Optional, for diploma courses
  title: varchar("title").notNull(),
  description: text("description"),
  order: integer("sort_order").default(1).notNull(),
  type: sectionTypeEnum("type").default('lesson').notNull(), // Can be lesson, quiz, or exam
  contentType: lessonContentTypeEnum("content_type"), // Type of content (text or video)
  content: text("content"), // For text-based lessons
  videoUrl: text("video_url"), // For video-based lessons
  contentUrl: text("content_url"), // For additional materials
  duration: integer("duration"), // Duration in hours
  unlockDate: timestamp("unlock_date"), // For dripping content
  isPublished: boolean("is_published").default(true),
});

// Exams table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  sectionId: integer("section_id").references(() => courseSections.id), // Optional, for section-specific exams
  semesterId: integer("semester_id").references(() => semesters.id), // Optional, for semester-specific exams
  title: text("title").notNull(),
  description: text("description"),
  type: examTypeEnum("type").notNull(),
  totalPoints: integer("total_points").notNull(),
  passingPoints: integer("passing_points").notNull(),
  duration: integer("duration").notNull(), // in minutes
  isActive: boolean("is_active").default(true).notNull(),
  // Grading scale thresholds (percentage required for each grade)
  gradeAThreshold: integer("grade_a_threshold").default(90),
  gradeBThreshold: integer("grade_b_threshold").default(80),
  gradeCThreshold: integer("grade_c_threshold").default(70),
  gradeDThreshold: integer("grade_d_threshold").default(60),
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exam Questions
export const examQuestions = pgTable("exam_questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  question: text("question").notNull(),
  type: questionTypeEnum("type").default('multiple_choice').notNull(),
  options: text("options").array(), // Multiple choice options
  correctAnswer: text("correct_answer").notNull(),
  points: integer("points").notNull().default(1),
  order: integer("order").default(1).notNull(),
  explanation: text("explanation"), // Explanation for the correct answer
});

// Student Exam Results
export const examResults = pgTable("exam_results", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  score: integer("score").notNull(),
  status: examStatusEnum("status").notNull(),
  grade: gradeEnum("grade").default('not_graded'), // A, B, C, D, F grading
  remarks: text("remarks"), // Additional comments by the grader
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  attemptNumber: integer("attempt_number").default(1).notNull(),
  answers: text("answers").array(), // Student's answers
  feedback: text("feedback"),
  gradedBy: integer("graded_by").references(() => users.id), // Teacher/admin who graded
  gradedAt: timestamp("graded_at"),
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
export const insertSemesterSchema = createInsertSchema(semesters).omit({ id: true });
export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true });
export const insertCourseSectionSchema = createInsertSchema(courseSections)
  .omit({ id: true })
  .extend({
    description: z.string().optional().nullable(),
    contentType: z.enum(["text", "video"]).optional().nullable(),
    content: z.string().optional().nullable(),
    videoUrl: z.string().optional().nullable(),
    contentUrl: z.string().optional().nullable(),
    duration: z.number().optional().nullable(),
    unlockDate: z.string().optional().nullable()
  });
export const insertExamSchema = createInsertSchema(exams)
  .omit({ id: true, createdAt: true })
  .extend({
    description: z.string().optional().nullable(),
    sectionId: z.number().optional().nullable(),
    semesterId: z.number().optional().nullable(),
    availableFrom: z.string().optional().nullable(),
    availableTo: z.string().optional().nullable(),
    gradeAThreshold: z.number().optional().default(90),
    gradeBThreshold: z.number().optional().default(80),
    gradeCThreshold: z.number().optional().default(70),
    gradeDThreshold: z.number().optional().default(60),
  });
export const insertExamQuestionSchema = createInsertSchema(examQuestions)
  .omit({ id: true })
  .extend({
    explanation: z.string().optional().nullable(),
    options: z.array(z.string()).optional().nullable(),
  });
export const insertExamResultSchema = createInsertSchema(examResults)
  .omit({ id: true, submittedAt: true, gradedAt: true })
  .extend({
    grade: z.enum(['A', 'B', 'C', 'D', 'F', 'incomplete', 'not_graded']).optional().default('not_graded'),
    remarks: z.string().optional().nullable(),
    feedback: z.string().optional().nullable(),
  });
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

export type Semester = typeof semesters.$inferSelect;
export type InsertSemester = z.infer<typeof insertSemesterSchema>;

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;

export type CourseSection = typeof courseSections.$inferSelect;
export type InsertCourseSection = z.infer<typeof insertCourseSectionSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type ExamQuestion = typeof examQuestions.$inferSelect;
export type InsertExamQuestion = z.infer<typeof insertExamQuestionSchema>;

export type ExamResult = typeof examResults.$inferSelect;
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;

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
  semesters: many(semesters),
  modules: many(courseModules),
  sections: many(courseSections),
  exams: many(exams),
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

// Relations for new tables
export const semestersRelations = relations(semesters, ({ one, many }) => ({
  course: one(courses, {
    fields: [semesters.courseId],
    references: [courses.id]
  }),
  sections: many(courseSections),
  exams: many(exams)
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseModules.courseId],
    references: [courses.id]
  }),
  sections: many(courseSections),
}));

export const courseSectionsRelations = relations(courseSections, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseSections.courseId],
    references: [courses.id]
  }),
  module: one(courseModules, {
    fields: [courseSections.moduleId],
    references: [courseModules.id]
  }),
  semester: one(semesters, {
    fields: [courseSections.semesterId],
    references: [semesters.id]
  }),
  exams: many(exams)
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  course: one(courses, {
    fields: [exams.courseId],
    references: [courses.id]
  }),
  section: one(courseSections, {
    fields: [exams.sectionId],
    references: [courseSections.id]
  }),
  semester: one(semesters, {
    fields: [exams.semesterId],
    references: [semesters.id]
  }),
  questions: many(examQuestions),
  results: many(examResults)
}));

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  exam: one(exams, {
    fields: [examQuestions.examId],
    references: [exams.id]
  })
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  exam: one(exams, {
    fields: [examResults.examId],
    references: [exams.id]
  }),
  user: one(users, {
    fields: [examResults.userId],
    references: [users.id]
  }),
  gradedByUser: one(users, {
    fields: [examResults.gradedBy],
    references: [users.id]
  })
}));
