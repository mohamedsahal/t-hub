/**
 * This script adds password reset fields to the users table
 */
import { storage } from './storage';
import { log } from './vite';
import { pool } from './db';

export async function addPasswordResetFieldsToUsers() {
  log('Adding password reset fields to users table...', 'migration');
  try {
    // Check if columns already exist
    const checkColumn = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'reset_token';
    `);

    // If reset_token column doesn't exist, add both columns
    if (checkColumn.rows.length === 0) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN reset_token TEXT,
        ADD COLUMN reset_token_expiry TIMESTAMP;
      `);
      
      log('Password reset fields added successfully', 'migration');
    } else {
      log('Password reset fields already exist', 'migration');
    }
    
    return true;
  } catch (error) {
    log(`Error adding password reset fields: ${error}`, 'migration');
    return false;
  }
}

// This function is exported and called from routes.ts
// For standalone script execution, use:
// node -e "import('./password-reset-migration.js').then(m => m.addPasswordResetFieldsToUsers())"