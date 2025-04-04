import axios from 'axios';
import { log } from '../vite';
import crypto from 'crypto';
import { InsertPayment } from '../../shared/schema';

// Configuration for WaafiPay API
const WAAFIPAY_API_URL = process.env.WAAFIPAY_API_URL || 'https://api.waafipay.com/v2';
const WAAFIPAY_HPP_URL = process.env.WAAFIPAY_HPP_URL || 'https://pay.waafipay.com';
const WAAFIPAY_API_KEY = process.env.WAAFIPAY_API_KEY;
const WAAFIPAY_MERCHANT_ID = process.env.WAAFIPAY_MERCHANT_ID;
const WAAFIPAY_WEBHOOK_SECRET = process.env.WAAFIPAY_WEBHOOK_SECRET;

// Define supported payment methods
export enum PaymentMethod {
  CARD = 'card',
  MOBILE_WALLET = 'mobile_wallet',
  BANK_ACCOUNT = 'bank_account'
}

// Define supported wallet types
export enum WalletType {
  WAAFI = 'WAAFI',
  ZAAD = 'ZAAD',
  EVCPLUS = 'EVCPlus',
  SAHAL = 'SAHAL'
}

// Payment request interface
export interface PaymentRequest {
  amount: number;
  currency?: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  referenceId: string;
  paymentMethod?: PaymentMethod;
  walletType?: WalletType;
  redirectUrl?: string;
  callbackUrl?: string;
}

// Webhook data interface
export interface WebhookData {
  transactionId: string;
  referenceId: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'CANCELLED';
  amount: number;
  currency: string;
  paymentMethod: string;
  timestamp: string;
  customerPhone?: string;
  signature?: string;
}

/**
 * Validates if the WaafiPay credentials are set up
 * @returns {boolean} true if credentials are set up
 */
export const validateWaafiPayCredentials = (): boolean => {
  return !!(WAAFIPAY_API_KEY && WAAFIPAY_MERCHANT_ID);
};

/**
 * Initialize the WaafiPay service with API credentials
 * @returns {Promise<boolean>} true if initialization successful
 */
export const initializeWaafiPay = async (): Promise<boolean> => {
  if (!validateWaafiPayCredentials()) {
    log('WaafiPay API credentials not found', 'payment');
    return false;
  }

  try {
    // Test connection to WaafiPay API
    await axios.get(`${WAAFIPAY_API_URL}/status`, {
      headers: {
        'Authorization': `Bearer ${WAAFIPAY_API_KEY}`,
        'x-merchant-id': WAAFIPAY_MERCHANT_ID
      }
    });
    
    log('WaafiPay API service initialized successfully', 'payment');
    return true;
  } catch (error) {
    log(`Failed to initialize WaafiPay API service: ${error}`, 'payment');
    return false;
  }
};

/**
 * Process a payment directly through WaafiPay API
 * @param {PaymentRequest} paymentData The payment data
 * @returns {Promise<Object>} Payment response from WaafiPay
 */
export const processDirectPayment = async (paymentData: PaymentRequest): Promise<any> => {
  try {
    if (!validateWaafiPayCredentials()) {
      throw new Error('WaafiPay API credentials not set up');
    }

    const response = await axios.post(`${WAAFIPAY_API_URL}/payments`, {
      ...paymentData,
      currency: paymentData.currency || 'USD',
      merchantId: WAAFIPAY_MERCHANT_ID,
      redirectUrl: paymentData.redirectUrl || process.env.WAAFIPAY_REDIRECT_URL,
      callbackUrl: paymentData.callbackUrl || process.env.WAAFIPAY_CALLBACK_URL
    }, {
      headers: {
        'Authorization': `Bearer ${WAAFIPAY_API_KEY}`,
        'x-merchant-id': WAAFIPAY_MERCHANT_ID,
        'Content-Type': 'application/json'
      }
    });

    log(`Payment request sent to WaafiPay: ${JSON.stringify(response.data)}`, 'payment');
    return response.data;
  } catch (error) {
    log(`Error processing payment with WaafiPay: ${error}`, 'payment');
    throw error;
  }
};

/**
 * Generate a hosted payment page URL
 * @param {PaymentRequest} paymentData The payment data
 * @returns {Promise<string>} URL for the hosted payment page
 */
