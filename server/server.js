import { app } from './app.js';
import { config } from './config.js';
import { pool } from './db/pool.js';

async function start() {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('Could not reach PostgreSQL. Is the database running?');
    console.error(error.message);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`QuizCraft API listening on http://localhost:${config.port}`);
    if (!config.isProduction) {
      console.log('Frontend dev server: http://localhost:5173');
    }
  });

  async function shutdown(signal) {
    console.log(`\n${signal} received. Closing down.`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
