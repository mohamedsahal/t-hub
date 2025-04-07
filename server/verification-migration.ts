/**
 * This script adds email verification fields to the users table
 */
import { db } from './db';
import { log } from './vite';
import { sql } from 'drizzle-orm';

export async function addVerificationFieldsToUsers() {
  try {
    log('migration', 'Adding email verification fields to users table...');
    
    // Check if verification_code column already exists
    const checkTableResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'verification_code'
    `);
    
    // If column exists, skip migration
    if (checkTableResult.length > 0) {
      log('migration', 'Email verification fields already exist');
      return;
    }
    
    // Add verification code column
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN verification_code TEXT,
      ADD COLUMN verification_code_expiry TIMESTAMP,
      ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE
    `);
    
    // Set existing users as verified
    await db.execute(sql`
      UPDATE users
      SET is_verified = TRUE
    `);
    
    log('migration', 'Successfully added email verification fields to users table');
  } catch (error) {
    log('migration', `Error adding email verification fields: ${error}`);
    throw error;
  }
}

// Run migration when this file is executed directly
if (require.main === module) {
  addVerificationFieldsToUsers()
    .then(() => {
      log('migration', 'Verification fields migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      log('migration', `Migration failed: ${error}`);
      process.exit(1);
    });
}