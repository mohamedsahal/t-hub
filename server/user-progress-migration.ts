/**
 * This script adds user progress tracking tables to the database
 */
import { db } from './db';
import { log } from './vite';
import { userProgress } from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Add user progress tracking tables to the database
 */
export async function addUserProgressTables() {
  try {
    // Check if userProgress table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_progress'
      );
    `);
    
    const exists = tableExists.rows[0].exists;
    
    if (!exists) {
      // Create the user_progress table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "user_progress" (
          "id" SERIAL PRIMARY KEY,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "user_id" INTEGER NOT NULL,
          "course_id" INTEGER NOT NULL,
          "section_id" INTEGER NOT NULL,
          "is_completed" BOOLEAN DEFAULT FALSE NOT NULL,
          "completion_date" TIMESTAMP WITH TIME ZONE,
          "time_spent" INTEGER DEFAULT 0 NOT NULL,
          "last_position" INTEGER DEFAULT 0 NOT NULL,
          "notes" TEXT,
          CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
          CONSTRAINT "user_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
          CONSTRAINT "user_progress_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "course_sections"("id") ON DELETE CASCADE,
          CONSTRAINT "user_progress_unique_user_section" UNIQUE ("user_id", "section_id")
        );
      `);
      
      // Create indexes for faster queries
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "user_progress_user_id_idx" ON "user_progress" ("user_id");
        CREATE INDEX IF NOT EXISTS "user_progress_course_id_idx" ON "user_progress" ("course_id");
        CREATE INDEX IF NOT EXISTS "user_progress_section_id_idx" ON "user_progress" ("section_id");
        CREATE INDEX IF NOT EXISTS "user_progress_completion_status_idx" ON "user_progress" ("is_completed");
      `);
      
      log('Created user_progress table and indexes', 'migration');
      return true;
    } else {
      log('user_progress table already exists', 'migration');
      return false;
    }
  } catch (error) {
    log(`Error creating user progress tables: ${error}`, 'migration');
    throw error;
  }
}

/**
 * Run the user progress migration
 */
export async function runUserProgressMigration() {
  try {
    const userProgressTablesAdded = await addUserProgressTables();
    
    if (userProgressTablesAdded) {
      log('User progress migration completed successfully', 'migration');
    } else {
      log('User progress tables already exist, no migration needed', 'migration');
    }
    
    return true;
  } catch (error) {
    log(`User progress migration failed: ${error}`, 'migration');
    throw error;
  }
}