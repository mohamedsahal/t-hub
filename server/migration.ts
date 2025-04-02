import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';

// This script will create database tables based on our schema
async function main() {
  console.log('Running migrations...');
  
  try {
    // Create the migration directory if it doesn't exist
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();