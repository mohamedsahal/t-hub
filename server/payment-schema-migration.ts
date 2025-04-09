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

export async function addMissingColumnsToPayments() {
  try {
    // Check which columns we need to add
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name IN ('gateway_response', 'refund_status', 'redirect_url', 'callback_url')
    `);
    
    const existingColumns = new Set((result as any).rows.map((row: any) => row.column_name));
    
    // Build the alter table statement based on what's missing
    let alterTableParts = [];
    let columnsAdded = [];
    
    if (!existingColumns.has('gateway_response')) {
      alterTableParts.push(`ADD COLUMN IF NOT EXISTS gateway_response text DEFAULT NULL`);
      columnsAdded.push('gateway_response');
    }
    
    if (!existingColumns.has('refund_status')) {
      alterTableParts.push(`ADD COLUMN IF NOT EXISTS refund_status text DEFAULT NULL`);
      columnsAdded.push('refund_status');
    }
    
    if (!existingColumns.has('redirect_url')) {
      alterTableParts.push(`ADD COLUMN IF NOT EXISTS redirect_url text DEFAULT NULL`);
      columnsAdded.push('redirect_url');
    }
    
    if (!existingColumns.has('callback_url')) {
      alterTableParts.push(`ADD COLUMN IF NOT EXISTS callback_url text DEFAULT NULL`);
      columnsAdded.push('callback_url');
    }
    
    if (alterTableParts.length > 0) {
      console.log(`Adding missing columns to payments table: ${columnsAdded.join(', ')}...`);
      
      // Add the missing columns
      await db.execute(sql.raw(`
        ALTER TABLE payments 
        ${alterTableParts.join(', ')}
      `));
      
      console.log("Missing payment columns added successfully.");
      return true;
    } else {
      console.log("All required payment columns already exist, skipping this part of migration.");
      return false;
    }
  } catch (error) {
    console.error("Error during payments column migration:", error);
    throw error;
  }
}

export async function runPaymentMigration() {
  try {
    await addPaymentGatewayToPayments();
    await addMissingColumnsToPayments();
    console.log("Payment schema migration completed.");
  } catch (error) {
    console.error("Payment schema migration failed:", error);
  }
}

// For ESM compatibility, we'll just export the functions
// and call them from index.ts