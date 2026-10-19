import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export async function applySchema() {
  const sql = await fs.readFile(path.join(here, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await applySchema();
    console.log('QuizCraft database schema applied.');
  } catch (error) {
    console.error('Could not apply the schema:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
