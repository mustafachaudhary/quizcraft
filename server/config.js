import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

dotenv.config({ path: path.join(rootDir, envFile) });

export const config = {
  rootDir,
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  sessionMaxAgeMs: 1000 * 60 * 60 * 24 * 7,
  clientDist: path.join(rootDir, 'client', 'dist'),
};

if (!config.databaseUrl) {
  throw new Error(
    `DATABASE_URL is missing. Create ${envFile} from .env.example and set it.`,
  );
}

if (!config.sessionSecret) {
  throw new Error(
    `SESSION_SECRET is missing. Create ${envFile} from .env.example and set it.`,
  );
}