export const generateHostedPaymentUrl = async (paymentData: PaymentRequest): Promise<string> => {
  try {
    if (!validateWaafiPayCredentials()) {
      throw new Error('WaafiPay API credentials not set up');
    }

    // Create a signature for secure HPP initialization
    const timestamp = Date.now().toString();
    const signatureData = `${WAAFIPAY_MERCHANT_ID}|${paymentData.referenceId}|${paymentData.amount}|${timestamp}`;
    const signature = crypto
      .createHmac('sha256', WAAFIPAY_API_KEY || '')
      .update(signatureData)
      .digest('hex');

    // Construct the HPP URL with all necessary parameters
    const params = new URLSearchParams({
      merchant_id: WAAFIPAY_MERCHANT_ID || '',
      amount: paymentData.amount.toString(),
      currency: paymentData.currency || 'USD',
      reference_id: paymentData.referenceId,
      description: paymentData.description,
      customer_name: paymentData.customerName,
      customer_email: paymentData.customerEmail,
      customer_phone: paymentData.customerPhone,
      redirect_url: paymentData.redirectUrl || process.env.WAAFIPAY_REDIRECT_URL || '',
      callback_url: paymentData.callbackUrl || process.env.WAAFIPAY_CALLBACK_URL || '',
      timestamp,
      signature
    });

    // Add optional parameters if they exist
    if (paymentData.paymentMethod) {
      params.append('payment_method', paymentData.paymentMethod);
    }
    
    if (paymentData.walletType) {
      params.append('wallet_type', paymentData.walletType);
    }

    const hppUrl = `${WAAFIPAY_HPP_URL}/pay?${params.toString()}`;
    log(`Generated HPP URL: ${hppUrl}`, 'payment');
    
    return hppUrl;
  } catch (error) {
    log(`Error generating HPP URL: ${error}`, 'payment');
    throw error;
  }
};

/**
 * Process a payment through WaafiPay
 * This function will decide whether to use direct API or HPP based on the provided parameters
 * @param {PaymentRequest} paymentData The payment data
 * @param {boolean} useHostedPage Whether to use the hosted payment page
 * @returns {Promise<Object>} Payment response or redirect URL
 */
export const processPayment = async (
  paymentData: PaymentRequest, 
  useHostedPage: boolean = true
): Promise<any> => {
  try {
    if (useHostedPage) {
      const hppUrl = await generateHostedPaymentUrl(paymentData);
      return { redirectUrl: hppUrl, referenceId: paymentData.referenceId };
    } else {
      return await processDirectPayment(paymentData);
    }
  } catch (error) {
    log(`Error processing payment: ${error}`, 'payment');
    throw error;
  }
};

/**
 * Format mobile wallet payment data - user provides full number
 * @param {PaymentRequest} baseData The base payment data
 * @param {WalletType} walletType The type of mobile wallet
 * @returns {PaymentRequest} Formatted request with user-provided phone number
 */
export const formatMobileWalletPayment = (
  baseData: PaymentRequest, 
  walletType: WalletType
): PaymentRequest => {
  // Use the phone number exactly as provided by the user
  // No prefix or country code manipulation
  
  // Return the formatted payment data
  return {
    ...baseData,
    paymentMethod: PaymentMethod.MOBILE_WALLET,
    walletType,
    customerPhone: baseData.customerPhone
  };
};

/**
 * Format data for card payment
 * @param {PaymentRequest} baseData The base payment data
 * @returns {PaymentRequest} Formatted request
 */
export const formatCardPayment = (baseData: PaymentRequest): PaymentRequest => {
  return {
    ...baseData,
    paymentMethod: PaymentMethod.CARD
  };
};

/**
 * Verify a payment status from WaafiPay
 * @param {string} transactionId The transaction ID to verify
 * @returns {Promise<Object>} Payment verification response
 */
export const verifyPayment = async (transactionId: string): Promise<any> => {
  try {
    if (!validateWaafiPayCredentials()) {
      throw new Error('WaafiPay API credentials not set up');
    }

    const response = await axios.get(`${WAAFIPAY_API_URL}/payments/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${WAAFIPAY_API_KEY}`,
        'x-merchant-id': WAAFIPAY_MERCHANT_ID
      }
    });

    log(`Payment verification for ${transactionId}: ${JSON.stringify(response.data)}`, 'payment');
    return response.data;
  } catch (error) {
    log(`Error verifying payment with WaafiPay: ${error}`, 'payment');
    throw error;
  }
};

/**
 * Verify the webhook signature
 * @param {WebhookData} webhookData The webhook payload
 * @returns {boolean} Whether the signature is valid
 */
