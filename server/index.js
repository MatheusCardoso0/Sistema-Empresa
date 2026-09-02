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

function requireAdmin(request, response, next) {
  if (request.auth?.role !== 'ADMIN') {
    return response.status(403).json({ message: 'Acesso permitido apenas para administradores.' });
  }
  return next();
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

app.put('/api/auth/me', requireAuthentication, async (request, response) => {
  const { name, username, password } = request.body || {};
  if (!name || !username) {
    return response.status(400).json({ message: 'Nome e usuário são obrigatórios.' });
  }

  try {
    const passwordClause = password ? ', password_hash = $3' : '';
    const values = password
      ? [name, username, await bcrypt.hash(password, 12), request.auth.sub]
      : [name, username, request.auth.sub];
    const result = await pool.query(
      `UPDATE users SET name = $1, username = $2${passwordClause}
       WHERE id = $${password ? 4 : 3} AND active = TRUE
       RETURNING id, name, username, role`,
      values
    );
    if (!result.rows[0]) return response.status(404).json({ message: 'Usuário não encontrado.' });
    return response.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ message: 'Este usuário já existe.' });
    return response.status(500).json({ message: 'Não foi possível atualizar sua conta.' });
  }
});

app.get('/api/clients', requireAuthentication, async (_request, response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, cpf, cnpj, birth_date, address, address_number,
              complement, email, phone, created_at, updated_at
       FROM clients ORDER BY name`
    );
    return response.json(result.rows);
  } catch (_error) {
    return response.status(500).json({ message: 'Não foi possível carregar os clientes.' });
  }
});

app.post('/api/clients', requireAuthentication, async (request, response) => {
  const client = request.body || {};

  if (!client.name || (!client.cpf && !client.cnpj) || !client.birth_date || !client.email || !client.phone || !client.address || !client.address_number) {
    return response.status(400).json({ message: 'Preencha nome, documento, nascimento, contato e endereço do cliente.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO clients
       (name, cpf, cnpj, birth_date, address, address_number, complement, email, phone)
       VALUES ($1, $2, $3, NULLIF($4, '')::date, $5, $6, $7, $8, $9)
       RETURNING *`,
      [client.name, client.cpf || null, client.cnpj || null, client.birth_date || '',
        client.address || null, client.address_number || null, client.complement || null,
        client.email || null, client.phone || null]
    );
    const createdClient = result.rows[0];
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [request.auth.sub, 'CREATE', 'CLIENT', createdClient.id]
    );
    return response.status(201).json(createdClient);
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ message: 'CPF ou CNPJ já cadastrado.' });
    }
    return response.status(500).json({ message: 'Não foi possível cadastrar o cliente.' });
  }
});

app.put('/api/clients/:id', requireAuthentication, async (request, response) => {
  const client = request.body || {};

  if (!client.name || (!client.cpf && !client.cnpj) || !client.birth_date || !client.email || !client.phone || !client.address || !client.address_number) {
    return response.status(400).json({ message: 'Preencha nome, documento, nascimento, contato e endereço do cliente.' });
  }

  try {
    const result = await pool.query(
      `UPDATE clients SET name = $1, cpf = $2, cnpj = $3, birth_date = NULLIF($4, '')::date,
       address = $5, address_number = $6, complement = $7, email = $8, phone = $9,
       updated_at = NOW() WHERE id = $10 RETURNING *`,
      [client.name, client.cpf || null, client.cnpj || null, client.birth_date || '',
        client.address || null, client.address_number || null, client.complement || null,
        client.email || null, client.phone || null, request.params.id]
    );
    if (!result.rows[0]) {
      return response.status(404).json({ message: 'Cliente não encontrado.' });
    }
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [request.auth.sub, 'UPDATE', 'CLIENT', request.params.id]
    );
    return response.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ message: 'CPF ou CNPJ já cadastrado.' });
    }
    return response.status(500).json({ message: 'Não foi possível atualizar o cliente.' });
  }
});

app.delete('/api/clients/:id', requireAuthentication, async (request, response) => {
  try {
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [request.params.id]);
    if (!result.rows[0]) {
      return response.status(404).json({ message: 'Cliente não encontrado.' });
    }
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [request.auth.sub, 'DELETE', 'CLIENT', request.params.id]
    );
    return response.status(204).send();
  } catch (_error) {
    return response.status(500).json({ message: 'Não foi possível excluir o cliente.' });
  }
});

