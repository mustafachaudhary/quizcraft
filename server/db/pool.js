import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: config.isTest ? 5 : 10,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});
