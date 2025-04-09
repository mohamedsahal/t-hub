/**
 * This script adds missing columns to the payments table
 */
import { db } from './db';
import { sql } from 'drizzle-orm';

export async function addPaymentGatewayToPayments() {
  try {
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'payment_gateway'
    `);
    
    if ((result as any).rows.length === 0) {
      console.log("Adding payment_gateway column to payments table...");
      
      // Add the missing columns
      await db.execute(sql`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'waafipay',
        ADD COLUMN IF NOT EXISTS payment_method text,
        ADD COLUMN IF NOT EXISTS wallet_type text,
        ADD COLUMN IF NOT EXISTS customer_phone text
      `);
      
      console.log("Payment gateway columns added successfully.");
      return true;
    } else {
      console.log("Payment gateway column already exists, skipping this part of migration.");
      return false;
    }
  } catch (error) {
    console.error("Error during payments gateway migration:", error);
    throw error;
  }
}

export async function addGatewayResponseToPayments() {
  try {
    // Check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'gateway_response'
    `);
    
    if ((result as any).rows.length === 0) {
      console.log("Adding gateway_response column to payments table...");
      
      // Add the missing column
      await db.execute(sql`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS gateway_response jsonb DEFAULT NULL
      `);
      
      console.log("Gateway response column added successfully.");
      return true;
    } else {
      console.log("Gateway response column already exists, skipping this part of migration.");
      return false;
    }
  } catch (error) {
    console.error("Error during gateway response migration:", error);
    throw error;
  }
}

export async function runPaymentMigration() {
  try {
    await addPaymentGatewayToPayments();
    await addGatewayResponseToPayments();
    console.log("Payment schema migration completed.");
  } catch (error) {
    console.error("Payment schema migration failed:", error);
  }
}

// For ESM compatibility, we'll just export the functions
// and call them from index.ts