import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, uniqueIndex, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { AchievementCategory, AchievementTier } from "./achievements";

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
export const sectionTypeEnum = pgEnum('section_type', ['lesson', 'exam']);
export const lessonContentTypeEnum = pgEnum('lesson_content_type', ['text', 'video']);
export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'true_false', 'short_answer', 'essay']);
export const productTypeEnum = pgEnum('product_type', [
  'restaurant', 'school', 'laundry', 'inventory', 
  'task', 'hotel', 'hospital', 'dental', 
  'realestate', 'travel', 'shop', 'custom',
  'specialist_program'
]);
export const contentTypeEnum = pgEnum('content_type', ['hero', 'about', 'feature', 'testimonial', 'event', 'partner', 'contact']);
export const cohortStatusEnum = pgEnum('cohort_status', ['active', 'completed', 'upcoming']);
export const alertTypeEnum = pgEnum('alert_type', ['discount', 'registration', 'celebration', 'announcement', 'info']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'inactive', 'revoked', 'suspicious']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('student'),
  phone: text("phone"),
  preferredCourse: courseTypeEnum("preferred_course"),
  resetToken: text("reset_token"), // Password reset token
  resetTokenExpiry: timestamp("reset_token_expiry"), // Token expiration
  verificationCode: text("verification_code"), // Email verification code
  verificationCodeExpiry: timestamp("verification_code_expiry"), // Code expiration time
  isVerified: boolean("is_verified").default(false).notNull(), // Whether email is verified
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

// Course Sections (parts of a module, can be lessons or exams)
export const courseSections = pgTable("course_sections", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  moduleId: integer("module_id").references(() => courseModules.id), // Reference to parent module
  semesterId: integer("semester_id").references(() => semesters.id), // Optional, for diploma courses
  title: varchar("title").notNull(),
  description: text("description"),
  order: integer("sort_order").default(1).notNull(),
  type: sectionTypeEnum("type").default('lesson').notNull(), // Can be lesson or exam
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
  maxScore: integer("max_score").notNull(),
  passingScore: integer("passing_score").notNull(),
  timeLimit: integer("time_limit").notNull(), // in minutes
  status: text("status").default('active').notNull(),
  // Automatic or manual grading mode
  gradingMode: text("grading_mode").default('auto').notNull(), // 'auto' or 'manual'
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
  question: text("question_text").notNull(), // Column name in DB is question_text
  type: questionTypeEnum("question_type").default('multiple_choice').notNull(), // Column name in DB is question_type
  options: text("options").array(), // Multiple choice options - actual column is jsonb, will need conversion
  correctAnswer: text("correct_answer").notNull(),
  points: integer("points").notNull().default(1),
  order: integer("sort_order").default(1).notNull(), // Column name in DB is sort_order
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
  // WaafiPay specific fields
  paymentGateway: text("payment_gateway").default('waafipay'),
  paymentMethod: text("payment_method"), // 'card', 'mobile_wallet', etc.
  walletType: text("wallet_type"), // 'WAAFI', 'ZAAD', 'EVCPlus', 'SAHAL', etc.
  customerPhone: text("customer_phone"), // Required for mobile wallet payments
  gatewayResponse: text("gateway_response"), // Raw response from WaafiPay
  refundStatus: text("refund_status"),
  redirectUrl: text("redirect_url"), // For HPP integration
  callbackUrl: text("callback_url"), // For webhook callbacks
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
  progressPercentage: integer("progress_percentage").default(0),
});

// User course progress tracking
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  sectionId: integer("section_id").references(() => courseSections.id).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completionDate: timestamp("completion_date"),
  timeSpent: integer("time_spent").default(0), // in seconds
  lastPosition: integer("last_position").default(0), // for video position tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// Cohorts/Batches table
