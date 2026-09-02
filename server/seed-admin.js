require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error('Defina ADMIN_NAME, ADMIN_USERNAME e ADMIN_PASSWORD no ambiente.');
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await pool.query(
    `INSERT INTO users (name, username, password_hash, role)
     VALUES ($1, $2, $3, 'ADMIN')
     ON CONFLICT (username) DO UPDATE
     SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = 'ADMIN', active = TRUE`,
    [ADMIN_NAME, ADMIN_USERNAME, passwordHash]
  );
}

seedAdmin()
  .then(() => console.log('Administrador criado/atualizado com sucesso.'))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
