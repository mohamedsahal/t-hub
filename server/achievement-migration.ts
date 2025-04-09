/**
 * This script adds achievement-related tables to the database
 */

import { db } from './db';
import { sql } from 'drizzle-orm';

export async function addAchievementTables() {
  console.log('[migration] Adding achievement tables...');

  try {
    // Check if achievement_category enum exists
    const checkAchievementCategoryEnum = await db.execute(sql`
      SELECT typname FROM pg_type 
      WHERE typname = 'achievement_category'
    `);

    if (checkAchievementCategoryEnum.rows.length === 0) {
      console.log('[migration] Creating achievement_category enum...');
      await db.execute(sql`
        CREATE TYPE achievement_category AS ENUM (
          'enrollment', 'progress', 'completion', 'engagement', 'performance', 'streak'
        )
      `);
    }

    // Check if achievement_tier enum exists
    const checkAchievementTierEnum = await db.execute(sql`
      SELECT typname FROM pg_type 
      WHERE typname = 'achievement_tier'
    `);

    if (checkAchievementTierEnum.rows.length === 0) {
      console.log('[migration] Creating achievement_tier enum...');
      await db.execute(sql`
        CREATE TYPE achievement_tier AS ENUM (
          'bronze', 'silver', 'gold', 'platinum', 'diamond'
        )
      `);
    }

    // Check if user_achievements table exists
    const checkUserAchievementsTable = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE tablename = 'user_achievements'
    `);

    if (checkUserAchievementsTable.rows.length === 0) {
      console.log('[migration] Creating user_achievements table...');
      await db.execute(sql`
        CREATE TABLE user_achievements (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          achievement_id TEXT NOT NULL,
          earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          progress INTEGER DEFAULT 0,
          is_notified BOOLEAN DEFAULT FALSE,
          metadata TEXT
        )
      `);
    }

    // Check if achievement_progress table exists
    const checkAchievementProgressTable = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE tablename = 'achievement_progress'
    `);

    if (checkAchievementProgressTable.rows.length === 0) {
      console.log('[migration] Creating achievement_progress table...');
      await db.execute(sql`
        CREATE TABLE achievement_progress (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          achievement_id TEXT NOT NULL,
          current_value INTEGER DEFAULT 0 NOT NULL,
          target_value INTEGER NOT NULL,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          metadata TEXT
        )
      `);
    }

    // Check if achievement_points table exists
    const checkAchievementPointsTable = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE tablename = 'achievement_points'
    `);

    if (checkAchievementPointsTable.rows.length === 0) {
      console.log('[migration] Creating achievement_points table...');
      await db.execute(sql`
        CREATE TABLE achievement_points (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          total_points INTEGER DEFAULT 0 NOT NULL,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
    }

    console.log('[migration] Successfully added achievement tables!');
  } catch (error) {
    console.error('[migration] Error adding achievement tables:', error);
    throw error;
  }
}

// Using ES modules - no direct execution check
// Export a function to run the migration independently if needed
export async function runAchievementMigration() {
  try {
    await addAchievementTables();
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}