export const cohorts = pgTable("cohorts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Batch 2025", "Cohort 12"
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: cohortStatusEnum("status").default('upcoming').notNull(),
  maxStudents: integer("max_students"),
  academicYear: text("academic_year").notNull(), // e.g., "2025-2026"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cohort Enrollments table
export const cohortEnrollments = pgTable("cohort_enrollments", {
  id: serial("id").primaryKey(),
  cohortId: integer("cohort_id").references(() => cohorts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  status: enrollmentStatusEnum("status").default('active').notNull(),
  studentId: text("student_id"), // Custom student ID in the format PREFIX-YEAR-NUMBER
});

// Specialist Programs table
export const specialistPrograms = pgTable("specialist_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // A short code for the program, e.g., "WEBDEV"
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(), // Package price (usually less than sum of individual courses)
  duration: integer("duration").notNull(), // in weeks
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  hasDiscounted: boolean("has_discounted").default(false),
  discountedPrice: doublePrecision("discounted_price"),
  discountExpiryDate: timestamp("discount_expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Specialist Program Courses junction table
export const specialistProgramCourses = pgTable("specialist_program_courses", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => specialistPrograms.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  order: integer("order").default(1).notNull(), // The order in which courses should be taken
  isRequired: boolean("is_required").default(true).notNull(), // Whether this course is required for program completion
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Specialist Program Enrollments
export const specialistProgramEnrollments = pgTable("specialist_program_enrollments", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => specialistPrograms.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: enrollmentStatusEnum("status").default('active').notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  completionDate: timestamp("completion_date"),
  paymentId: integer("payment_id"), // Optional link to a payment
});

// Achievement category and tier enums
export const achievementCategoryEnum = pgEnum('achievement_category', Object.values(AchievementCategory) as [string, ...string[]]);
export const achievementTierEnum = pgEnum('achievement_tier', Object.values(AchievementTier) as [string, ...string[]]);

// User Achievements table - tracks which achievements a user has earned
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: text("achievement_id").notNull(), // References the achievement ID from shared/achievements.ts
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  progress: integer("progress").default(0), // For tracking partial progress toward an achievement
  isNotified: boolean("is_notified").default(false), // Whether user has been notified
  metadata: text("metadata"), // Any additional data associated with this achievement
});

// User Achievement Progress tracking for achievements that need incremental progress
export const achievementProgress = pgTable("achievement_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: text("achievement_id").notNull(), // References the achievement ID from shared/achievements.ts
  currentValue: integer("current_value").default(0).notNull(), // Current progress value
  targetValue: integer("target_value").notNull(), // Target to reach
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  metadata: text("metadata"), // Additional tracking data if needed
});

// User Achievement Points - for leaderboard purposes
export const achievementPoints = pgTable("achievement_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalPoints: integer("total_points").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Alerts/Notifications table
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: alertTypeEnum("type").default('announcement').notNull(),
  bgColor: text("bg_color").default('#3cb878'), // Default brand primary color
  textColor: text("text_color").default('#ffffff'),
  iconName: text("icon_name").default('megaphone'), // lucide-react icon name
  buttonText: text("button_text"),
  buttonLink: text("button_link"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  dismissable: boolean("dismissable").default(true).notNull(), // Can be closed by user
  priority: integer("priority").default(0).notNull(), // Higher priority shows first
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  verificationCode: true, 
  verificationCodeExpiry: true, 
  isVerified: true 
});
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertSemesterSchema = createInsertSchema(semesters).omit({ id: true });
export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true });
export const insertCourseSectionSchema = createInsertSchema(courseSections)
  .omit({ id: true })
  .extend({
    description: z.string().optional().nullable(),
    type: z.enum(["lesson", "exam"]).default("lesson"),
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
    gradingMode: z.enum(['auto', 'manual']).default('auto'),
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
export const insertCohortSchema = createInsertSchema(cohorts)
  .omit({ id: true, createdAt: true })
  .extend({
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
  });
export const insertCohortEnrollmentSchema = createInsertSchema(cohortEnrollments).omit({ id: true, enrollmentDate: true });

// Specialist Program Schemas
export const insertSpecialistProgramSchema = createInsertSchema(specialistPrograms)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    discountExpiryDate: z.string().or(z.date()).optional().nullable(),
  });

export const insertSpecialistProgramCourseSchema = createInsertSchema(specialistProgramCourses)
  .omit({ id: true, createdAt: true });

export const insertSpecialistProgramEnrollmentSchema = createInsertSchema(specialistProgramEnrollments)
  .omit({ id: true, enrollmentDate: true, completionDate: true });
  
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    startDate: z.string().or(z.date()).optional().nullable(),
    endDate: z.string().or(z.date()).optional().nullable(),
    buttonText: z.string().optional().nullable(),
    buttonLink: z.string().optional().nullable(),
  });
  
// Achievement schemas
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, earnedAt: true });
export const insertAchievementProgressSchema = createInsertSchema(achievementProgress).omit({ id: true, lastUpdated: true });
export const insertAchievementPointsSchema = createInsertSchema(achievementPoints).omit({ id: true, lastUpdated: true });

// User Progress Schema
export const insertUserProgressSchema = createInsertSchema(userProgress)
  .omit({ id: true, completionDate: true, createdAt: true })
  .extend({
    lastPosition: z.number().optional().default(0),
    timeSpent: z.number().optional().default(0),
  });

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

export type Cohort = typeof cohorts.$inferSelect;
export type InsertCohort = z.infer<typeof insertCohortSchema>;

export type CohortEnrollment = typeof cohortEnrollments.$inferSelect;
export type InsertCohortEnrollment = z.infer<typeof insertCohortEnrollmentSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Specialist Program Types
export type SpecialistProgram = typeof specialistPrograms.$inferSelect;
export type InsertSpecialistProgram = z.infer<typeof insertSpecialistProgramSchema>;

export type SpecialistProgramCourse = typeof specialistProgramCourses.$inferSelect;
export type InsertSpecialistProgramCourse = z.infer<typeof insertSpecialistProgramCourseSchema>;

export type SpecialistProgramEnrollment = typeof specialistProgramEnrollments.$inferSelect;
export type InsertSpecialistProgramEnrollment = z.infer<typeof insertSpecialistProgramEnrollmentSchema>;

