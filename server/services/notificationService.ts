import { log } from '../vite';
import { storage } from '../storage';
import emailService from './emailService';
import { User, Course, Payment, Installment, Enrollment } from '../../shared/schema';

/**
 * Schedule job intervals in milliseconds
 */
const INTERVALS = {
  COURSE_UPDATES: 24 * 60 * 60 * 1000, // Daily
  PAYMENT_REMINDERS: 12 * 60 * 60 * 1000, // Twice daily
};

/**
 * Format a date for email
 * @param date The date to format
 */
const formatEmailDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get the due date for an installment
 * @param payment The payment record
 * @param installmentNumber The installment number (1-based)
 */
const getInstallmentDueDate = (payment: Payment, installmentNumber: number): Date => {
  // For simplicity, we'll assume installments are due monthly after the initial payment
  const dueDate = new Date(payment.paymentDate);
  dueDate.setMonth(dueDate.getMonth() + installmentNumber - 1);
  return dueDate;
};

/**
 * Check if a date is approaching (within 3 days)
 * @param date The date to check
 */
const isDateApproaching = (date: Date): boolean => {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);
  
  return date >= now && date <= threeDaysFromNow;
};

/**
 * Process payment reminders
 */
const processPaymentReminders = async (): Promise<void> => {
  try {
    log('Processing payment reminders...', 'notification');
    
    // Get all payments that are pending
    const allPayments = await storage.getAllPayments();
    const pendingPayments = allPayments.filter(payment => payment.status === 'pending');
    
    for (const payment of pendingPayments) {
      // Get user and course details
      const user = await storage.getUser(payment.userId);
      const course = await storage.getCourse(payment.courseId);
      
      if (!user || !course) continue;
      
      if (payment.type === 'one_time') {
        // For one-time payments, send a reminder if the payment is approaching or overdue
        const dueDate = new Date(payment.dueDate || payment.paymentDate);
        
        if (isDateApproaching(dueDate)) {
          log(`Sending payment reminder to ${user.email} for course: ${course.title}`, 'notification');
          await emailService.sendPaymentReminder(user, payment, course, formatEmailDate(dueDate));
        }
      } else if (payment.type === 'installment') {
        // For installment payments, check each installment
        const installments = await storage.getInstallmentsByPayment(payment.id);
        
        for (const installment of installments) {
          if (installment.status === 'pending') {
            // Calculate the due date for this installment
            const dueDate = installment.dueDate 
              ? new Date(installment.dueDate) 
              : getInstallmentDueDate(payment, installment.installmentNumber);
            
            if (isDateApproaching(dueDate)) {
              log(`Sending installment reminder to ${user.email} for course: ${course.title}, installment: ${installment.installmentNumber}`, 'notification');
              await emailService.sendInstallmentReminder(user, installment, course, payment, formatEmailDate(dueDate));
            }
          }
        }
      }
    }
    
    log('Payment reminder processing completed', 'notification');
  } catch (error) {
    log(`Error processing payment reminders: ${error}`, 'notification');
  }
};

/**
 * Process course updates
 */
const processCourseUpdates = async (): Promise<void> => {
  try {
    log('Processing course updates...', 'notification');
    
    // Get all courses that have been updated recently (in a real system, you'd track updates)
    const courses = await storage.getAllCourses();
    const updatedCourses = courses.filter(course => course.status === 'published');
    
    for (const course of updatedCourses) {
      // Get all enrollments for this course
      const enrollments = await storage.getEnrollmentsByCourse(course.id);
      
      for (const enrollment of enrollments) {
        if (enrollment.status === 'active') {
          const user = await storage.getUser(enrollment.userId);
          
          if (user) {
            log(`Sending course update notification to ${user.email} for course: ${course.title}`, 'notification');
            await emailService.sendCourseUpdateNotification(user, course);
          }
        }
      }
    }
    
    log('Course update processing completed', 'notification');
  } catch (error) {
    log(`Error processing course updates: ${error}`, 'notification');
  }
};

// Notification jobs
let courseUpdateJob: NodeJS.Timeout | null = null;
let paymentReminderJob: NodeJS.Timeout | null = null;

/**
 * Start the notification service
 */
export const startNotificationService = async (): Promise<void> => {
  try {
    log('Starting notification service...', 'notification');
    
    // Initialize email service but don't try to run jobs if email is not configured
    await emailService.askForEmailCredentials();
    
    // Only schedule jobs if email is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      // Schedule jobs
      courseUpdateJob = setInterval(processCourseUpdates, INTERVALS.COURSE_UPDATES);
      paymentReminderJob = setInterval(processPaymentReminders, INTERVALS.PAYMENT_REMINDERS);
      
      log('Notification service started with scheduled jobs', 'notification');
      
      // Run immediately for testing
      processCourseUpdates();
      processPaymentReminders();
    } else {
      log('Notification service started but email notifications are disabled', 'notification');
    }
  } catch (error) {
    log(`Error starting notification service: ${error}`, 'notification');
  }
};

/**
 * Stop the notification service
 */
export const stopNotificationService = (): void => {
  log('Stopping notification service...', 'notification');
  
  if (courseUpdateJob) {
    clearInterval(courseUpdateJob);
    courseUpdateJob = null;
  }
  
  if (paymentReminderJob) {
    clearInterval(paymentReminderJob);
    paymentReminderJob = null;
  }
  
  log('Notification service stopped', 'notification');
};

/**
 * Send an enrollment confirmation notification
 * @param userId The user ID
 * @param courseId The course ID
 */
export const sendEnrollmentConfirmation = async (userId: number, courseId: number): Promise<boolean> => {
  try {
    const user = await storage.getUser(userId);
    const course = await storage.getCourse(courseId);
    
    if (!user || !course) {
      log(`Failed to send enrollment confirmation: User or course not found`, 'notification');
      return false;
    }
    
    log(`Sending enrollment confirmation to ${user.email} for course: ${course.title}`, 'notification');
    return await emailService.sendEnrollmentConfirmation(user, course);
  } catch (error) {
    log(`Error sending enrollment confirmation: ${error}`, 'notification');
    return false;
  }
};

// Extend storage for additional methods needed if we switch to non-memory storage
export const extendStorage = async (): Promise<void> => {
  // For implementation with a non-memory storage, we would need to add methods to track and query:
  // - Course updates
  // - Upcoming payment/installment due dates
  
  // Check if methods exist, but don't need to add them since they're already in the interface
  // and implemented in MemStorage
  
  // Make sure the storage is initialized properly
  const users = await storage.getAllUsers();
  if (users.length === 0) {
    console.log("No users found in storage, initialization may be required");
  }
};

// Export the notification service
export default {
  startNotificationService: async () => await startNotificationService(),
  stopNotificationService,
  sendEnrollmentConfirmation,
  extendStorage,
};