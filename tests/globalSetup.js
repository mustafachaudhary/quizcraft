import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '..', '.env.test') });

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'Tests need a DATABASE_URL in .env.test. Point it at a disposable PostgreSQL database.',
    );
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    const schema = await fs.readFile(
      path.join(here, '..', 'server', 'db', 'schema.sql'),
      'utf8',
    );
    await client.query(schema);
  } finally {
    await client.end();
  }
}
