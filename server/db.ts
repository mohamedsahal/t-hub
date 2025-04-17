import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';

const { Pool } = pg;

// Parse connection string or use explicit parameters
const getConnectionConfig = () => {
  // Use explicit connection parameters instead of connection string
  return {
    user: 'thubapp',
    password: 'thubapp',
    host: 'localhost',
    port: 5432,
    database: 'thub_innovation',
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
};

// Create a PostgreSQL connection pool
export const pool = new Pool(getConnectionConfig());

// Initialize drizzle with the pool
export const db = drizzle(pool, { schema });