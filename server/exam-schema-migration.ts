import { db } from './db';
import { sql } from 'drizzle-orm';

async function addMissingColumnsToExams() {
  try {
    console.log('Starting migration to add missing columns to exams table...');

    // Check if the grade threshold columns already exist
    const gradeColumnsExist = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'exams' 
      AND column_name IN ('grade_a_threshold', 'grade_b_threshold', 'grade_c_threshold', 'grade_d_threshold')
    `);

    // Check if the available date columns exist
    const availableColumnsExist = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'exams' 
      AND column_name IN ('available_from', 'available_to')
    `);

    let columnsToAdd = [];
    
    // Add grade threshold columns if needed
    if (gradeColumnsExist.rows.length < 4) {
      columnsToAdd.push(
        'ADD COLUMN IF NOT EXISTS grade_a_threshold INTEGER DEFAULT 90',
        'ADD COLUMN IF NOT EXISTS grade_b_threshold INTEGER DEFAULT 80',
        'ADD COLUMN IF NOT EXISTS grade_c_threshold INTEGER DEFAULT 70',
        'ADD COLUMN IF NOT EXISTS grade_d_threshold INTEGER DEFAULT 60'
      );
      console.log('Adding grade threshold columns');
    }
    
    // Add available date columns if needed
    if (availableColumnsExist.rows.length < 2) {
      columnsToAdd.push(
        'ADD COLUMN IF NOT EXISTS available_from TIMESTAMP',
        'ADD COLUMN IF NOT EXISTS available_to TIMESTAMP'
      );
      console.log('Adding availability date columns');
    }
    
    if (columnsToAdd.length === 0) {
      console.log('All required columns already exist, skipping migration');
      return;
    }

    // Add missing columns
    await db.execute(sql.raw(`ALTER TABLE exams ${columnsToAdd.join(', ')}`));

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error executing migration:', error);
    throw error;
  }
}

async function main() {
  console.log('Running exam schema migration...');
  
  try {
    await addMissingColumnsToExams();
    console.log('Exam schema migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();