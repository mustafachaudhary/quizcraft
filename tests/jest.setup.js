import { pool } from '../server/db/pool.js';

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await pool.end();
});
