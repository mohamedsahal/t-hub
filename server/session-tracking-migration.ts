import { db } from './db';
import { userSessions, userLocationHistory } from '../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * This script creates the user_sessions and user_location_history tables
 * to support anti-account sharing features.
 */
export async function createSessionTrackingTables() {
  try {
    console.log('Checking if tables exist...');
    
    // Check if the user_sessions table exists
    const userSessionsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_sessions'
      );
    `);
    
    // Check if the user_location_history table exists
    const locationHistoryExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_location_history'
      );
    `);
    
    // Create session_status enum if it doesn't exist
    const enumExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'session_status'
      );
    `);
    
    if (!enumExists.rows[0].exists) {
      console.log('Creating session_status enum...');
      await db.execute(sql`
        CREATE TYPE session_status AS ENUM ('active', 'inactive', 'revoked', 'suspicious');
      `);
    }
    
    // Create user_sessions table if it doesn't exist
    if (!userSessionsExists.rows[0].exists) {
      console.log('Creating user_sessions table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          session_id TEXT NOT NULL UNIQUE,
          device_info TEXT,
          ip_address TEXT,
          location TEXT,
          status session_status NOT NULL DEFAULT 'active',
          is_mobile BOOLEAN DEFAULT FALSE,
          browser_name TEXT,
          browser_version TEXT,
          os_name TEXT,
          os_version TEXT,
          last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMP,
          revocation_reason TEXT
        );
      `);
      console.log('user_sessions table created successfully');
    } else {
      console.log('user_sessions table already exists');
    }
    
    // Create user_location_history table if it doesn't exist
    if (!locationHistoryExists.rows[0].exists) {
      console.log('Creating user_location_history table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_location_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          session_id INTEGER NOT NULL REFERENCES user_sessions(id),
          ip_address TEXT NOT NULL,
          country_code TEXT,
          country_name TEXT,
          region_name TEXT,
          city TEXT,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          is_suspicious BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('user_location_history table created successfully');
    } else {
      console.log('user_location_history table already exists');
    }
    
    console.log('Migration complete');
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  }
}

async function main() {
  const success = await createSessionTrackingTables();
  if (success) {
    console.log('Session tracking tables migration completed successfully');
  } else {
    console.error('Session tracking tables migration failed');
  }
  process.exit(0);
}

// Run the migration when this script is executed directly
if (require.main === module) {
  main();
}