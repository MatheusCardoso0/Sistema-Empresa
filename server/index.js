require('dotenv').config();

const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.API_PORT || 3000);
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET precisa estar definido no ambiente.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function readAccessToken(request) {
  const cookies = request.headers.cookie || '';
  const accessToken = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('access_token='));

  return accessToken ? decodeURIComponent(accessToken.slice('access_token='.length)) : null;
}

function requireAuthentication(request, response, next) {
  const token = readAccessToken(request);

  if (!token) {
    return response.status(401).json({ message: 'Autenticação necessária.' });
  }

  try {
    request.auth = jwt.verify(token, jwtSecret);
    return next();
  } catch (_error) {
    return response.status(401).json({ message: 'Sessão expirada.' });
  }
}

app.use(cors({ origin: process.env.APP_ORIGIN || 'http://localhost:4200', credentials: true }));
app.use(express.json());

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', database: 'connected' });
  } catch (_error) {
    response.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.post('/api/auth/login', async (request, response) => {
  const { username, password } = request.body || {};

  if (!username || !password) {
    return response.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, username, password_hash, role, active FROM users WHERE username = $1',
      [username]
    );
    const user = result.rows[0];

    if (!user || !user.active || !(await bcrypt.compare(password, user.password_hash))) {
      return response.status(401).json({ message: 'Usuário ou senha inválidos.' });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, username: user.username },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    response.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000
    });

    return response.json({
      user: { id: user.id, name: user.name, username: user.username, role: user.role }
    });
  } catch (_error) {
    return response.status(500).json({ message: 'Não foi possível realizar o login.' });
  }
});

app.post('/api/auth/logout', (_request, response) => {
  response.clearCookie('access_token');
  response.status(204).send();
});

app.get('/api/auth/me', requireAuthentication, async (request, response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, username, role FROM users WHERE id = $1 AND active = TRUE',
      [request.auth.sub]
    );
    const user = result.rows[0];

    if (!user) {
      return response.status(401).json({ message: 'Usuário não encontrado.' });
    }

    return response.json({ user });
  } catch (_error) {
    return response.status(500).json({ message: 'Não foi possível validar a sessão.' });
  }
});

app.listen(port, () => {
  console.log(`API disponível em http://localhost:${port}`);
});