app.get('/api/insurances', requireAuthentication, async (_request, response) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.client_id, c.name AS client_name, i.insurance_type,
              i.insurer, i.policy_number, i.start_date, i.end_date, i.status, i.notes
       FROM insurances i JOIN clients c ON c.id = i.client_id
       ORDER BY i.end_date NULLS LAST, c.name`
    );
    return response.json(result.rows);
  } catch (_error) {
    return response.status(500).json({ message: 'Não foi possível carregar os seguros.' });
  }
});

app.post('/api/insurances', requireAuthentication, async (request, response) => {
  const insurance = request.body || {};
  if (!insurance.client_id || !insurance.insurance_type || !insurance.insurer || !insurance.start_date || !insurance.end_date || insurance.end_date < insurance.start_date) {
    return response.status(400).json({ message: 'Cliente, tipo, seguradora e uma vigência válida são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO insurances
       (client_id, insurance_type, insurer, policy_number, start_date, end_date, status, notes)
       VALUES ($1, $2, $3, $4, NULLIF($5, '')::date, NULLIF($6, '')::date, $7, $8)
       RETURNING *`,
      [insurance.client_id, insurance.insurance_type, insurance.insurer, insurance.policy_number || null,
        insurance.start_date || '', insurance.end_date || '', insurance.status || 'ATIVO', insurance.notes || null]
    );
    const created = result.rows[0];
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [request.auth.sub, 'CREATE', 'INSURANCE', created.id]
    );
    return response.status(201).json(created);
  } catch (error) {
    if (error.code === '23503') {
      return response.status(400).json({ message: 'Cliente não encontrado.' });
    }
    return response.status(500).json({ message: 'Não foi possível cadastrar o seguro.' });
  }
});

app.put('/api/insurances/:id', requireAuthentication, async (request, response) => {
  const insurance = request.body || {};
  if (!insurance.client_id || !insurance.insurance_type || !insurance.insurer || !insurance.start_date || !insurance.end_date || insurance.end_date < insurance.start_date) {
    return response.status(400).json({ message: 'Cliente, tipo, seguradora e uma vigência válida são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `UPDATE insurances SET client_id = $1, insurance_type = $2, insurer = $3,
       policy_number = $4, start_date = NULLIF($5, '')::date, end_date = NULLIF($6, '')::date,
       status = $7, notes = $8, updated_at = NOW() WHERE id = $9 RETURNING *`,
      [insurance.client_id, insurance.insurance_type, insurance.insurer, insurance.policy_number || null,
        insurance.start_date || '', insurance.end_date || '', insurance.status || 'ATIVO', insurance.notes || null,
        request.params.id]
    );
    if (!result.rows[0]) {
      return response.status(404).json({ message: 'Seguro não encontrado.' });
    }
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [request.auth.sub, 'UPDATE', 'INSURANCE', request.params.id]
    );
    return response.json(result.rows[0]);
  } catch (_error) {
    return response.status(500).json({ message: 'Não foi possível atualizar o seguro.' });
  }
});

app.delete('/api/insurances/:id', requireAuthentication, async (request, response) => {
  try {
    const result = await pool.query('DELETE FROM insurances WHERE id = $1 RETURNING id', [request.params.id]);
    if (!result.rows[0]) {
      return response.status(404).json({ message: 'Seguro não encontrado.' });
    }
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
      [request.auth.sub, 'DELETE', 'INSURANCE', request.params.id]
    );
    return response.status(204).send();
  } catch (_error) {
    return response.status(500).json({ message: 'Não foi possível excluir o seguro.' });
  }
});

app.get('/api/users', requireAuthentication, requireAdmin, async (_request, response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, username, role, active, created_at FROM users ORDER BY name'
    );
    return response.json(result.rows);
  } catch (_error) {
    return response.status(500).json({ message: 'Não foi possível carregar os usuários.' });
  }
});

app.post('/api/users', requireAuthentication, requireAdmin, async (request, response) => {
  const user = request.body || {};
  if (!user.name || !user.username || !user.password) {
    return response.status(400).json({ message: 'Nome, usuário e senha são obrigatórios.' });
  }

  try {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, username, password_hash, role, active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, name, username, role, active, created_at`,
      [user.name, user.username, passwordHash, user.role || 'CORRETOR']
    );
    return response.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ message: 'Este usuário já existe.' });
    }
    return response.status(500).json({ message: 'Não foi possível criar o usuário.' });
  }
});

app.put('/api/users/:id', requireAuthentication, requireAdmin, async (request, response) => {
  const user = request.body || {};
  if (!user.name || !user.username) {
    return response.status(400).json({ message: 'Nome e usuário são obrigatórios.' });
  }

  try {
    const passwordClause = user.password ? ', password_hash = $5' : '';
    const values = [user.name, user.username, user.role || 'CORRETOR', user.active !== false, request.params.id];
    if (user.password) values.splice(4, 0, await bcrypt.hash(user.password, 12));
    const result = await pool.query(
      `UPDATE users SET name = $1, username = $2, role = $3, active = $4${passwordClause}
       WHERE id = $${user.password ? 6 : 5}
       RETURNING id, name, username, role, active, created_at`,
      values
    );
    if (!result.rows[0]) return response.status(404).json({ message: 'Usuário não encontrado.' });
    return response.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ message: 'Este usuário já existe.' });
    return response.status(500).json({ message: 'Não foi possível atualizar o usuário.' });
  }
});

app.delete('/api/users/:id', requireAuthentication, requireAdmin, async (request, response) => {
  if (String(request.auth.sub) === String(request.params.id)) {
    return response.status(400).json({ message: 'Você não pode excluir o próprio usuário.' });
  }
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [request.params.id]);
    if (!result.rows[0]) return response.status(404).json({ message: 'Usuário não encontrado.' });
    return response.status(204).send();
  } catch (_error) {
    return response.status(500).json({ message: 'Não foi possível excluir o usuário.' });
  }
});

app.listen(port, () => {
  console.log(`API disponível em http://localhost:${port}`);
});