// Achievement Types
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type AchievementProgress = typeof achievementProgress.$inferSelect;
export type InsertAchievementProgress = z.infer<typeof insertAchievementProgressSchema>;

export type AchievementPoints = typeof achievementPoints.$inferSelect;
export type InsertAchievementPoints = z.infer<typeof insertAchievementPointsSchema>;

// User Progress Types
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

// User Sessions and Device Tracking
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id").notNull().unique(), // Express session ID
  deviceInfo: text("device_info"), // User agent, platform, etc.
  ipAddress: text("ip_address"),
  location: text("location"), // Geographic location based on IP
  status: sessionStatusEnum("status").default('active').notNull(),
  isMobile: boolean("is_mobile").default(false),
  browserName: text("browser_name"),
  browserVersion: text("browser_version"),
  osName: text("os_name"),
  osVersion: text("os_version"),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // When the session expires
  revocationReason: text("revocation_reason"), // Reason if status is 'revoked'
});

// Location tracking for suspicious activities
export const userLocationHistory = pgTable("user_location_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: integer("session_id").references(() => userSessions.id).notNull(),
  ipAddress: text("ip_address").notNull(),
  countryCode: text("country_code"),
  countryName: text("country_name"),
  regionName: text("region_name"),
  city: text("city"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isSuspicious: boolean("is_suspicious").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for user sessions
export const userSessionsRelations = relations(userSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
  locationHistory: many(userLocationHistory),
}));

// Relations for location history
export const userLocationHistoryRelations = relations(userLocationHistory, ({ one }) => ({
  user: one(users, {
    fields: [userLocationHistory.userId],
    references: [users.id],
  }),
  session: one(userSessions, {
    fields: [userLocationHistory.sessionId],
    references: [userSessions.id],
  }),
}));

// Types for user sessions
export type UserSession = typeof userSessions.$inferSelect;
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({ id: true });
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type UserLocationHistory = typeof userLocationHistory.$inferSelect;
export const insertUserLocationHistorySchema = createInsertSchema(userLocationHistory).omit({ id: true });
export type InsertUserLocationHistory = z.infer<typeof insertUserLocationHistorySchema>;

// Define relationships between tables
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses, { relationName: "teacher_courses" }),
  payments: many(payments),
  enrollments: many(enrollments),
  certificates: many(certificates),
  testimonials: many(testimonials),
  sessions: many(userSessions),
  locationHistory: many(userLocationHistory),
  programEnrollments: many(specialistProgramEnrollments),
  achievements: many(userAchievements),
  achievementProgress: many(achievementProgress),
  achievementPoints: many(achievementPoints),
  progress: many(userProgress),
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
  specialistPrograms: many(specialistProgramCourses),
  progress: many(userProgress),
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
  exams: many(exams),
  progress: many(userProgress)
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

// Cohort relations
export const cohortsRelations = relations(cohorts, ({ one, many }) => ({
  course: one(courses, {
    fields: [cohorts.courseId],
    references: [courses.id]
  }),
  enrollments: many(cohortEnrollments)
}));

export const cohortEnrollmentsRelations = relations(cohortEnrollments, ({ one }) => ({
  cohort: one(cohorts, {
    fields: [cohortEnrollments.cohortId],
    references: [cohorts.id]
  }),
  user: one(users, {
    fields: [cohortEnrollments.userId],
    references: [users.id]
  })
}));

// Specialist Program Relations
export const specialistProgramsRelations = relations(specialistPrograms, ({ many }) => ({
  courses: many(specialistProgramCourses),
  enrollments: many(specialistProgramEnrollments)
}));

export const specialistProgramCoursesRelations = relations(specialistProgramCourses, ({ one }) => ({
  program: one(specialistPrograms, {
    fields: [specialistProgramCourses.programId],
    references: [specialistPrograms.id]
  }),
  course: one(courses, {
    fields: [specialistProgramCourses.courseId],
    references: [courses.id]
  })
}));

export const specialistProgramEnrollmentsRelations = relations(specialistProgramEnrollments, ({ one }) => ({
  program: one(specialistPrograms, {
    fields: [specialistProgramEnrollments.programId],
    references: [specialistPrograms.id]
  }),
  user: one(users, {
    fields: [specialistProgramEnrollments.userId],
    references: [users.id]
  })
}));

// Achievement relations
export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id]
  })
}));

export const achievementProgressRelations = relations(achievementProgress, ({ one }) => ({
  user: one(users, {
    fields: [achievementProgress.userId],
    references: [users.id]
  })
}));

export const achievementPointsRelations = relations(achievementPoints, ({ one }) => ({
  user: one(users, {
    fields: [achievementPoints.userId],
    references: [users.id]
  })
}));

// User Progress relations
export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id]
  }),
  course: one(courses, {
    fields: [userProgress.courseId],
    references: [courses.id]
  }),
  section: one(courseSections, {
    fields: [userProgress.sectionId],
    references: [courseSections.id]
  })
}));
