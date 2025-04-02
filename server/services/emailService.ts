import nodemailer from 'nodemailer';
import { log } from '../vite';
import { User, Course, Payment, Installment } from '../../shared/schema';

// Email templates
const templates = {
  courseUpdate: (user: User, course: Course) => ({
    subject: `[THUB] Course Update: ${course.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0080c9; margin: 0;">THUB</h1>
          <p style="color: #3cb878; font-weight: bold;">Career Development Center</p>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Course Update</h2>
          <p>Hello ${user.name},</p>
          <p>We're excited to inform you that the course <strong>${course.title}</strong> has been updated.</p>
          <p>The following changes have been made:</p>
          <ul>
            <li>Updated course materials</li>
            <li>New learning resources</li>
            <li>Additional practice exercises</li>
          </ul>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #0080c9; margin-top: 0;">Course Details</h3>
          <p><strong>Course:</strong> ${course.title}</p>
          <p><strong>Type:</strong> ${course.type}</p>
          <p><strong>Duration:</strong> ${course.duration} weeks</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://thub-edu.replit.app/courses/${course.id}" style="background: linear-gradient(to right, #3cb878, #0080c9); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Course Updates</a>
        </div>
        <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
          <p>THUB Innovation Center • Mogadishu, Somalia</p>
          <p>Email: info@t-hub.so • WhatsApp: +2525251111</p>
        </div>
      </div>
    `,
  }),
  
  paymentReminder: (user: User, payment: Payment, course: Course, dueDate: string) => ({
    subject: `[THUB] Payment Reminder: ${course.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0080c9; margin: 0;">THUB</h1>
          <p style="color: #3cb878; font-weight: bold;">Career Development Center</p>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Payment Reminder</h2>
          <p>Hello ${user.name},</p>
          <p>This is a friendly reminder that your payment for <strong>${course.title}</strong> is due soon.</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #0080c9; margin-top: 0;">Payment Details</h3>
          <p><strong>Course:</strong> ${course.title}</p>
          <p><strong>Amount Due:</strong> $${payment.amount}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://thub-edu.replit.app/dashboard/payments" style="background: linear-gradient(to right, #3cb878, #0080c9); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Make Payment</a>
        </div>
        <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
          <p>THUB Innovation Center • Mogadishu, Somalia</p>
          <p>Email: info@t-hub.so • WhatsApp: +2525251111</p>
        </div>
      </div>
    `,
  }),
  
  installmentReminder: (user: User, installment: Installment, course: Course, payment: Payment, dueDate: string) => ({
    subject: `[THUB] Installment Payment Reminder: ${course.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0080c9; margin: 0;">THUB</h1>
          <p style="color: #3cb878; font-weight: bold;">Career Development Center</p>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Installment Payment Reminder</h2>
          <p>Hello ${user.name},</p>
          <p>This is a friendly reminder that your installment payment for <strong>${course.title}</strong> is due soon.</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #0080c9; margin-top: 0;">Installment Details</h3>
          <p><strong>Course:</strong> ${course.title}</p>
          <p><strong>Installment:</strong> ${installment.installmentNumber} of ${payment.numberOfInstallments}</p>
          <p><strong>Amount Due:</strong> $${installment.amount}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://thub-edu.replit.app/dashboard/payments" style="background: linear-gradient(to right, #3cb878, #0080c9); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Make Payment</a>
        </div>
        <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
          <p>THUB Innovation Center • Mogadishu, Somalia</p>
          <p>Email: info@t-hub.so • WhatsApp: +2525251111</p>
        </div>
      </div>
    `,
  }),

  enrollmentConfirmation: (user: User, course: Course) => ({
    subject: `[THUB] Enrollment Confirmation: ${course.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0080c9; margin: 0;">THUB</h1>
          <p style="color: #3cb878; font-weight: bold;">Career Development Center</p>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Enrollment Confirmation</h2>
          <p>Hello ${user.name},</p>
          <p>Congratulations! Your enrollment in <strong>${course.title}</strong> has been confirmed.</p>
          <p>We're excited to have you join us on this learning journey.</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #0080c9; margin-top: 0;">Course Details</h3>
          <p><strong>Course:</strong> ${course.title}</p>
          <p><strong>Type:</strong> ${course.type}</p>
          <p><strong>Duration:</strong> ${course.duration} weeks</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://thub-edu.replit.app/dashboard" style="background: linear-gradient(to right, #3cb878, #0080c9); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Access Your Dashboard</a>
        </div>
        <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
          <p>THUB Innovation Center • Mogadishu, Somalia</p>
          <p>Email: info@t-hub.so • WhatsApp: +2525251111</p>
        </div>
      </div>
    `,
  }),
};

