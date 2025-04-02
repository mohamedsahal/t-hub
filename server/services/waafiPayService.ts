import axios from 'axios';
import { log } from '../vite';

// Configuration for WaafiPay API
const WAAFIPAY_API_URL = process.env.WAAFIPAY_API_URL || 'https://api.waafipay.com/v2';
const WAAFIPAY_API_KEY = process.env.WAAFIPAY_API_KEY;
const WAAFIPAY_MERCHANT_ID = process.env.WAAFIPAY_MERCHANT_ID;

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
 * Process a payment through WaafiPay
 * @param {Object} paymentData The payment data
 * @returns {Promise<Object>} Payment response from WaafiPay
 */
export const processPayment = async (paymentData: {
  amount: number;
  currency?: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  referenceId: string;
  redirectUrl?: string;
}): Promise<any> => {
  try {
    if (!validateWaafiPayCredentials()) {
      throw new Error('WaafiPay API credentials not set up');
    }

    const response = await axios.post(`${WAAFIPAY_API_URL}/payments`, {
      ...paymentData,
      currency: paymentData.currency || 'USD',
      merchantId: WAAFIPAY_MERCHANT_ID,
      redirectUrl: paymentData.redirectUrl || process.env.WAAFIPAY_REDIRECT_URL
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
 * Handle the webhook for payment notification from WaafiPay
 * @param {Object} webhookData The webhook payload from WaafiPay
 * @returns {Promise<boolean>} Whether the webhook was processed successfully
 */
export const handlePaymentWebhook = async (webhookData: any): Promise<boolean> => {
  try {
    log(`Received payment webhook: ${JSON.stringify(webhookData)}`, 'payment');
    
    // Verify the webhook signature (implementation depends on WaafiPay's webhook format)
    // In a real implementation, we would verify the signature here
    
    // Process the payment status update
    // This would typically update our payment records and trigger appropriate actions
    
    return true;
  } catch (error) {
    log(`Error processing payment webhook: ${error}`, 'payment');
    return false;
  }
};

/**
 * Ask for WaafiPay API credentials
 * This function would use the ask_secrets tool in a real application
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
  
  // Note: In real implementation, ask the user for the values
  // using the ask_secrets tool instead of setting test values
  
  await initializeWaafiPay();
};

export default {
  initializeWaafiPay,
  processPayment,
  verifyPayment,
  handlePaymentWebhook,
  askForWaafiPayCredentials,
  validateWaafiPayCredentials
};