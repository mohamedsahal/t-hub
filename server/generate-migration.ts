import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize drizzle with the pool
const db = drizzle(pool);

async function main() {
  console.log('Generating migrations...');
  
  try {
    // Generate migrations using drizzle-kit
    const { stdout, stderr } = await execPromise('npx drizzle-kit generate:pg');
    
    if (stderr) {
      console.error('Error generating migrations:', stderr);
      process.exit(1);
    }
    
    console.log(stdout);
    console.log('Migrations generated successfully');
    
    // Apply migrations to the database
    console.log('Applying migrations to database...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations applied successfully');
    
    await pool.end();
  } catch (error) {
    console.error('Migration process failed:', error);
    await pool.end();
    process.exit(1);
  }
}

main();