// Configuration for email service
let transporter: nodemailer.Transporter | null = null;

/**
 * Ask for email credentials if they're not set
 */
export const askForEmailCredentials = async (): Promise<void> => {
  // Check if credentials are already set
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    await initializeEmailService();
    return;
  }
  
  log('Email credentials not found, please set EMAIL_USER and EMAIL_PASSWORD environment variables', 'email');
  
  // In a real app, we would prompt the user here or use a secrets manager
  // For now, we'll just initialize with test credentials for development
  process.env.EMAIL_USER = 'test@example.com';
  process.env.EMAIL_PASSWORD = 'testpassword';
  
  await initializeEmailService();
};

/**
 * Initialize the email service
 */
export const initializeEmailService = async (): Promise<void> => {
  try {
    // Check for environment variables
    const email = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;
    
    if (!email || !password) {
      log('Email service not configured: Missing credentials', 'email');
      return;
    }

    // Create reusable transporter object using SMTP transport
    transporter = nodemailer.createTransport({
      service: 'gmail', // or your SMTP service
      auth: {
        user: email,
        pass: password,
      },
    });

    log('Email service initialized', 'email');
  } catch (error) {
    log(`Failed to initialize email service: ${error}`, 'email');
  }
};

/**
 * Send an email
 * @param to Recipient email
 * @param subject Email subject
 * @param html Email HTML content
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  if (!transporter) {
    log('Email service not initialized', 'email');
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    log(`Email sent to ${to}`, 'email');
    return true;
  } catch (error) {
    log(`Failed to send email: ${error}`, 'email');
    return false;
  }
};

/**
 * Send a course update notification
 * @param user User to notify
 * @param course Updated course
 */
export const sendCourseUpdateNotification = async (user: User, course: Course): Promise<boolean> => {
  const { subject, html } = templates.courseUpdate(user, course);
  return sendEmail(user.email, subject, html);
};

/**
 * Send a payment reminder
 * @param user User to notify
 * @param payment Payment details
 * @param course Course being paid for
 * @param dueDate Due date of the payment
 */
export const sendPaymentReminder = async (user: User, payment: Payment, course: Course, dueDate: string): Promise<boolean> => {
  const { subject, html } = templates.paymentReminder(user, payment, course, dueDate);
  return sendEmail(user.email, subject, html);
};

/**
 * Send an installment payment reminder
 * @param user User to notify
 * @param installment Installment details
 * @param course Course being paid for
 * @param payment Related payment
 * @param dueDate Due date of the installment
 */
export const sendInstallmentReminder = async (
  user: User, 
  installment: Installment, 
  course: Course, 
  payment: Payment, 
  dueDate: string
): Promise<boolean> => {
  const { subject, html } = templates.installmentReminder(user, installment, course, payment, dueDate);
  return sendEmail(user.email, subject, html);
};

/**
 * Send an enrollment confirmation
 * @param user User to notify
 * @param course Course enrolled
 */
export const sendEnrollmentConfirmation = async (user: User, course: Course): Promise<boolean> => {
  const { subject, html } = templates.enrollmentConfirmation(user, course);
  return sendEmail(user.email, subject, html);
};

// Export the email service module
export default {
  initializeEmailService,
  askForEmailCredentials,
  sendEmail,
  sendCourseUpdateNotification,
  sendPaymentReminder,
  sendInstallmentReminder,
  sendEnrollmentConfirmation,
};