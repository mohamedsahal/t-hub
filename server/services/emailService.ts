import nodemailer from 'nodemailer';
import { log } from '../vite';
import { User, Course, Payment, Installment } from '../../shared/schema';

// Email templates
const templates = {
  emailVerification: (user: User, verificationCode: string) => {
    // Get the base URL from environment or use a default
    const baseUrl = process.env.BASE_URL || (
      process.env.NODE_ENV === 'production' 
      ? 'https://thub-edu.replit.app' 
      : 'http://localhost:5000'
    );
    
    return {
      subject: `[THUB] Email Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0080c9; margin: 0;">THUB</h1>
            <p style="color: #3cb878; font-weight: bold;">Career Development Center</p>
          </div>
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333;">Verify Your Email</h2>
            <p>Hello ${user.name},</p>
            <p>Thank you for registering with THUB. To complete your registration, please use the verification code below:</p>
            <div style="text-align: center; margin: 30px 0; font-size: 24px; letter-spacing: 8px; font-weight: bold; background-color: #f0f0f0; padding: 15px; border-radius: 8px;">
              ${verificationCode}
            </div>
            <p>This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
          </div>
          <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
            <p>THUB Innovation Center • Mogadishu, Somalia</p>
            <p>Email: info@t-hub.so • WhatsApp: +2525251111</p>
          </div>
        </div>
      `,
    };
  },
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
  
  passwordReset: (user: User, resetToken: string) => {
    // Get the base URL from environment or use a default
    const baseUrl = process.env.BASE_URL || (
      process.env.NODE_ENV === 'production' 
      ? 'https://thub-edu.replit.app' 
      : 'http://localhost:5000'
    );
    
    return {
      subject: `[THUB] Password Reset Request`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0080c9; margin: 0;">THUB</h1>
            <p style="color: #3cb878; font-weight: bold;">Career Development Center</p>
          </div>
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your password for your THUB account.</p>
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${baseUrl}/reset-password/${resetToken}" style="background: linear-gradient(to right, #3cb878, #0080c9); color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          <div style="margin-top: 15px; text-align: center;">
            <p style="font-size: 12px; color: #666;">
              If the button above doesn't work, copy and paste this link into your browser:<br/>
              <a href="${baseUrl}/reset-password/${resetToken}" style="color: #0080c9;">${baseUrl}/reset-password/${resetToken}</a>
            </p>
          </div>
          <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
            <p>THUB Innovation Center • Mogadishu, Somalia</p>
            <p>Email: info@t-hub.so • WhatsApp: +2525251111</p>
          </div>
        </div>
      `,
    };
  },
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
  log('Email notifications are disabled until credentials are provided', 'email');
  // We won't initialize with fake credentials as it could cause errors
  return;
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
      host: 'mail.t-hub.so',
      port: 465,
      secure: true, // use SSL/TLS
      auth: {
        user: email,
        pass: password,
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false
      },
      // Debug SMTP communication
      logger: true,
      debug: process.env.NODE_ENV === 'development',
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
    // Format the "from" field properly
    const fromName = "THUB Innovation";
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const from = `"${fromName}" <${fromEmail}>`;

    const mailOptions = {
      from,
      to,
      subject,
      html,
      // Enable debug options
      headers: {
        'Priority': 'high'
      }
    };

    await transporter.sendMail(mailOptions);
    log(`Email sent to ${to}`, 'email');
    return true;
  } catch (error: any) {
    // Provide detailed error information
    let errorDetails = error.message || String(error);
    
    // Try to extract more detailed SMTP error information
    if (error.response) {
      errorDetails += ` - SMTP Response: ${error.response}`;
    }
    
    // Log if there's an issue with the recipient
    if (errorDetails.includes('recipient') || errorDetails.includes('Invalid address')) {
      log(`Invalid recipient address: ${to}`, 'email');
    }
    
    // Log if there's an authentication issue
    if (errorDetails.includes('auth') || errorDetails.includes('credentials')) {
      log(`Email authentication error - Please check EMAIL_USER and EMAIL_PASSWORD secrets`, 'email');
    }
    
    log(`Failed to send email: ${errorDetails}`, 'email');
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

/**
 * Send a password reset email
 * @param user User requesting password reset
 * @param resetToken Token for password reset
 */
export const sendPasswordResetEmail = async (user: User, resetToken: string): Promise<boolean> => {
  const { subject, html } = templates.passwordReset(user, resetToken);
  return sendEmail(user.email, subject, html);
};

// Export the email service module
/**
 * Send an email verification code
 * @param user User to verify
 * @param verificationCode Verification code
 */
export const sendVerificationEmail = async (user: User, verificationCode: string): Promise<boolean> => {
  const { subject, html } = templates.emailVerification(user, verificationCode);
  return sendEmail(user.email, subject, html);
};

export default {
  initializeEmailService,
  askForEmailCredentials,
  sendEmail,
  sendCourseUpdateNotification,
  sendPaymentReminder,
  sendInstallmentReminder,
  sendEnrollmentConfirmation,
  sendPasswordResetEmail,
  sendVerificationEmail,
};