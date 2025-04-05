// Migration to add the grading_mode column to the exams table

import { pool } from './db';

async function addGradingModeToExams() {
  try {
    const client = await pool.connect();
    try {
      console.log('Adding grading_mode column to exams table...');
      
      // Check if the column already exists
      const checkColumnResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'exams' AND column_name = 'grading_mode'
      `);
      
      if (checkColumnResult.rows.length === 0) {
        // Column doesn't exist, add it
        await client.query(`
          ALTER TABLE exams 
          ADD COLUMN grading_mode text NOT NULL DEFAULT 'auto'
        `);
        console.log('Successfully added grading_mode column to exams table');
      } else {
        console.log('grading_mode column already exists in exams table');
      }
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding grading_mode column to exams table:', error);
    throw error;
  }
}

async function main() {
  try {
    await addGradingModeToExams();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();