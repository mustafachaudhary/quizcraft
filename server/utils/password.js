import bcrypt from 'bcrypt';
import { config } from '../config.js';

export function hashPassword(password) {
  return bcrypt.hash(password, config.bcryptRounds);
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
