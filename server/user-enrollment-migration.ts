import { pool } from './db';

/**
 * Migration to add the progress_percentage column to enrollments table
 */

async function migrateEnrollments() {
  const client = await pool.connect();
  try {
    console.log('Starting enrollments migration...');
    
    // Check if the progress_percentage column already exists
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'enrollments' AND column_name = 'progress_percentage';
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding progress_percentage column to the enrollments table...');
      
      await client.query(`
        ALTER TABLE enrollments
        ADD COLUMN progress_percentage INTEGER DEFAULT 0;
      `);
      
      console.log('Successfully added progress_percentage column to enrollments table');
    } else {
      console.log('Column progress_percentage already exists in enrollments table');
    }
    
    console.log('Enrollments migration completed successfully');
  } catch (error) {
    console.error('Error during enrollments migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if this file is executed directly
// Using ESM syntax instead of CommonJS
// This file is imported rather than directly executed in our application
// so this block is not necessary, but kept for manual execution if needed
/*
if (import.meta.url === import.meta.main) {
  migrateEnrollments()
    .then(() => {
      console.log('Enrollments migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Enrollments migration failed:', error);
      process.exit(1);
    });
}
*/

export { migrateEnrollments };