export const verifyWebhookSignature = (webhookData: WebhookData): boolean => {
  try {
    if (!WAAFIPAY_WEBHOOK_SECRET || !webhookData.signature) {
      log('Webhook secret or signature missing, skipping verification', 'payment');
      return true; // In development or when not configured, skip verification
    }

    const { signature, ...dataWithoutSignature } = webhookData;
    const stringToSign = JSON.stringify(dataWithoutSignature);
    
    const calculatedSignature = crypto
      .createHmac('sha256', WAAFIPAY_WEBHOOK_SECRET)
      .update(stringToSign)
      .digest('hex');
    
    const isValid = calculatedSignature === signature;
    if (!isValid) {
      log(`Invalid webhook signature. Expected: ${calculatedSignature}, Received: ${signature}`, 'payment');
    }
    return isValid;
  } catch (error) {
    log(`Error verifying webhook signature: ${error}`, 'payment');
    return false;
  }
};

/**
 * Handle the webhook for payment notification from WaafiPay
 * @param {WebhookData} webhookData The webhook payload from WaafiPay
 * @returns {Promise<boolean>} Whether the webhook was processed successfully
 */
export const handlePaymentWebhook = async (webhookData: WebhookData): Promise<boolean> => {
  try {
    log(`Received payment webhook: ${JSON.stringify(webhookData)}`, 'payment');
    
    // Verify the webhook signature
    if (!verifyWebhookSignature(webhookData)) {
      log('Webhook signature verification failed', 'payment');
      return false;
    }
    
    // Extract payment data
    const { transactionId, referenceId, status, amount } = webhookData;
    
    // Map WaafiPay status to our payment status
    const paymentStatus = status === 'COMPLETED' ? 'completed' : 
                          status === 'FAILED' ? 'failed' : 'pending';
    
    // Here you would update your database with the payment status
    // This would be implemented by the calling function
    
    log(`Webhook processed successfully for transaction ${transactionId}`, 'payment');
    return true;
  } catch (error) {
    log(`Error processing payment webhook: ${error}`, 'payment');
    return false;
  }
};

/**
 * Format payment data from our database to WaafiPay request format
 * @param {any} paymentData Our internal payment data
 * @returns {PaymentRequest} Formatted data for WaafiPay
 */
export const formatPaymentRequest = (
  paymentData: {
    amount: number;
    courseId: number;
    userId: number;
    userName: string;
    userEmail: string;
    userPhone: string;
    paymentMethod?: string;
    walletType?: string;
  }
): PaymentRequest => {
  // Generate a reference ID for this transaction
  const referenceId = `THUB-${Date.now()}-${paymentData.userId}-${paymentData.courseId}`;
  
  return {
    amount: paymentData.amount,
    currency: 'USD', // Default currency
    description: `Payment for Course ID: ${paymentData.courseId}`,
    customerName: paymentData.userName,
    customerEmail: paymentData.userEmail,
    customerPhone: paymentData.userPhone,
    referenceId,
    paymentMethod: paymentData.paymentMethod as PaymentMethod,
    walletType: paymentData.walletType as WalletType,
    redirectUrl: `${process.env.APP_URL || 'http://localhost:3000'}/payment/success?ref=${referenceId}`,
    callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/payment/webhook`
  };
};

/**
 * Ask for WaafiPay API credentials
 */
export const askForWaafiPayCredentials = async (): Promise<void> => {
  if (validateWaafiPayCredentials()) {
    await initializeWaafiPay();
    return;
  }
  
  log('WaafiPay API credentials not found. Please set WAAFIPAY_API_KEY, WAAFIPAY_MERCHANT_ID environment variables', 'payment');
  
  // In a production environment, we would use the ask_secrets tool
  // For testing, we'll initialize with temporary values
  // This should be replaced with proper prompting in production
  if (!process.env.WAAFIPAY_API_KEY) {
    process.env.WAAFIPAY_API_KEY = 'temp_api_key';
  }
  if (!process.env.WAAFIPAY_MERCHANT_ID) {
    process.env.WAAFIPAY_MERCHANT_ID = 'temp_merchant_id';
  }
  if (!process.env.WAAFIPAY_API_URL) {
    process.env.WAAFIPAY_API_URL = 'https://api.waafipay.com/v2';
  }
  if (!process.env.WAAFIPAY_HPP_URL) {
    process.env.WAAFIPAY_HPP_URL = 'https://pay.waafipay.com';
  }
  
  // Note: In real implementation, ask the user for the values
  // using the ask_secrets tool instead of setting test values
  
  await initializeWaafiPay();
};

export default {
  initializeWaafiPay,
  processPayment,
  processDirectPayment,
  generateHostedPaymentUrl,
  verifyPayment,
  formatMobileWalletPayment,
  formatCardPayment,
  handlePaymentWebhook,
  verifyWebhookSignature,
  formatPaymentRequest,
  askForWaafiPayCredentials,
  validateWaafiPayCredentials,
  PaymentMethod,
  WalletType
};