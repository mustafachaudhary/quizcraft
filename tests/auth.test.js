import bcrypt from 'bcrypt';
import { pool } from '../server/db/pool.js';
import { makeAgent, registerUser } from './helpers.js';

describe('authentication', () => {
  test('registers a user, hashes the password and starts a session', async () => {
    const agent = makeAgent();
    const response = await agent
      .post('/api/auth/register')
      .send({ username: 'Alice_1', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.user.username).toBe('alice_1');
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.headers['set-cookie'][0]).toContain('quizcraft.sid');

    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE username = $1',
      ['alice_1'],
    );
    expect(rows[0].password_hash).not.toBe('password123');
    expect(await bcrypt.compare('password123', rows[0].password_hash)).toBe(true);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ username: 'alice_1' });
  });

  test('rejects a duplicate username', async () => {
    await registerUser(makeAgent(), 'alice');
    const response = await makeAgent()
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'password123' });

    expect(response.status).toBe(409);
    expect(response.body.fields.username).toBeDefined();
  });

  test('rejects a short password with a field message', async () => {
    const response = await makeAgent()
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.fields.password).toBeDefined();
  });

  test('logs in with a correct password and rejects a wrong one', async () => {
    const ownerAgent = makeAgent();
    await registerUser(ownerAgent, 'alice');

    const wrong = await makeAgent()
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'not-the-password' });
    expect(wrong.status).toBe(401);

    const agent = makeAgent();
    const response = await agent
      .post('/api/auth/login')
      .send({ username: 'ALICE', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe('alice');

    const me = await agent.get('/api/auth/me');
    expect(me.body.user.username).toBe('alice');
  });

  test('logs out and clears the session', async () => {
    const agent = makeAgent();
    await registerUser(agent, 'alice');

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);

    const me = await agent.get('/api/auth/me');
    expect(me.body.user).toBeNull();
  });

  test('protects authenticated endpoints', async () => {
    const response = await makeAgent().get('/api/me/dashboard');
    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/log in/i);
  });
});
